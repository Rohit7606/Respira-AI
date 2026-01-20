
import requests
import json

def test_api():
    url = "http://localhost:8000/predict"
    
    # 1. Healthy Athlete
    payload_healthy = {
        "patient_name": "Test Athlete",
        "age": 25,
        "fev1": 4.0,
        "pef": 500,
        "spo2": 98,
        "zip_code": "110001",
        "gender": "Male",
        "smoking": "Non-smoker",
        "wheezing": False,
        "shortness_of_breath": False,
        "height": 180.0,
        "weight": 75.0,
        "medication_use": False
    }
    
    # 2. Critical Case
    payload_critical = {
        "patient_name": "Test Critical",
        "age": 75,
        "fev1": 1.5,
        "pef": 150,
        "spo2": 88,
        "zip_code": "110001",
        "gender": "Male",
        "smoking": "Current Smoker",
        "wheezing": True,
        "shortness_of_breath": True,
        "height": 170.0,
        "weight": 90.0,
        "medication_use": True
    }
    
    try:
        print("Testing Healthy Case...")
        r1 = requests.post(url, json=payload_healthy)
        print(f"Status: {r1.status_code}")
        print(json.dumps(r1.json(), indent=2))
        
        print("\nTesting Critical Case...")
        r2 = requests.post(url, json=payload_critical)
        print(f"Status: {r2.status_code}")
        print(json.dumps(r2.json(), indent=2))
        
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_api()
