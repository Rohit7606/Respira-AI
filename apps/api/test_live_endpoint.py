
import requests
import json

url = "http://127.0.0.1:8000/explain"

data = {
    "query": "Why is my risk high?",
    "features": {
        "age": 65,
        "gender": "Male",
        "smoking": "Current Smoker",
        "spo2": 88,
        "fev1": 1.2,
        "pef": 120,
        "wheezing": True,
        "shortness_of_breath": True,
        "height": 175,
        "weight": 80
    },
    "risk_score": 0.85
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
    
    with open("error_log_safe.txt", "w", encoding="utf-8") as f:
        f.write(response.text)
    
    if "offline mode" in response.text:
        print("\n❌ FAILURE: Server returned offline mode.")
    else:
        print("\n✅ SUCCESS: Server returned AI response.")

except Exception as e:
    print(f"❌ CONNECTION ERROR: {e}")
