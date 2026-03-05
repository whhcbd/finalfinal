import http.client
import json

def test_chat_api():
    print("=" * 80)
    print("测试后台对不同输入会使用哪些A2UI组件")
    print("=" * 80)
    print()
    
    conn = http.client.HTTPConnection("localhost", 8000, timeout=30)
    
    test_cases = [
        {
            "input": "孟德尔杂交后代比例是多少？",
            "expected_intent": "punnett_square",
            "description": "孟德尔方格图相关请求"
        },
        {
            "input": "DNA的双螺旋结构是怎样的？",
            "expected_intent": "dna_structure",
            "description": "DNA结构相关请求"
        },
        {
            "input": "群体的表型分布情况如何？",
            "expected_intent": "phenotype_distribution",
            "description": "表型分布相关请求"
        },
        {
            "input": "基因表达水平是怎么变化的？",
            "expected_intent": "gene_expression",
            "description": "基因表达相关请求"
        },
        {
            "input": "这个遗传病的家系图怎么画？",
            "expected_intent": "pedigree_chart",
            "description": "家系图相关请求"
        },
        {
            "input": "减数分裂中的交叉互换现象是什么？",
            "expected_intent": "cross_over_map",
            "description": "交叉互换图谱相关请求"
        },
        {
            "input": "给我出一些遗传学的测验题目",
            "expected_intent": "quiz",
            "description": "测验相关请求"
        },
        {
            "input": "我想看视频学习DNA结构",
            "expected_intent": "video",
            "description": "视频相关请求"
        },
        {
            "input": "基因型和表型的区别是什么？",
            "expected_intent": "general",
            "description": "一般性问题"
        },
        {
            "input": "你好",
            "expected_intent": "greeting",
            "description": "问候语"
        }
    ]
    
    intent_to_component = {
        "punnett_square": "PunnettSquare (孟德尔方格图)",
        "dna_structure": "DNAStructure (DNA双螺旋结构)",
        "phenotype_distribution": "PhenotypeDistribution (表型分布柱状图)",
        "gene_expression": "GeneExpression (基因表达水平)",
        "pedigree_chart": "PedigreeChart (家系图)",
        "cross_over_map": "CrossOverMap (交叉互换图谱)",
        "quiz": "Quiz (测验)",
        "video": "Video (视频)",
        "general": "Flashcard (闪卡)",
        "greeting": "无组件（纯文本）"
    }
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"测试 {i}: {test_case['description']}")
        print(f"输入: {test_case['input']}")
        print(f"预期意图: {test_case['expected_intent']}")
        print(f"预期组件: {intent_to_component.get(test_case['expected_intent'], '未知')}")
        
        try:
            headers = {"Content-type": "application/json"}
            body = json.dumps({
                "message": test_case['input'],
                "use_ui": True,
                "session_id": "test_session"
            })
            
            conn.request("POST", "/api/chat", body, headers)
            response = conn.getresponse()
            
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                actual_intent = data.get('intent', '')
                keywords = data.get('keywords', '')
                has_a2ui = bool(data.get('a2ui'))
                
                print(f"实际意图: {actual_intent}")
                print(f"关键词: {keywords}")
                print(f"包含A2UI: {'是' if has_a2ui else '否'}")
                print(f"实际组件: {intent_to_component.get(actual_intent, '未知')}")
                
                is_correct = actual_intent == test_case['expected_intent']
                status = "✅ 正确" if is_correct else "❌ 错误"
                print(f"状态: {status}")
                
                results.append({
                    "input": test_case['input'],
                    "expected_intent": test_case['expected_intent'],
                    "actual_intent": actual_intent,
                    "keywords": keywords,
                    "has_a2ui": has_a2ui,
                    "is_correct": is_correct
                })
            else:
                print(f"请求失败: {response.status}")
                print(f"错误: {response.read().decode('utf-8')}")
                results.append({
                    "input": test_case['input'],
                    "expected_intent": test_case['expected_intent'],
                    "actual_intent": "ERROR",
                    "keywords": "",
                    "has_a2ui": False,
                    "is_correct": False
                })
                
        except Exception as e:
            print(f"请求异常: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "input": test_case['input'],
                "expected_intent": test_case['expected_intent'],
                "actual_intent": "ERROR",
                "keywords": "",
                "has_a2ui": False,
                "is_correct": False
            })
        
        print()
        print("-" * 80)
        print()
    
    conn.close()
    
    print("=" * 80)
    print("测试结果汇总")
    print("=" * 80)
    
    total = len(results)
    correct = sum(1 for r in results if r['is_correct'])
    incorrect = total - correct
    accuracy = (correct / total * 100) if total > 0 else 0
    
    print(f"总测试数: {total}")
    print(f"正确: {correct}")
    print(f"错误: {incorrect}")
    print(f"准确率: {accuracy:.1f}%")
    print()
    
    if incorrect > 0:
        print("错误案例:")
        for r in results:
            if not r['is_correct']:
                print(f"  输入: {r['input']}")
                print(f"  预期: {r['expected_intent']}, 实际: {r['actual_intent']}")
                print()
    
    print("=" * 80)
    print("A2UI组件使用统计:")
    print("=" * 80)
    
    for intent, component in intent_to_component.items():
        count = sum(1 for r in results if r['actual_intent'] == intent)
        print(f"{intent:25s} -> {component:40s} ({count}次)")
    
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_chat_api()
    except Exception as e:
        print(f"测试失败: {e}")
        import traceback
        traceback.print_exc()
