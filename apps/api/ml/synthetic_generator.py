import pandas as pd
import numpy as np
import random
import sys
import os

# Add parent directory to path to allow importing clinical service
# Current: apps/api/ml/synthetic_generator.py
# Target: apps/api/services/clinical.py
# Root for simple import: apps/api (so we can do 'from services.clinical ...')
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.clinical import clinical_service

def generate_synthetic_data(num_samples=50000):
    """
    Generates a synthetic dataset using Medical Feature Engineering.
    Core Concept: Risk is driven by 'Percent Predicted', not raw values.
    """
    print(f"Generating {num_samples} Standardized Clinical Records...")
    
    data = []
    
    for _ in range(num_samples):
        # --- 1. Demographics ---
        age = np.random.randint(18, 90)
        gender_code = np.random.choice([0, 1]) # 0=Male, 1=Female
        gender_str = "Male" if gender_code == 0 else "Female"
        
        height = np.random.normal(175 if gender_code==0 else 162, 10)
        weight = np.random.normal(80 if gender_code==0 else 65, 15)
        bmi = clinical_service.calculate_bmi(weight, height)
        
        smoking = np.random.choice([0, 1, 2], p=[0.5, 0.3, 0.2])
        wheezing = np.random.choice([0, 1], p=[0.8, 0.2])
        
        # --- 2. Baselines (The "Perfect" Health for this person) ---
        pred_fev1 = clinical_service.calculate_predicted_fev1(age, height, gender_str)
        pred_pef = clinical_service.calculate_predicted_pef(age, height, gender_str)
        
        # --- 3. Health Simulation ---
        # Health Factor (1.0 = 100% of prediction, 0.5 = 50% of prediction)
        health_status = np.random.normal(1.0, 0.15) # Skewed towards healthy
        
        # Environmental / Lifestyle Penalties
        pollution = np.random.randint(0, 100)
        if pollution > 60: health_status -= np.random.uniform(0.0, 0.1)
        if smoking == 2: health_status -= np.random.uniform(0.1, 0.3)
        if wheezing: health_status -= 0.15
        
        # Create "Sick" cohort (20% of data)
        if np.random.random() < 0.2:
            health_status -= np.random.uniform(0.2, 0.5)
            
        # Clamp Health
        health_status = max(0.2, min(1.2, health_status))
        
        # --- 4. Calculate Actuals ---
        fev1 = round(pred_fev1 * health_status, 2)
        pef = int(pred_pef * health_status)
        
        # Calculate Percents (The Features that matter)
        fev1_pct = (fev1 / pred_fev1) * 100
        pef_pct = (pef / pred_pef) * 100
        
        # SpO2 Logic
        # SpO2 usually stays high until severe obstruction
        if fev1_pct < 50:
             spo2 = np.random.randint(85, 94)
        elif fev1_pct < 80:
             spo2 = np.random.randint(92, 97)
        else:
             spo2 = np.random.randint(96, 100)
             
        # --- 5. Risk Calculation (Golden Standard) ---
        # GOLD Guidelines:
        # GOLD 1 (Mild): FEV1 > 80%
        # GOLD 2 (Mod): 50% < FEV1 < 80%
        # GOLD 3 (Severe): 30% < FEV1 < 50%
        # GOLD 4 (Very Severe): FEV1 < 30%
        
        risk_prob = 0.0
        
        if fev1_pct < 30: risk_prob += 0.95 # Critical
        elif fev1_pct < 50: risk_prob += 0.8
        elif fev1_pct < 80: risk_prob += 0.3
        
        if spo2 < 90: risk_prob = 0.99 # Hypoxia is immediate trigger
        elif spo2 < 94: risk_prob += 0.4
        
        if pollution > 70: risk_prob += 0.1
        
        risk_prob = min(0.99, risk_prob)
        diagnosis = 1 if np.random.random() < risk_prob else 0
        
        # Force label for clear training
        if risk_prob > 0.7: diagnosis = 1
        
        data.append({
            'Age': age,
            'Gender': gender_code,
            'BMI': bmi,
            'Smoking': smoking,
            'Wheezing': wheezing,
            'FEV1': fev1,
            'PEF': pef,
            'FEV1_Pct': round(fev1_pct, 1), # NEW FEATURE
            'PEF_Pct': round(pef_pct, 1),   # NEW FEATURE
            'SpO2': spo2,
            'Pollution': pollution,
            'Diagnosis': diagnosis
        })
        
    df = pd.DataFrame(data)
    print(f"Generated {len(df)} Standardized rows.")
    print("Correlation with Diagnosis:")
    print(df.corr()['Diagnosis'].sort_values(ascending=False))
    return df

if __name__ == "__main__":
    df = generate_synthetic_data(50000)
    save_path = r"d:\College\College Projects\Respira-AI\Dataset\master_dataset.csv"
    df.to_csv(save_path, index=False)
    print("Saved.")
