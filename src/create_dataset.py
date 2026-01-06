import pandas as pd
import numpy as np
import os

# --- Configuration ---
# This ensures we save it exactly where train_model.py looks for it
# We use abspath to avoid "current working directory" confusion
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, '../data')
OUTPUT_FILE = 'final_asthma_dataset.csv'
FULL_PATH = os.path.join(OUTPUT_DIR, OUTPUT_FILE)

def create_synthetic_data():
    print("Generating synthetic CAMP-style dataset...")
    np.random.seed(42)
    n_samples = 2000

    # 1. Generate Basic Features
    data = {
        'Age': np.random.randint(5, 18, n_samples),
        'Gender': np.random.choice(['Male', 'Female'], n_samples),
        'Ethnicity': np.random.choice(['Caucasian', 'AfricanAmerican', 'Hispanic', 'Other'], n_samples),
        'BMI': np.random.normal(22, 5, n_samples).round(1),
        'Smoking': np.random.choice([0, 1], n_samples, p=[0.9, 0.1]), # 0=No, 1=Yes
        
        # Lung Function (Critical for Novelty)
        'PREFEV': np.random.normal(2.8, 0.5, n_samples).round(2),
        'PREFVC': np.random.normal(3.5, 0.6, n_samples).round(2),
        
        # Symptoms (For SHAP)
        'Wheezing': np.random.choice([0, 1], n_samples),
        'ShortnessOfBreath': np.random.choice([0, 1], n_samples),
        'ChestTightness': np.random.choice([0, 1], n_samples),
        'Coughing': np.random.choice([0, 1], n_samples),
        'NighttimeSymptoms': np.random.choice([0, 1], n_samples),
        'ExerciseInduced': np.random.choice([0, 1], n_samples),
        
        # History
        'FamilyHistoryAsthma': np.random.choice([0, 1], n_samples),
        'HistoryOfAllergies': np.random.choice([0, 1], n_samples),
        'Eczema': np.random.choice([0, 1], n_samples),
        'HayFever': np.random.choice([0, 1], n_samples),
        'GastroesophagealReflux': np.random.choice([0, 1], n_samples),
        
        # Environmental
        'PollutionExposure': np.random.uniform(0, 10, n_samples).round(1),
        'PollenExposure': np.random.uniform(0, 10, n_samples).round(1),
        'DustExposure': np.random.uniform(0, 10, n_samples).round(1),
        'PetAllergy': np.random.choice([0, 1], n_samples),
        
        # Lifestyle
        'PhysicalActivity': np.random.uniform(0, 10, n_samples).round(1),
        'SleepQuality': np.random.uniform(0, 10, n_samples).round(1),
        
        # --- THE NOVELTY (MEDICATION) ---
        'Budesonide': np.random.choice([0, 1, 2], n_samples, p=[0.3, 0.4, 0.3]), # 0=None, 1=Low, 2=High
        'Nedocromil': np.random.choice([0, 1], n_samples),
    }

    df = pd.DataFrame(data)

    # 2. Generate Target (Exacerbation) based on Logic
    # We want the model to learn: Bad Lungs + No Meds = Attack (1)
    def get_target(row):
        risk_score = 0
        
        # Risk Factors
        if row['PREFEV'] < 2.5: risk_score += 2
        if row['Wheezing'] == 1: risk_score += 1.5
        if row['Smoking'] == 1: risk_score += 1
        if row['PollutionExposure'] > 7: risk_score += 1
        
        # Mitigation (Medication lowers risk!)
        if row['Budesonide'] == 1: risk_score -= 1.5
        if row['Budesonide'] == 2: risk_score -= 2.5
        if row['Nedocromil'] == 1: risk_score -= 1.0
        
        # Add random noise
        risk_score += np.random.normal(0, 0.5)
        
        return 1 if risk_score > 0.5 else 0

    df['Exacerbation'] = df.apply(get_target, axis=1)

    # 3. Save to Correct Folder
    # Create 'data' directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    df.to_csv(FULL_PATH, index=False)
    print(f"✅ Success! Dataset saved to: {os.path.abspath(FULL_PATH)}")
    print(f"Class Balance: {df['Exacerbation'].value_counts().to_dict()}")

if __name__ == "__main__":
    create_synthetic_data()