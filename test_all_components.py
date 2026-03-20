import requests
import json

base_url = "http://localhost:8000/api/chat"

test_cases = [
    {
        "name": "孟德尔方格图",
        "message": "什么是孟德尔第一定律？请用孟德尔方格图解释",
        "expected_intent": "punnett_square"
    },
    {
        "name": "DNA 结构",
        "message": "解释 DNA 的双螺旋结构，展示碱基配对规则",
        "expected_intent": "dna_structure"
    },
    {
        "name": "表型分布",
        "message": "展示豌豆杂交实验后代的表型分布比例",
        "expected_intent": "phenotype_distribution"
    },
    {
        "name": "基因表达",
        "message": "解释基因表达的过程和调控机制",
        "expected_intent": "gene_expression"
    },
    {
        "name": "家系图",
        "message": "绘制一个遗传病的家系图，展示常染色体显性遗传",
        "expected_intent": "pedigree_chart"
    },
    {
        "name": "交叉互换图谱",
        "message": "解释同源染色体交叉互换的过程",
        "expected_intent": "cross_over_map"
    }
]

print("=" * 60)
print("开始测试所有遗传学组件")
print("=" * 60)

passed = 0
failed = 0

for i, test in enumerate(test_cases, 1):
    print(f"\n[{i}/{len(test_cases)}] 测试: {test['name']}")
    print(f"问题: {test['message']}")

    try:
        response = requests.post(base_url, json={"message": test['message']})
        result = response.json()

        intent = result.get('intent', '')
        has_a2ui = len(result.get('a2ui', [])) > 0

        print(f"✓ 状态码: {response.status_code}")
        print(f"✓ 意图识别: {intent}")

        if intent == test['expected_intent']:
            print(f"✓ 意图正确!")
            passed += 1
        else:
            print(f"✗ 意图错误! 期望: {test['expected_intent']}, 实际: {intent}")
            failed += 1

        if has_a2ui:
            print(f"✓ A2UI 生成成功 ({len(result['a2ui'])} 条消息)")
        else:
            print(f"✗ A2UI 未生成")
            failed += 1

        print(f"✓ 关键词: {result.get('keywords', 'N/A')}")

    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        failed += 1

print("\n" + "=" * 60)
print(f"测试完成: {passed} 通过, {failed} 失败")
print("=" * 60)
