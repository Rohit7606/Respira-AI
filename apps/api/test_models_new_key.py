
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env", override=True)
api_key = os.environ.get("GEMINI_API_KEY")

print(f"API Key: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

print("Auto-discovering working models...")
for m in client.models.list():
    if "generateContent" not in m.supported_generation_methods:
        continue
    
    model_name = m.name # e.g. models/gemini-1.5-flash
    # clean name? client accepts either 'gemini-1.5-flash' or 'models/gemini-1.5-flash'
    # usually better to use the bare name if possible, but safely we can use m.name
    
    print(f"\nTesting {model_name}...")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents='Hello'
        )
        print(f"✅ FOUND WORKING MODEL: {model_name}")
        print(response.text)
        break # Stop at first working one
    except Exception as e:
        print(f"❌ {model_name}: {e}")
