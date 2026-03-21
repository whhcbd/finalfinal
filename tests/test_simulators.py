import requests
import json

base_url = "http://localhost:8000/api/chat"

print("=" * 60)
print("测试模拟器组件")
print("=" * 60)

# 测试孟德尔模拟器
print("\n[1/2] 测试孟德尔实验模拟器")
message = "我想做一个孟德尔实验模拟，验证基因分离定律"
print(f"问题: {message}")

try:
    response = requests.post(base_url, json={"message": message})
    result = response.json()

    print(f"✓ 状态码: {response.status_code}")
    print(f"✓ 意图: {result.get('intent', 'N/A')}")

    a2ui = result.get('a2ui', [])
    if a2ui and len(a2ui) > 0:
        print(f"✓ A2UI 生成成功 ({len(a2ui)} 条消息)")

        # 检查是否有 MendelSimulator 组件
        for msg in a2ui:
            if 'surfaceUpdate' in msg:
                components = msg['surfaceUpdate'].get('components', [])
                for comp in components:
                    if 'MendelSimulator' in comp.get('component', {}):
                        print(f"✓ 找到 MendelSimulator 组件!")
                        break
    else:
        print(f"✗ A2UI 未生成或为空")

    print(f"关键词: {result.get('keywords', 'N/A')}")

except Exception as e:
    print(f"✗ 错误: {str(e)}")

# 测试自然选择模拟器
print("\n[2/2] 测试自然选择模拟器")
message = "我想模拟自然选择过程，观察基因频率的变化"
print(f"问题: {message}")

try:
    response = requests.post(base_url, json={"message": message})
    result = response.json()

    print(f"✓ 状态码: {response.status_code}")
    print(f"✓ 意图: {result.get('intent', 'N/A')}")

    a2ui = result.get('a2ui', [])
    if a2ui and len(a2ui) > 0:
        print(f"✓ A2UI 生成成功 ({len(a2ui)} 条消息)")

        # 检查是否有 NaturalSelectionSimulator 组件
        for msg in a2ui:
            if 'surfaceUpdate' in msg:
                components = msg['surfaceUpdate'].get('components', [])
                for comp in components:
                    if 'NaturalSelectionSimulator' in comp.get('component', {}):
                        print(f"✓ 找到 NaturalSelectionSimulator 组件!")
                        break
    else:
        print(f"✗ A2UI 未生成或为空")

    print(f"关键词: {result.get('keywords', 'N/A')}")

except Exception as e:
    print(f"✗ 错误: {str(e)}")

print("\n" + "=" * 60)
