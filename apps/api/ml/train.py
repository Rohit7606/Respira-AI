
import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.metrics import accuracy_score, recall_score, classification_report

ARTIFACTS_DIR = "ml/artifacts"
MODEL_PATH = "ml/model_xgb.json"

def train_model():
    print("Loading training data...")
    X_train = pd.read_csv(f"{ARTIFACTS_DIR}/X_train.csv")
    y_train = pd.read_csv(f"{ARTIFACTS_DIR}/y_train.csv")
    
    # XGBoost Classifier
    # We use 'scale_pos_weight' to further handle imbalance if SMOTE wasn't enough, 
    # but SMOTE should have balanced it.
    # Objective: binary:logistic for probability output.
    
    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        objective='binary:logistic',
        eval_metric='logloss',
        use_label_encoder=False,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluation (on training set for sanity, ideally should have split val set)
    y_pred = model.predict(X_train)
    acc = accuracy_score(y_train, y_pred)
    rec = recall_score(y_train, y_pred)
    
    print(f"\nModel Evaluation (Training Set):")
    print(f"Accuracy: {acc:.4f}")
    print(f"Recall:   {rec:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_train, y_pred))
    
    # Save Model
    # Using JSON format for better compatibility/interop
    model.save_model(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
