import pandas as pd
import numpy as np
from autogluon.tabular import TabularPredictor
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix, classification_report
import joblib
import os

# --- Configuration ---
# Point this to your NEW file
DATA_PATH = '../data/final_asthma_dataset.csv' 
MODEL_SAVE_PATH = '../models/autogluon_model'
ENCODER_SAVE_PATH = '../models/encoders.pkl'
TARGET = 'Exacerbation'

# UPDATE: We now use your full rich feature set
FEATURES = [
    'Age', 'Gender', 'Ethnicity', 'BMI', 'Smoking',
    'PREFEV', 'PREFVC', 
    'Wheezing', 'ShortnessOfBreath', 'ChestTightness', 
    'Coughing', 'NighttimeSymptoms', 'ExerciseInduced',
    'FamilyHistoryAsthma', 'HistoryOfAllergies',
    'Eczema', 'HayFever', 'GastroesophagealReflux',
    'PollutionExposure', 'PollenExposure', 'DustExposure', 'PetAllergy',
    'PhysicalActivity', 'SleepQuality',
    'Budesonide', 'Nedocromil'
]

def load_and_preprocess(path):
    print("Loading Data...")
    df = pd.read_csv(path)
    
    # Ensure we only use the columns we defined
    df = df[FEATURES + [TARGET]]
    
    # Clean: Drop rows with missing values (if any)
    df = df.dropna()
    
    # --- ENCODING ---
    # AutoGluon handles text, but SMOTE needs numbers.
    # We encode categorical text columns (like 'Gender', 'Ethnicity', etc.)
    label_encoders = {}
    categorical_cols = df.select_dtypes(include=['object']).columns
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
        print(f"Encoded {col}...")
        
    return df, label_encoders

def train():
    # 1. Load Data
    df, encoders = load_and_preprocess(DATA_PATH)
    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    # 2. SMOTE (Class Balancing)
    # This is critical because "Exacerbation" (1) is usually rare.
    print(f"\nOriginal Class Distribution: {np.bincount(y)}")
    smote = SMOTE(random_state=42)
    X_res, y_res = smote.fit_resample(X, y)
    print(f"Resampled Class Distribution: {np.bincount(y_res)}")
    
    # Recombine for AutoGluon
    train_data = pd.DataFrame(X_res, columns=X.columns)
    train_data[TARGET] = y_res

    # 3. Train/Test Split
    train_df, test_df = train_test_split(train_data, test_size=0.2, random_state=42)

    # 4. AutoGluon Training
    print("\nStarting AutoGluon Training...")
    # 'best_quality' = Heavy ensemble (Stacking). High accuracy, slower training.
    # 'medium_quality' = Faster, good for debugging.
    predictor = TabularPredictor(label=TARGET, path=MODEL_SAVE_PATH).fit(
        train_data=train_df,
        presets='best_quality', 
        time_limit=180  # 3 minutes limit (Increase if you have time)
    )

    # 5. Evaluation
    print("\n--- Final Evaluation ---")
    y_pred = predictor.predict(test_df)
    y_prob = predictor.predict_proba(test_df)[1] # Prob of Class 1
    
    acc = accuracy_score(test_df[TARGET], y_pred)
    auc = roc_auc_score(test_df[TARGET], y_prob)
    
    print(f"Accuracy: {acc:.4f}")
    print(f"AUC-ROC: {auc:.4f}")
    print("\nConfusion Matrix:\n", confusion_matrix(test_df[TARGET], y_pred))
    
    # Feature Importance (Quick Check)
    print("\nTop 5 Important Features:")
    print(predictor.feature_importance(test_df).head(5))

    # 6. Save Artifacts
    joblib.dump(encoders, ENCODER_SAVE_PATH)
    print("\nModel and Encoders Saved Successfully.")

if __name__ == "__main__":
    os.makedirs('../models', exist_ok=True)
    train()