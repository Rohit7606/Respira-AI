
import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(".env", override=True)
api_key = os.environ.get("OPENAI_API_KEY")

print(f"Key: {api_key[:10]}...")
sys.stdout.flush()

client = OpenAI(api_key=api_key)

try:
    print("Testing gpt-4o-mini...")
    sys.stdout.flush()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hi"}],
        max_tokens=10
    )
    print(f"✅ SUCCESS: {response.choices[0].message.content}")
    sys.stdout.flush()
except Exception as e:
    print(f"❌ FAILED: {e}")
    sys.stdout.flush()
