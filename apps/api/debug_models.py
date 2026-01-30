
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env")
api_key = os.environ.get("GEMINI_API_KEY")

print(f"API Key present: {bool(api_key)}")

client = genai.Client(api_key=api_key)

try:
    print("Attempting to generate with gemini-2.0-flash...")
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='Hello, are you online?'
    )
    print("Success with gemini-2.0-flash!")
    print(response.text)
except Exception as e:
    print(f"Failed with gemini-2.0-flash: {e}")

try:
    print("\nAttempting to generate with gemini-1.5-flash...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Hello'
    )
    print("Success with gemini-1.5-flash!")
    print(response.text)
except Exception as e:
    print(f"Failed with gemini-1.5-flash: {e}")

try:
    print("\nAttempting to generate with gemini-pro...")
    response = client.models.generate_content(
        model='gemini-pro',
        contents='Hello'
    )
    print("Success with gemini-pro!")
    print(response.text)
except Exception as e:
    print(f"Failed with gemini-pro: {e}")
