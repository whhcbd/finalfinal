#!/usr/bin/env python3
"""
测试模拟器组件的 intent 识别和 A2UI 生成
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_intent(message: str):
    """测试单个消息的 intent 识别"""
    print(f"\n{'='*60}")
    print(f"测试问题: {message}")
    print('='*60)

    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={
            "message": message,
            "use_ui": True,
            "history": []
        }
    )

    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Response successful")
        print(f"Intent: {data.get('intent', 'N/A')}")
        print(f"Keywords: {data.get('keywords', 'N/A')}")
        print(f"Text: {data.get('text', 'N/A')[:100]}...")

        if data.get('a2ui'):
            print(f"\n[A2UI] Message count: {len(data['a2ui'])}")
            for i, msg in enumerate(data['a2ui']):
                msg_type = list(msg.keys())[0] if msg else 'unknown'
                print(f"  [{i+1}] {msg_type}")

                # 检查组件类型
                if msg_type == 'surfaceUpdate':
                    components = msg.get('surfaceUpdate', {}).get('components', [])
                    for comp in components:
                        comp_type = list(comp.get('component', {}).keys())[0] if comp.get('component') else 'unknown'
                        print(f"      Component: {comp_type}")
        else:
            print("[ERROR] No A2UI data")
    else:
        print(f"[ERROR] Request failed: {response.status_code}")
        print(response.text)

def main():
    print("A2UI Simulator Component Test")
    print("="*60)

    # 测试问题列表
    test_cases = [
        # 孟德尔模拟器测试
        "用孟德尔模拟器验证 Aa × Aa 的分离比例",
        "模拟 AaBb × AaBb 的自由组合，看看是不是 9:3:3:1",
        "模拟 1000 次 Aa × aa 的随机受精",

        # 自然选择模拟器测试
        "模拟自然选择，初始种群 100 个体，50% 深色 50% 浅色，环境是深色背景",
        "用自然选择模拟器演示基因频率变化",

        # 对比：普通 Punnett Square（不应该触发模拟器）
        "显示一个 Aa × aa 的棋盘图",
    ]

    for test_case in test_cases:
        test_intent(test_case)

    print(f"\n{'='*60}")
    print("[DONE] Test completed")
    print('='*60)

if __name__ == "__main__":
    main()
