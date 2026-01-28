
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
import joblib
import os

# Updated Path
DATASET_PATH = r"d:\College\College Projects\Respira-AI\Dataset\master_dataset.csv"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def load_and_prep_data():
    print(f"Loading dataset from {DATASET_PATH}...")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
        
    df = pd.read_csv(DATASET_PATH)
    
    # 1. Feature Engineering & Cleaning
    # The master dataset is already standardized: Age, Gender, BMI, Smoking, Wheezing, Diagnosis
    
    # Target
    target_col = 'Diagnosis'
    
    # Ensure numeric types
    # Ensure numeric types
    numeric_cols = ['Age', 'BMI', 'Gender', 'Smoking', 'Wheezing', 'FEV1', 'PEF', 'FEV1_Pct', 'PEF_Pct', 'SpO2', 'Pollution', 'Diagnosis']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Features X and Target y
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Original shape: {X.shape}")
    print(f"Class distribution:\n{y.value_counts()}")
    
    return X, y

def augment_data(X, y):
    print("\nAugmenting data with SMOTE...")
    
    # 1. SMOTE (Synthetic Minority Over-sampling Technique)
    try:
        smote = SMOTE(random_state=42)
        X_res, y_res = smote.fit_resample(X, y)
        print(f"After SMOTE shape: {X_res.shape}")
        
        return X_res, y_res
    except Exception as e:
        print(f"SMOTE failed: {e}. Using original data.")
        return X, y

def process_and_save_data():
    X, y = load_and_prep_data()
    
    # Check Class Balance
    print(f"Class Distribution: \n{y.value_counts()}")
    
    # Augment (Optional, but good for imbalance)
    X, y = augment_data(X, y)

    # 1. Simple 80/20 Split
    print("Splitting data (80/20)...")
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training Set: {X_train.shape}")
    print(f"Test Set: {X_test.shape}")
    
    # Save processed data
    X_train.to_csv(os.path.join(OUTPUT_DIR, "X_train.csv"), index=False)
    y_train.to_csv(os.path.join(OUTPUT_DIR, "y_train.csv"), index=False)
    X_test.to_csv(os.path.join(OUTPUT_DIR, "X_test.csv"), index=False)
    y_test.to_csv(os.path.join(OUTPUT_DIR, "y_test.csv"), index=False)
    
    print(f"Data Engine Complete. Artifacts saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    process_and_save_data()

