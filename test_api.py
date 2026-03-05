import requests
import json

url = "http://localhost:8000/api/chat"
payload = {
    "message": "What is DNA",
    "session_id": "test",
    "use_ui": True,
    "history": []
}

print("Testing non-streaming API...")
print(f"Request: {json.dumps(payload, indent=2)}\n")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}\n")
    
    result = response.json()
    print("Response JSON:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if 'text' in result:
        print(f"\nText length: {len(result['text'])} characters")
    if 'a2ui' in result:
        print(f"A2UI data: {result['a2ui']}")
    if 'intent' in result:
        print(f"Intent: {result['intent']}")
    if 'keywords' in result:
        print(f"Keywords: {result['keywords']}")
        
except Exception as e:
    print(f"Error: {e}")
