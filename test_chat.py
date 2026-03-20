import requests
import json

# Test chat API
url = "http://localhost:8000/api/chat"
data = {"message": "什么是孟德尔第一定律？请用孟德尔方格图解释"}

response = requests.post(url, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response:")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
