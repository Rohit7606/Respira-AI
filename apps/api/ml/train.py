import pandas as pd
import xgboost as xgb
import joblib
import os
import numpy as np
from sklearn.metrics import accuracy_score, recall_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH = os.path.join(BASE_DIR, "model_xgb.json")

def train_model():
    print("Loading data...")
    X_train = pd.read_csv(f"{ARTIFACTS_DIR}/X_train.csv")
    y_train = pd.read_csv(f"{ARTIFACTS_DIR}/y_train.csv")
    X_test_full = pd.read_csv(f"{ARTIFACTS_DIR}/X_test.csv")
    y_test_full = pd.read_csv(f"{ARTIFACTS_DIR}/y_test.csv")
    
    # SPLIT Test Data into "Threshold Tuning" (50%) and "Final Evaluation" (50%)
    # We MUST tune the threshold on Real Data, not Synthetic Data
    from sklearn.model_selection import train_test_split
    X_val_tune, X_test_final, y_val_tune, y_test_final = train_test_split(
        X_test_full, y_test_full, test_size=0.5, random_state=42, stratify=y_test_full
    )
    
    print(f"Training on {len(X_train)} augmented records.")
    print(f"Tuning Threshold on {len(X_val_tune)} REAL records.")
    print(f"Final Eval on {len(X_test_final)} REAL records.")
    
    # When using SMOTE, the training data is balanced. 
    # So we do NOT need scale_pos_weight (or set it to 1).
    scale_weight = 1.0
    
    print(f"Scale Pos Weight used: {scale_weight:.4f}")

    print("\n--- Training Model ---")
    # Features will now be: Age, Gender, BMI, Smoking, Wheezing, FEV1_Pct, PEF_Pct, SpO2, Pollution
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=5, 
        learning_rate=0.05,
        objective='binary:logistic',
        eval_metric='logloss',
        scale_pos_weight=scale_weight,
        use_label_encoder=False,
        random_state=42
    )
    
    model.fit(X_train, y_train.values.ravel())
    
    print("\n--- Tuning Threshold on Real Data ---")
    y_proba_tune = model.predict_proba(X_val_tune)[:, 1]
    
    print(f"Probabilities stats: Min={y_proba_tune.min():.4f}, Max={y_proba_tune.max():.4f}, Mean={y_proba_tune.mean():.4f}")

    best_thresh = 0.5
    best_acc = 0.0
    best_rec = 0.0
    
    # Grid Search for Threshold
    search_thresholds = np.linspace(0.01, 0.99, 99)
    
    TARGET_RECALL = 0.88
    
    TARGET_RECALL = 0.88
    
    print(f"Searching for Threshold with Recall >= {TARGET_RECALL}...")
    
    candidates = []
    
    for thresh in search_thresholds:
        preds = (y_proba_tune >= thresh).astype(int)
        rec = recall_score(y_val_tune, preds)
        acc = accuracy_score(y_val_tune, preds)
        
        if rec >= 0.70: # Log more candidates to see the curve
            candidates.append((thresh, acc, rec))
            
    if candidates:
        # Sort by Accuracy (Descending)
        candidates.sort(key=lambda x: x[1], reverse=True)
        
        print("\nTop 5 Candidates (Max Accuracy):")
        for c in candidates[:5]:
             print(f"Thresh: {c[0]:.4f} | Acc: {c[1]:.4f} | Recall: {c[2]:.4f}")
             
        # Pick best valid one
        valid_candidates = [c for c in candidates if c[2] >= TARGET_RECALL]
        if valid_candidates:
            best_candidate = valid_candidates[0] # Already sorted by Acc
        else:
             print("No candidate met strict target. Picking best recall from top acc.")
             best_candidate = candidates[0]
             
        best_thresh = best_candidate[0]
        best_acc = best_candidate[1]
        best_rec = best_candidate[2]
        print(f"Selected: {best_thresh:.4f} (Rec: {best_rec:.4f})")
    else:
        print("Warning: No threshold met target recall. Picking max recall threshold within range.")
        # Fallback: Just maximize recall or pick lowest threshold
        best_thresh = 0.3
    
        
    print(f"Optimal Threshold Selected: {best_thresh:.4f}")
    
    # Apply to Tuning Set to see impact (Verification)
    acc_tune = accuracy_score(y_val_tune, (y_proba_tune >= best_thresh).astype(int))
    rec_tune = recall_score(y_val_tune, (y_proba_tune >= best_thresh).astype(int))
    print(f"Tune Set Performance -> Acc: {acc_tune:.4f}, Recall: {rec_tune:.4f}")
    
    print("\n--- Final Test Set Evaluation (Unseen Data) ---")
    y_final_proba = model.predict_proba(X_test_final)[:, 1]
    y_final_pred = (y_final_proba >= best_thresh).astype(int)
    
    final_acc = accuracy_score(y_test_final, y_final_pred)
    final_rec = recall_score(y_test_final, y_final_pred)
    
    print(f"Test Accuracy: {final_acc:.4f}")
    print(f"Test Recall:   {final_rec:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test_final, y_final_pred))
    
    final_model = model
    final_model.save_model(MODEL_PATH)
    
    with open(f"{ARTIFACTS_DIR}/threshold.txt", "w") as f:
        f.write(str(best_thresh))

    # Save Metrics JSON
    import json
    metrics = {
        "threshold": best_thresh,
        "accuracy": final_acc,
        "recall": final_rec,
        "candidates": candidates[:5] if candidates else []
    }
    with open(f"{ARTIFACTS_DIR}/metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)
        
    print(f"Final Model saved to {MODEL_PATH}")
    print(f"Threshold saved to {ARTIFACTS_DIR}/threshold.txt")
    print(f"Metrics saved to {ARTIFACTS_DIR}/metrics.json")

if __name__ == "__main__":
    train_model()
