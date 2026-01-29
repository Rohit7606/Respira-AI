
import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env")

try:
    from services.explainer import explainer_service
    
    print("Testing Explainer Service with google-genai...")
    
    # Dummy Data
    query = "Why is my risk high?"
    features = {
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
    }
    risk_score = 0.95
    
    response = explainer_service.generate_response(query, features, risk_score)
    
    print("\n--- RESPONSE START ---")
    print(response)
    print("--- RESPONSE END ---\n")
    
    if "offline mode" in response:
        print("❌ FAILED: Still in offline mode.")
        sys.exit(1)
    else:
        print("✅ SUCCESS: Online mode validated.")
        sys.exit(0)
        
except Exception as e:
    print(f"❌ CRASHED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
