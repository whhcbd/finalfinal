import requests
import json

BASE_URL = "http://localhost:8000"

test_cases = [
    {"message": "给我一些关于DNA的闪卡", "expected_intent": "flashcards"},
    {"message": "测试我对孟德尔遗传定律的理解", "expected_intent": "quiz"},
    {"message": "我想看视频了解DNA结构", "expected_intent": "video"},
    {"message": "你好", "expected_intent": "greeting"},
    {"message": "Aa和aa杂交后代是什么", "expected_intent": "general"},
    {"message": "endicrone system 是什么", "expected_intent": "general"},
    {"message": "给我一些闪卡", "expected_intent": "flashcards"},
]

print("=== 意图识别测试 ===\n")

for i, test in enumerate(test_cases, 1):
    print(f"测试 {i}: {test['message']}")
    print(f"期望意图: {test['expected_intent']}")
    
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={
            "message": test['message'],
            "session_id": "test_session",
            "use_ui": True,
            "history": []
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        actual_intent = result.get("intent", "unknown")
        keywords = result.get("keywords", "")
        
        print(f"实际意图: {actual_intent}")
        print(f"关键词: {keywords}")
        
        if actual_intent == test['expected_intent']:
            print("✅ 通过")
        else:
            print("❌ 失败")
    else:
        print(f"❌ 请求失败: {response.status_code}")
    
    print("-" * 50 + "\n")

print("=== 测试完成 ===")
