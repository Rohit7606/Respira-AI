
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env", override=True)
api_key = os.environ.get("GEMINI_API_KEY")

print(f"Key: {api_key[:10]}...")

client = genai.Client(api_key=api_key, http_options={'timeout': 10})

models = ['gemini-2.0-flash', 'models/gemini-2.0-flash']

for m in models:
    try:
        print(f"Testing {m}...")
        response = client.models.generate_content(model=m, contents='Hi')
        print(f"✅ SUCCESS with {m}: {response.text}")
        import sys; sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED with {m}: {e}")
