
import os
import sys
from google import genai
from dotenv import load_dotenv

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(".env", override=True)
api_key = os.environ.get("GEMINI_API_KEY")

print(f"Key: {api_key[:10]}...")
sys.stdout.flush()

client = genai.Client(api_key=api_key, http_options={'timeout': 30})

models = ['models/gemini-2.0-flash-001']

for m in models:
    try:
        print(f"Testing {m}...")
        sys.stdout.flush()
        response = client.models.generate_content(model=m, contents='Hi')
        print(f"✅ SUCCESS with {m}: {response.text}")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED with {m}: {e}")
        sys.stdout.flush()
