import pandas as pd
import numpy as np
import shap
import matplotlib.pyplot as plt
from autogluon.tabular import TabularPredictor
import os
import joblib  # Needed to load the encoders

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '../models/autogluon_model')
DATA_PATH = os.path.join(BASE_DIR, '../data/final_asthma_dataset.csv')
ENCODER_PATH = os.path.join(BASE_DIR, '../models/encoders.pkl') # Path to your saved encoders
IMG_DIR = os.path.join(BASE_DIR, '../reports/figures')
TARGET = 'Exacerbation'

# Ensure the folder exists
os.makedirs(IMG_DIR, exist_ok=True)

def run_xai():
    print("1. Loading Model and Data...")
    try:
        predictor = TabularPredictor.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    df = pd.read_csv(DATA_PATH)

    # --- NEW STEP: Apply the Encoders ---
    # We must convert text (Male/Female) to numbers (0/1) because the model expects numbers.
    print("1b. Encoding categorical data...")
    try:
        encoders = joblib.load(ENCODER_PATH)
        for col, le in encoders.items():
            if col in df.columns:
                # Transform the column (e.g., 'Male' -> 1)
                df[col] = le.transform(df[col])
        print("   -> Encoding successful.")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not load encoders. {e}")
        return

    # Now df contains only numbers, so the model will accept it.
    X = df.drop(columns=[TARGET])
    
    # Take a smaller sample for SHAP analysis
    X_sample = X.sample(100, random_state=42)

    # --- Wrapper for AutoGluon ---
    def model_predict(data_as_array):
        # Convert numpy array back to DataFrame
        temp_df = pd.DataFrame(data_as_array, columns=X.columns)
        
        # Ensure data types are correct (integers for the encoded columns)
        for col in X.columns:
             # If the original column was integer (like our encoded ones), force it back to int
            if pd.api.types.is_integer_dtype(X[col]):
                temp_df[col] = temp_df[col].astype(int)
                
        return predictor.predict_proba(temp_df)[1].values

    print("2. Preparing Background Data...")
    background_data = X.sample(50, random_state=42)
    
    # Initialize the Explainer
    explainer = shap.KernelExplainer(model_predict, background_data)
    
    print("3. Explaining predictions (This may take 1-2 minutes)...")
    shap_values = explainer.shap_values(X_sample)

    print("4. Saving Global Summary Plot...")
    plt.figure()
    shap.summary_plot(shap_values, X_sample, show=False)
    
    save_path = os.path.join(IMG_DIR, "shap_global_summary.png")
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    print(f"✅ Saved: {save_path}")

    print("\n--- XAI Analysis Complete ---")

if __name__ == "__main__":
    run_xai()