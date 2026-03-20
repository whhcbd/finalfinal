import requests
import json

base_url = "http://localhost:8000/api/quiz/questions"

categories = ["mendelian", "dna", "gene-expression", "pedigree", "mutations", "population"]

print("=" * 60)
print("测试 Quiz API")
print("=" * 60)

for category in categories:
    print(f"\n测试类别: {category}")

    try:
        response = requests.get(base_url, params={"category": category})
        print(f"  状态码: {response.status_code}")

        if response.status_code == 200:
            questions = response.json()
            print(f"  ✓ 成功! 返回 {len(questions)} 道题目")

            if len(questions) > 0:
                print(f"  示例题目: {questions[0].get('question', 'N/A')[:50]}...")
        else:
            print(f"  ✗ 错误: {response.text}")

    except Exception as e:
        print(f"  ✗ 异常: {str(e)}")

print("\n" + "=" * 60)
