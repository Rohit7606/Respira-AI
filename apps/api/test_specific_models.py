
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env", override=True)
api_key = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

candidates = [
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash", 
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002"
]

print("Testing candidate models...")

with open("models_log.txt", "w", encoding="utf-8") as f:
    for model in candidates:
        print(f"\nTrying {model}...")
        f.write(f"\nTrying {model}...\n")
        f.flush()
        try:
            # Add timeout? Not standard in generate_content args but verify if client supports config
            response = client.models.generate_content(
                model=model,
                contents='Hello',
                config={'response_mime_type': 'text/plain'} 
            )
            msg = f"✅ SUCCESS with {model}\nResponse: {response.text}\n"
            print(msg)
            f.write(msg)
            break # STOP at first success
        except Exception as e:
            msg = f"❌ {model}: {e}\n"
            print(msg)
            f.write(msg)
            f.flush()
