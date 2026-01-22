from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init failed: {e}")

# Trigger reload for new model artifacts
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    patient_name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=120)
    fev1: float = Field(..., ge=0.5, le=8.0, description="Liters")
    pef: int = Field(..., ge=50, le=700, description="L/min")
    spo2: int = Field(..., ge=70, le=100, description="Percentage")
    zip_code: str = Field(..., pattern=r"^\d{6}$")
    gender: str = Field(..., description="Male or Female")
    smoking: str = Field(..., description="Non-smoker, Ex-smoker, Current Smoker")
    wheezing: bool = Field(False)
    shortness_of_breath: bool = Field(False)
    height: float = Field(None, description="Height in cm")
    weight: float = Field(None, description="Weight in kg")
    medication_use: bool = Field(False, description="Currently taking medication")

class PredictionInterval(BaseModel):
    lower_bound: float
    upper_bound: float

class TrustSignal(BaseModel):
    trust_rating: str = Field(..., pattern="^(high|medium|low)$")
    prediction_interval: PredictionInterval

class Prediction(BaseModel):
    risk_score: float


# Services
from services.environmental import env_service, EnvironmentalData
from services.anomaly import anomaly_detector
from services.telemetry import telemetry_service

# Models
class AnomalyDetection(BaseModel):
    is_outlier: bool
    anomaly_score: float
    flagged_features: list[str] = []

class PredictionResponse(BaseModel):
    prediction: Prediction
    trust_signal: TrustSignal
    environmental_data: EnvironmentalData
    anomaly_detection: AnomalyDetection

# API Endpoints
# ML Artifacts
import joblib
import xgboost as xgb
import pandas as pd
import numpy as np

ML_DIR = "ml/artifacts"
MODEL_PATH = "ml/model_xgb.json"
model = None
le_gender = None
le_ethnicity = None

def load_ml_artifacts():
    global model, le_gender, le_ethnicity
    try:
        model = xgb.XGBClassifier()
        model.load_model(MODEL_PATH)
        le_gender = joblib.load(f"{ML_DIR}/le_gender.pkl")
        le_ethnicity = joblib.load(f"{ML_DIR}/le_ethnicity.pkl")
        print("ML Model and Encoders loaded successfully.")
    except Exception as e:
        print(f"Error loading ML artifacts: {e}")

# Load on startup
load_ml_artifacts()


# API Endpoints
@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    # 1. Fetch Environmental Context (Rule 2)
    env_data = await env_service.get_data(request.zip_code)

    # 2. Anomaly Detection (Rule 5)
    features = request.dict()
    anomaly_result = anomaly_detector.detect(features)
    
    if anomaly_result['is_outlier']:
        telemetry_service.log_trust_event("ANOMALY_DETECTED", {
             "inputs": features,
             "score": anomaly_result['anomaly_score'],
             "reasons": anomaly_result['flagged_features']
        })

    # 3. Hybrid Safety Layer (The "Old Brain" Guardrail)
    # Critical Logic: If vital signs are critical, override any ML prediction.
    if request.spo2 < 90 or request.pef < 200:
        print("CRITICAL OVERRIDE: SpO2 < 90 or PEF < 200 detected. Forcing High Risk.")
        risk = 0.99
        trust_rating = "high" # High trust because this is a physiological certainty
        uncertainty_range = 0.01
        
        # Log this critical event
        telemetry_service.log_trust_event("CRITICAL_OVERRIDE", features)
        
    elif model is not None:
        # 4. ML Prediction (The "New Brain")
        try:
            # Prepare Strictly Validated Input for XGBoost
            # Model expects: ['Age', 'Gender', 'BMI', 'Smoking', 'Wheezing']
            
            # Mappings (Hardcoded for reliability)
            gender_map = {"Male": 0, "Female": 1} # Standard: 0=Male, 1=Female
            gender_val = gender_map.get(request.gender, 0)
            
            smoking_map = {"Non-smoker": 0, "Ex-smoker": 1, "Current Smoker": 2}
            smoking_val = smoking_map.get(request.smoking, 0)
            
            # BMI Calculation (or default)
            bmi = 22.0
            if request.height and request.weight and request.height > 0:
                height_m = request.height / 100
                bmi = request.weight / (height_m * height_m)
            
            # Create DataFrame with exact column order
            input_data = pd.DataFrame([{
                'Age': request.age,
                'Gender': gender_val,
                'BMI': bmi,
                'Smoking': smoking_val,
                'Wheezing': 1 if request.wheezing else 0
            }])
            
            # Predict Probability
            prob = model.predict_proba(input_data)[0][1]
            risk = float(prob)
            
            # --- ENVIRONMENTAL PENALTY ---
            # If air quality is bad (PM2.5 > 50), slight risk boost.
            if env_data.pm25 > 50:
                print(f"Applying Environmental Penalty (PM2.5={env_data.pm25})")
                risk = min(0.99, risk + 0.05)
            
            # Uncertainty
            uncertainty_range = 0.2 * (1 - abs(risk - 0.5) * 2) 
            uncertainty_range = max(0.05, uncertainty_range)
            
            trust_rating = "high" if uncertainty_range < 0.1 else "medium"
            if anomaly_result['is_outlier']:
                trust_rating = "low"
            

        except Exception as e:
            import traceback
            traceback.print_exc() # Print full stack trace to console
            print(f"ML Inference Error: {e}. Falling back to heuristics.")
            risk = 0.5 # Fallback
            uncertainty_range = 0.5
            trust_rating = "low"
    else:
        # Fallback if model load failed
        print("Model not loaded. Using fallback.")
        risk = 0.1 # Default low
        trust_rating = "low"
        uncertainty_range = 0.5

    # Clamp risk
    risk = max(0.01, min(0.99, risk))

    # PERSISTENCE: Save to Supabase
    try:
        data = {
            "patient_name": request.patient_name,
            "age": request.age,
            "fev1": request.fev1,
            "pef": request.pef,
            "spo2": request.spo2,
            "zip_code": request.zip_code,
            "risk_score": risk,
            "uncertainty": uncertainty_range,
            "trust_rating": trust_rating,
            "gender": request.gender,
            "smoking": request.smoking,
            "wheezing": request.wheezing,
            "shortness_of_breath": request.shortness_of_breath,
            "bmi": bmi, # Calculated value
            "medication_use": request.medication_use
        }
        supabase.table("predictions").insert(data).execute()
    except Exception as e:
        print(f"Error saving to Supabase: {e}")

    return {
        "prediction": {
            "risk_score": risk
        },
        "trust_signal": {
            "trust_rating": trust_rating,
            "prediction_interval": {
                "lower_bound": max(0, risk - uncertainty_range),
                "upper_bound": min(1, risk + uncertainty_range)
            }
        },
        "environmental_data": env_data,
        "anomaly_detection": anomaly_result
    }


# ... (existing imports)
from services.explainer import explainer_service

class ExplanationRequest(BaseModel):
    query: str
    features: dict
    risk_score: float

class ExplanationResponse(BaseModel):
    text: str

# ... (existing code)

@app.post("/explain", response_model=ExplanationResponse)
async def explain_risk(request: ExplanationRequest):
    response_text = explainer_service.generate_response(
        request.query, 
        request.features, 
        request.risk_score
    )
    return {"text": response_text}

@app.get("/history")
def get_history():
    try:
        response = supabase.table("predictions").select("*").order("created_at", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

@app.get("/stats")
def get_stats():
    try:
        # Fetch all predictions (just necessary columns) to calculate stats
        response = supabase.table("predictions").select("risk_score,fev1").execute()
        rows = response.data 
        
        total_patients = len(rows)
        if total_patients == 0:
            return {
                "total_patients": 0,
                "high_risk_count": 0,
                "avg_fev1": 0.0
            }
            
        high_risk = len([r for r in rows if r['risk_score'] > 0.7])
        avg_fev1 = sum([r['fev1'] for r in rows]) / total_patients
        
        return {
            "total_patients": total_patients,
            "high_risk_count": high_risk,
            "avg_fev1": avg_fev1
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {
            "total_patients": 0,
            "high_risk_count": 0,
            "avg_fev1": 0.0
        }

