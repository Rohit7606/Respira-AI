
import json
import urllib.request
import sys

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Using the new key provided by user
api_key = "AIzaSyDlxQFjzMul-xbVrq7rWodLQ5-czPOlbF8"

# Try 2.5 and 2.0-001
models = ["gemini-2.5-flash", "gemini-2.0-flash-001"]

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": "Hi"}]}]}

    print(f"Testing REST {model}...")
    sys.stdout.flush()
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"✅ SUCCESS with {model}: {resp.status}")
            print(resp.read().decode('utf-8')[:200])
            sys.stdout.flush()
            sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED with {model}: {e}")
        try:
             if hasattr(e, 'read'):
                 print(e.read().decode('utf-8'))
        except: pass
        sys.stdout.flush()
