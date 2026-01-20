import numpy as np
from sklearn.ensemble import IsolationForest
import random
from typing import Dict, Any, List

class AnomalyDetector:
    def __init__(self):
        self.clf = IsolationForest(
            n_estimators=100,
            contamination=0.05,  # We expect ~5% of data to be outliers
            random_state=42,
            n_jobs=-1
        )
        self.is_fitted = False
        self._fit_on_synthetic_data()

    def _fit_on_synthetic_data(self):
        """
        Refitted to be less aggressive. Uses broader distributions to avoid flagging
        healthy athletes or slightly deviations as 'anomalies'.
        """
        # Feature order: [age, fev1, pef, spo2]
        
        # Generate normal data (Broad medical ranges)
        n_samples = 10000
        
        # Age: Uniform-ish from 5 to 90
        ages = np.random.uniform(5, 90, n_samples)
        
        # FEV1: Normal Mean 3.5, SD 1.2, clipped 0.5-6.0
        # Covers both kids (low FEV1) and athletes (high FEV1)
        fev1s = np.clip(np.random.normal(3.5, 1.2, n_samples), 0.5, 7.0)
        
        # PEF: Mean 400, SD 150, clipped 50-800
        pefs = np.clip(np.random.normal(400, 150, n_samples), 50, 800)
        
        # SpO2: Mean 96, SD 3, clipped 80-100
        # Allow wider range of 'acceptable' saturation before calling it an anomaly (vs critical risk)
        spo2s = np.clip(np.random.normal(96, 3, n_samples), 80, 100)
        
        X = np.column_stack((ages, fev1s, pefs, spo2s))
        
        # Fit with low contamination - only flag strictly weird combos
        self.clf.set_params(contamination=0.01)
        self.clf.fit(X)
        self.is_fitted = True
        print("✅ Anomaly Detector Fitted (Relaxed Mode)")

    def detect(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns: { 'is_outlier': bool, 'anomaly_score': float, 'flagged_features': List[str] }
        """
        features = np.array([[
            data['age'],
            data['fev1'],
            data['pef'],
            data['spo2']
        ]])
        
        # Predict: -1 for outlier, 1 for inlier
        prediction = self.clf.predict(features)[0]
        # Score: Lower is more anomalous
        score = self.clf.decision_function(features)[0]
        
        is_outlier = prediction == -1
        
        flagged = []
        if is_outlier:
            # Heuristic explanation for why it's an outlier (Logic for UI)
            if data['age'] > 90 or data['age'] < 5: flagged.append("Unusual Age")
            if data['fev1'] > 6.0 or data['fev1'] < 0.8: flagged.append("Extreme FEV1")
            if data['pef'] > 700 or data['pef'] < 100: flagged.append("Extreme PEF")
            if data['spo2'] < 85: flagged.append("Critical SpO2")
            if not flagged: flagged.append("Unusual Combination")

        return {
            "is_outlier": is_outlier,
            "anomaly_score": float(score),
            "flagged_features": flagged
        }

anomaly_detector = AnomalyDetector()
