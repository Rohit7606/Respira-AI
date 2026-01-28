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
        print(f"DEBUG: Supabase Client Initialized. URL: {SUPABASE_URL[:10]}...")
    except Exception as e:
        print(f"DEBUG: Supabase init failed: {e}")

# Trigger reload for new model artifacts
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import List, Optional

# --- Patient Identity API ---
class PatientReference(BaseModel):
    patient_id: str
    patient_name: str
    age: int
    zip_code: str
    gender: str
    smoking: str
    height: Optional[float] = None
    weight: Optional[float] = None
    last_visit: Optional[str] = None

@app.get("/patients", response_model=List[PatientReference])
async def search_patients(query: str = ""):
    """Return unique patients for lookup."""
    try:
        # Fetch distinct patients via logical grouping
        response = supabase.table("predictions") \
            .select("patient_id, patient_name, age, zip_code, gender, smoking, height, weight, created_at") \
            .order("created_at", desc=True) \
            .execute()
        
        seen = set()
        results = []
        for r in response.data:
            pid = r.get('patient_id')
            if pid and pid not in seen:
                seen.add(pid)
                p_name = r.get('patient_name') or "Unknown"
                if not query or query.lower() in p_name.lower():
                    results.append({
                        "patient_id": pid,
                        "patient_name": p_name,
                        "age": r.get('age') or 0,
                        "zip_code": r.get('zip_code') or "00000",
                        "gender": r.get('gender') or 'Male',
                        "smoking": r.get('smoking') or 'Non-smoker',
                        "height": r.get('height'),
                        "weight": r.get('weight'),
                        "last_visit": r['created_at']
                    })
        return results[:20]
    except Exception as e:
        print(f"Search error: {e}")
        return []

class PredictionRequest(BaseModel):
    patient_id: Optional[str] = None # NEW: Link to existing patient
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
@app.post("/predict_debug", include_in_schema=False)
async def predict_risk_impl(request: PredictionRequest):
    # 1. Fetch Environmental Context (Rule 2)
    env_data = await env_service.get_data(request.zip_code)

    # 2. Anomaly Detection (Rule 5)
    features = request.dict()
    if "patient_id" in features: del features["patient_id"]
    anomaly_result = anomaly_detector.detect(features)
    
    bmi = 0.0 # Default initialization
    
    if anomaly_result['is_outlier']:
        telemetry_service.log_trust_event("ANOMALY_DETECTED", {
             "inputs": features,
             "score": anomaly_result['anomaly_score'],
             "reasons": anomaly_result['flagged_features']
        })

# ... (imports)
from services.clinical import clinical_service

# ... (API Endpoints, predict_risk function)
@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    # 1. Fetch Environmental Context (Rule 2)
    env_data = await env_service.get_data(request.zip_code)

    # 2. Anomaly Detection (Rule 5)
    features = request.dict()
    if "patient_id" in features: del features["patient_id"]
    anomaly_result = anomaly_detector.detect(features)
    
    # 3. Clinical Feature Engineering (The "Medical Brain")
    # Calculate BMI
    bmi = 22.0
    if request.height and request.weight and request.height > 0:
        bmi = clinical_service.calculate_bmi(request.weight, request.height)
            
    # Calculate Predicted Baselines
    gender_str = request.gender # "Male" or "Female"
    pred_fev1 = clinical_service.calculate_predicted_fev1(request.age, request.height, gender_str)
    pred_pef = clinical_service.calculate_predicted_pef(request.age, request.height, gender_str)
    
    # Calculate Percent Predicted (The "True" Health Metric)
    fev1_pct = round((request.fev1 / pred_fev1) * 100, 1)
    pef_pct = round((request.pef / pred_pef) * 100, 1)
    
    print(f"DEBUG: Clinical Context -> FEV1%={fev1_pct}%, PEF%={pef_pct}%")

    if anomaly_result['is_outlier']:
        telemetry_service.log_trust_event("ANOMALY_DETECTED", {
             "inputs": features,
             "score": anomaly_result['anomaly_score'],
             "reasons": anomaly_result['flagged_features']
        })

    # 4. ML Prediction (TRUST THE MODEL)
    risk = 0.5
    trust_rating = "medium"
    uncertainty_range = 0.2
    
    if model is not None:
        try:
            # Mappings
            gender_map = {"Male": 0, "Female": 1}
            gender_val = gender_map.get(request.gender, 0)
            
            smoking_map = {"Non-smoker": 0, "Ex-smoker": 1, "Current Smoker": 2}
            smoking_val = smoking_map.get(request.smoking, 0)
            
            # New Model features: 
            # ['Age', 'Gender', 'BMI', 'Smoking', 'Wheezing', 'FEV1', 'PEF', 'FEV1_Pct', 'PEF_Pct', 'SpO2', 'Pollution']
            # Note: We now include BOTH raw and percent for maximum context
            input_data = pd.DataFrame([{
                'Age': request.age,
                'Gender': gender_val,
                'BMI': bmi,
                'Smoking': smoking_val,
                'Wheezing': 1 if request.wheezing else 0,
                'FEV1': request.fev1,
                'PEF': request.pef,
                'FEV1_Pct': fev1_pct, # NEW
                'PEF_Pct': pef_pct,   # NEW
                'SpO2': request.spo2,
                'Pollution': env_data.pm25
            }])
            
            # Predict Probability (The "Oracle")
            # The model is now trained to output ~0.99 for SpO2<90 or FEV1%<30
            # So we DO NOT need a manual override.
            prob = model.predict_proba(input_data)[0][1]
            risk = float(prob)
            
            # Trust is high if model is confident (very low or very high risk)
            uncertainty_range = 0.2 * (1 - abs(risk - 0.5) * 2) 
            trust_rating = "high" if uncertainty_range < 0.05 else "medium"
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"ML Inference Error: {e}. Falling back to default.")
            risk = 0.5
            trust_rating = "low"
    else:
        print("Model not loaded.")
        
    # Clamp risk
    risk = max(0.01, min(0.99, risk))

    # PERSISTENCE: Save to Supabase (unchanged logic)
    try:
        final_patient_id = request.patient_id
        if not final_patient_id:
            import uuid
            final_patient_id = str(uuid.uuid4())

        data = {
            "patient_id": final_patient_id, # Link to identity
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
            "height": request.height,
            "weight": request.weight,
            "medication_use": request.medication_use,
            "flagged_features": anomaly_result['flagged_features'] if anomaly_result['is_outlier'] else []
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


@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    try:
        return await predict_risk_impl(request)
    except Exception as e:
        import traceback
        error_msg = f"CRITICAL API ERROR: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": error_msg})

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
        # 1. Efficient Total Count
        total_res = supabase.table("predictions").select("*", count="exact", head=True).execute()
        total_patients = total_res.count or 0
        
        if total_patients == 0:
            return {
                "total_patients": 0,
                "high_risk_count": 0,
                "avg_fev1": 0.0
            }

        # 2. Efficient High Risk Count (Risk > 0.7)
        risk_res = supabase.table("predictions").select("*", count="exact", head=True).gt("risk_score", 0.7).execute()
        high_risk_count = risk_res.count or 0
        
        # 3. Avg FEV1 (Approximation using recent data to stay fast)
        # Fetching strictly the 'fev1' column for the last 1000 records to ensure responsiveness
        fev_res = supabase.table("predictions").select("fev1").order("created_at", desc=True).limit(1000).execute()
        fev_rows = fev_res.data
        
        avg_fev1 = 0.0
        if fev_rows:
            avg_fev1 = sum([r['fev1'] for r in fev_rows]) / len(fev_rows)
        
        return {
            "total_patients": total_patients,
            "high_risk_count": high_risk_count,
            "avg_fev1": round(avg_fev1, 2)
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        # Return zeros on error to avoid crashing the dashboard
        return {
            "total_patients": 0,
            "high_risk_count": 0,
            "avg_fev1": 0.0
        }

# Trigger Reload
# Trigger Reload 2
# Trigger Reload 3
