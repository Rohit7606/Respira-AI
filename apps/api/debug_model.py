
import xgboost as xgb
import pandas as pd
import joblib

MODEL_PATH = "ml/model_xgb.json"
ARTIFACTS_DIR = "ml/artifacts"

def debug():
    # Load model
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    # Feature Importance
    print("\nFeature Importances:")
    print(model.get_booster().get_score(importance_type='gain'))
    
    # Test Vector (Healthy)
    # columns: Age, Gender, Ethnicity, Smoking, PollutionExposure, MosquitoCoil, PREFVC, PREFEV, Budesonide, Wheezing, BMI, ShortnessOfBreath, Nedocromil
    cols = ['Age', 'Gender', 'Ethnicity', 'Smoking', 'PollutionExposure', 'MosquitoCoil', 'PREFVC', 'PREFEV', 'Budesonide', 'Wheezing', 'BMI', 'ShortnessOfBreath', 'Nedocromil']
    
    healthy = pd.DataFrame([{
        'Age': 25,
        'Gender': 1, # Male
        'Ethnicity': 0,
        'Smoking': 0,
        'PollutionExposure': 10.0,
        'MosquitoCoil': 0,
        'PREFVC': 5.0,
        'PREFEV': 4.0,
        'Budesonide': 0,
        'Wheezing': 0,
        'BMI': 22.0,
        'ShortnessOfBreath': 0,
        'Nedocromil': 0
    }], columns=cols)
    
    cols_order = healthy.columns.tolist()
    print(f"\nTest DF Columns: {cols_order}")
    
    p_healthy = model.predict_proba(healthy)[0][1]
    print(f"\nHealthy Prediction: {p_healthy:.4f}")
    
    # Test Vector (Sick)
    sick = healthy.copy()
    sick['Age'] = 75
    sick['Smoking'] = 1 # Smoker? (Wait, dataset values might be 0/1/2? Need to check data encoding)
    sick['Wheezing'] = 1
    sick['ShortnessOfBreath'] = 1
    sick['PREFEV'] = 1.5
    sick['PREFVC'] = 2.0
    sick['PollutionExposure'] = 50.0
    
    p_sick = model.predict_proba(sick)[0][1]
    print(f"Sick Prediction: {p_sick:.4f}")

if __name__ == "__main__":
    debug()
