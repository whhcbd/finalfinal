import requests
import json

url = "http://localhost:8000/api/chat"
data = {"message": "解释同源染色体交叉互换的过程"}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"\nIntent: {result.get('intent', 'N/A')}")
        print(f"Keywords: {result.get('keywords', 'N/A')}")

        a2ui = result.get('a2ui', [])
        if a2ui is None:
            print(f"\n✗ A2UI is None!")
            print(f"Full response:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"\n✓ A2UI messages: {len(a2ui)}")
            print(f"Full A2UI:")
            print(json.dumps(a2ui, indent=2, ensure_ascii=False))
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Exception: {str(e)}")
    import traceback
    traceback.print_exc()
