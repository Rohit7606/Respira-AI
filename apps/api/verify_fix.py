import requests
import json

base_url = "http://localhost:8000"

def predict(name, fev1, pef, spo2, smoke="Non-smoker"):
    payload = {
        "patient_name": name,
        "age": 55,
        "gender": "Male",
        "smoking": smoke,
        "zip_code": "123456",
        "fev1": fev1,
        "pef": pef,
        "spo2": spo2,
        "height": 175,
        "weight": 80,
        "wheezing": False,
        "shortness_of_breath": False,
        "medication_use": False
    }
    try:
        r = requests.post(f"{base_url}/predict", json=payload)
        if r.status_code != 200:
            print(f"Error {r.status_code}: {r.text}")
        data = r.json()
        risk = data['prediction']['risk_score']
        print(f"[{name}] FEV1={fev1}, PEF={pef}, SpO2={spo2} -> Risk: {risk:.4f}")
        return risk
    except Exception as e:
        print(f"Failed: {e}")
        return -1

print("--- Verifying Model Sensitivity to Lung Function ---")

# 1. Healthy
h_risk = predict("HealthyFilter", 4.0, 550, 98)

# 2. Impaired (Should be HIGH risk now, previously was LOW)
i_risk = predict("ImpairedFilter", 2.2, 320, 94)

# 3. Critical (Safety Net)
c_risk = predict("CriticalFilter", 1.0, 150, 88)

print("\n--- Results ---")
if i_risk > 0.5 and i_risk > h_risk + 0.3:
    print("SUCCESS: Model correctly identified non-critical impairment!")
else:
    print(f"FAILURE: Model did not penalize impairment enough. (Healthy={h_risk}, Impaired={i_risk})")
