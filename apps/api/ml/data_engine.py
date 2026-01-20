import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import LabelEncoder
import joblib
import os

DATASET_PATH = "d:/College/College Projects/Respira-AI/final_asthma_dataset.csv"
OUTPUT_DIR = "ml/artifacts"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def load_and_prep_data():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    # 1. Feature Engineering & Cleaning
    # Drop irrelevant or target-leaky columns if any (keeping most for now)
    # Target: We need a binary risk or continuous risk score.
    # The dataset has 'Exacerbation' (0/1) which is a good proxy for High Risk.
    
    # Encoding Categoricals
    le_gender = LabelEncoder()
    le_ethnicity = LabelEncoder()
    
    df['Gender'] = le_gender.fit_transform(df['Gender'])
    df['Ethnicity'] = le_ethnicity.fit_transform(df['Ethnicity'])
    
    # Save encoders for inference time
    joblib.dump(le_gender, f"{OUTPUT_DIR}/le_gender.pkl")
    joblib.dump(le_ethnicity, f"{OUTPUT_DIR}/le_ethnicity.pkl")
    
    # Features X and Target y
    # We want to predict 'Exacerbation' probability as Risk Score
    target_col = 'Exacerbation'
    
    # Drop target and unrelated columns
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    print(f"Original shape: {X.shape}")
    print(f"Class distribution:\n{y.value_counts()}")
    
    return X, y

def augment_data(X, y):
    print("\nAugmenting data with SMOTE and Medical Noise...")
    
    # 1. SMOTE (Synthetic Minority Over-sampling Technique)
    # This creates synthetic examples of the minority class (High Risk)
    smote = SMOTE(random_state=42)
    X_res, y_res = smote.fit_resample(X, y)
    
    print(f"After SMOTE shape: {X_res.shape}")
    
    # 2. Gaussian Noise Injection (Medical Variance)
    # Duplicate the dataset 5 times with slight noise to simulate measurement errors/natural variance
    # e.g. Age 25 -> 25.2, 24.8 (doesn't change risk much but robustifies model)
    
    X_augmented = [X_res]
    y_augmented = [y_res]
    
    for _ in range(5):
        noise = np.random.normal(0, 0.05, X_res.shape) # 5% variance
        X_noisy = X_res + (X_res * noise) 
        
        # Keep categorical columns integer-like (rounding)
        # Gender (1), Ethnicity (2), Smoking (3), MosquitoCoil (5), Wheezing (10), Nedocromil (13) are indices in this dataset
        # Let's be careful. We essentially want to jitter continuous vars: Pollution (4), PREFVC (6), PREFEV (7), BMI (11)
        
        # Revert noise on categoricals
        # Categorical columns: Gender, Ethnicity, Smoking, MosquitoCoil, Budesonide, Wheezing, ShortnessOfBreath, Nedocromil
        cat_cols = ['Gender', 'Ethnicity', 'Smoking', 'MosquitoCoil', 'Budesonide', 'Wheezing', 'ShortnessOfBreath', 'Nedocromil']
        
        # Ensure we are working with a DataFrame with correct columns
        if not isinstance(X_noisy, pd.DataFrame):
            X_noisy = pd.DataFrame(X_noisy, columns=X.columns)
            
        if not isinstance(X_res, pd.DataFrame):
             X_res = pd.DataFrame(X_res, columns=X.columns)
             
        for col in cat_cols:
            if col in X_noisy.columns:
                X_noisy[col] = X_res[col].values
        
        X_augmented.append(X_noisy)
        y_augmented.append(y_res)
        
    X_final = pd.concat(X_augmented, axis=0)
    y_final = pd.concat(y_augmented, axis=0)
    
    print(f"Final Augmented shape: {X_final.shape}")
    
    return X_final, y_final

    return X_final, y_final

def generate_healthy_controls(n_samples=2000, original_cols=None):
    print(f"\nGenerating {n_samples} Synthetic Healthy Controls (Anchoring)...")
    
    # Heuristics for healthy people
    # Age: 18-70
    ages = np.random.randint(18, 70, n_samples)
    
    # Gender: 0/1
    genders = np.random.randint(0, 2, n_samples)
    
    # FEV1: High (3.5 - 5.5)
    fev1 = np.random.uniform(3.5, 5.5, n_samples)
    
    # PEF: High (400 - 700)
    pef = np.random.uniform(400, 700, n_samples)
    
    # SpO2: 97-100
    spo2 = np.random.randint(97, 101, n_samples)
    
    # Symptoms: 0
    zeros = np.zeros(n_samples)
    
    # Pollution: varied (even healthy people live in cities)
    pollution = np.random.uniform(5, 50, n_samples) # PM2.5 5-50
    
    data = {
        'Age': ages,
        'Gender': genders,
        'Ethnicity': np.random.randint(0, 4, n_samples),
        'Smoking': np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1]), # Mostly non-smokers
        'PollutionExposure': pollution,
        'MosquitoCoil': zeros,
        'PREFVC': fev1 * 1.2, # Ratio ~80%
        'PREFEV': fev1,
        'Budesonide': zeros,
        'Wheezing': zeros,
        'BMI': np.random.uniform(20, 28, n_samples),
        'ShortnessOfBreath': zeros,
        'Nedocromil': zeros
    }
    
    # Ensure dataframe matches X structure
    df_healthy = pd.DataFrame(data)
    
    # If original columns order matters or inputs are specific
    if original_cols is not None:
        df_healthy = df_healthy[original_cols]
        
    y_healthy = pd.Series(np.zeros(n_samples)) # Target 0
    
    return df_healthy, y_healthy

if __name__ == "__main__":
    X, y = load_and_prep_data()
    X_aug, y_aug = augment_data(X, y)
    
    # Add Healthy Anchors
    X_healthy, y_healthy = generate_healthy_controls(2000, original_cols=X.columns)
    
    # Align columns just in case
    X_healthy = X_healthy[X_aug.columns]
    
    X_final = pd.concat([X_aug, X_healthy], axis=0)
    y_final = pd.concat([y_aug, y_healthy], axis=0)
    
    print(f"Final Training Set: {X_final.shape}")
    
    # Save processed data for training
    X_final.to_csv(f"{OUTPUT_DIR}/X_train.csv", index=False)
    y_final.to_csv(f"{OUTPUT_DIR}/y_train.csv", index=False)
    print("Data Engine Complete. Artifacts saved.")
