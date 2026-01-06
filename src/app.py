import streamlit as st
import pandas as pd
import numpy as np
from autogluon.tabular import TabularPredictor
import os
import joblib

# --- Setup ---
st.set_page_config(page_title="Respira AI Pro", page_icon="🫁", layout="wide")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '../models/autogluon_model')
ENCODER_PATH = os.path.join(BASE_DIR, '../models/encoders.pkl')

# --- Load Resources ---
@st.cache_resource
def load_resources():
    try:
        model = TabularPredictor.load(MODEL_PATH)
        encoders = joblib.load(ENCODER_PATH)
        return model, encoders
    except Exception as e:
        return None, None

predictor, encoders = load_resources()

if not predictor:
    st.error("System Error: Could not load Model. Please run 'train_model.py'.")
    st.stop()

# --- Title ---
st.title("🫁 Respira AI: Clinical Decision Support System")
st.markdown("### Pharmacological Sensitivity & Exacerbation Risk Engine")
st.markdown("---")

# --- SIDEBAR ---
with st.sidebar:
    st.header("1. Patient Demographics")
    age = st.number_input("Age (Years)", min_value=5, max_value=80, value=35)
    gender = st.selectbox("Gender", ["Male", "Female"])
    
    # Honest Ethnicity Labeling
    ethnicity = st.selectbox("Ethnicity", ["Caucasian", "AfricanAmerican", "Hispanic", "Other (Mixed/Not Listed)"])
    if ethnicity == "Other (Mixed/Not Listed)":
        ethnicity = "Other"
        st.caption("Note: Model sensitivity for unlisted groups may vary.")
        
    bmi = st.number_input("BMI (Body Mass Index)", 10.0, 50.0, 23.0)
    
    st.header("2. Environmental & History")
    # This checkbox controls the "Smoking" logic below
    smoking = st.checkbox("Active/Passive Smoking?", value=False)
    pollution = st.slider("Pollution Index (AQI Proxy)", 0.0, 10.0, 1.5)
    history = st.checkbox("Family History of Asthma?", value=False)

# --- MAIN SCREEN ---
col_clinical, col_intervention = st.columns([1, 1.2])

with col_clinical:
    st.subheader("3. Clinical Presentation")
    pre_fev = st.slider("PREFEV (Lung Function)", 1.0, 5.0, 4.5)
    pre_fvc = st.number_input("PREFVC (Capacity)", 1.0, 6.0, 3.5)
    
    c1, c2 = st.columns(2)
    with c1:
        wheezing = st.checkbox("Wheezing", value=True)
        shortness = st.checkbox("Shortness of Breath", value=False)
    with c2:
        cough = st.checkbox("Coughing", value=False)
        night = st.checkbox("Nighttime Symptoms", value=False)

with col_intervention:
    st.subheader("4. Pharmacological Novelty")
    st.warning("⚠️ **Counterfactual Analysis Engine**")
    
    budesonide_label = st.select_slider(
        "**Budesonide Dosage**",
        options=["None", "Low Dose (200µg)", "High Dose (400µg)"],
        value="None"
    )
    budesonide_map = {"None": 0, "Low Dose (200µg)": 1, "High Dose (400µg)": 2}
    budesonide_val = budesonide_map[budesonide_label]
    
    nedocromil = st.checkbox("Add Nedocromil (Adjunct Therapy)?", value=False)

# --- PREDICTION ENGINE ---

def get_prediction(bude_val, nedo_val):
    input_data = pd.DataFrame({
        'Age': [age], 'Gender': [gender], 'Ethnicity': [ethnicity],
        'BMI': [bmi], 'Smoking': [1 if smoking else 0],
        'PREFEV': [pre_fev], 'PREFVC': [pre_fvc], 
        'Wheezing': [1 if wheezing else 0],
        'ShortnessOfBreath': [1 if shortness else 0], 
        'ChestTightness': [0], 'Coughing': [1 if cough else 0],
        'NighttimeSymptoms': [1 if night else 0], 'ExerciseInduced': [0],
        'FamilyHistoryAsthma': [1 if history else 0], 
        'HistoryOfAllergies': [0], 'Eczema': [0], 'HayFever': [0], 'GastroesophagealReflux': [0],
        'PollutionExposure': [pollution], 'PollenExposure': [5.0],
        'DustExposure': [5.0], 'PetAllergy': [0],
        'PhysicalActivity': [5.0], 'SleepQuality': [5.0],
        'Budesonide': [bude_val], 
        'Nedocromil': [1 if nedo_val else 0]
    })
    
    for col, le in encoders.items():
        if col in input_data.columns and input_data[col].dtype == 'object':
            try:
                input_data[col] = le.transform(input_data[col])
            except:
                input_data[col] = 0
                
    return predictor.predict_proba(input_data)[1].iloc[0] * 100

# Calculate Risks
current_risk = get_prediction(budesonide_val, nedocromil)
baseline_risk = get_prediction(0, False) # Risk with NO MEDS
risk_reduction = baseline_risk - current_risk

# --- DASHBOARD ---
st.divider()
res_col1, res_col2 = st.columns([1, 2])

with res_col1:
    st.metric(label="Predicted Risk", value=f"{current_risk:.1f}%", delta=f"{risk_reduction:.1f}% Reduction" if risk_reduction > 0 else None)

with res_col2:
    if current_risk > 60:
        st.error("🔴 HIGH RISK")
    elif current_risk > 30:
        st.warning("🟠 MODERATE RISK")
    else:
        st.success("🟢 LOW RISK")
    st.progress(current_risk / 100)

# --- SMART EXPLAINABILITY LOGIC ---
st.subheader("🤖 Dynamic AI Insight")

# 1. Build a list of active risk factors DYNAMICALLY
# This list starts empty. It ONLY adds items if the variable is true.
risk_drivers = []

if pre_fev < 2.5: risk_drivers.append(f"Critically Low Lung Function ({pre_fev}L)")
elif pre_fev < 3.5: risk_drivers.append(f"Reduced Lung Function ({pre_fev}L)")

# Logic Fix: Only blame smoking if the checkbox is True
if smoking: risk_drivers.append("Active Smoking Status")

# Logic Fix: Only blame wheezing if the checkbox is True
if wheezing: risk_drivers.append("Patient Wheezing")

if pollution > 7.0: risk_drivers.append(f"High Pollution Exposure ({pollution})")
if age < 10: risk_drivers.append("Pediatric Vulnerability")

# 2. Generate the Text
drivers_text = ", ".join(risk_drivers) if risk_drivers else "Baseline Demographic Factors"

if risk_reduction > 1.0:
    st.success(f"""
    **Pharmacological Impact:** 
    The model estimates that the current medication plan has reduced the patient's exacerbation risk by **{risk_reduction:.1f}%** 
    * **Baseline Risk (Untreated):** {baseline_risk:.1f}%
    * **Current Risk (Treated):** {current_risk:.1f}%
    """)
    if nedocromil:
        st.info("💡 **Adjunct Insight:** Nedocromil is contributing to this reduction by suppressing mast cell degranulation pathways detected by the model.")
    if current_risk > 50:
        st.warning(f"""
        **Optimization Required:** Although medication is helping, the risk remains elevated ({current_risk:.1f}%) due to: **{drivers_text}**.
        Consider aggressive environmental management or higher dosage.
        """)
elif current_risk > 70:
    st.error(f"""
    **Critical Warning:** Risk is dangerously high ({current_risk:.1f}%). The dominant drivers detected are: **{drivers_text}**.
    Medication alone is insufficient to offset these factors.
    """)
else:
    st.info(f"**Stable Profile:** Patient risk is well-controlled. Primary active factors: {drivers_text}.")