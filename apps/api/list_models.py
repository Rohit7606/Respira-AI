
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env", override=True)
api_key = os.environ.get("GEMINI_API_KEY")

print(f"API Key: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    # Pager object, need to iterate
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"❌ FAILED: {e}")
