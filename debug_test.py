import requests
import json

# 专门测试交叉互换图谱
url = "http://localhost:8000/api/chat"
data = {"message": "解释同源染色体交叉互换的过程"}

print("测试交叉互换图谱...")
try:
    response = requests.post(url, json=data)
    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"意图: {result.get('intent', 'N/A')}")

        a2ui = result.get('a2ui')
        print(f"\nA2UI 类型: {type(a2ui)}")
        print(f"A2UI 值: {a2ui}")

        if a2ui is None:
            print("✗ A2UI 为 None!")
        elif a2ui == []:
            print("✗ A2UI 为空数组!")
        elif isinstance(a2ui, list):
            print(f"✓ A2UI 是列表，长度: {len(a2ui)}")
        else:
            print(f"✗ A2UI 类型异常: {type(a2ui)}")

except Exception as e:
    print(f"错误: {str(e)}")
    import traceback
    traceback.print_exc()
