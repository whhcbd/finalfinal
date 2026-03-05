import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.intent_service import IntentService
from services.glm_service import GLMService
import asyncio

def test_intent():
    print("测试意图识别和A2UI组件映射")
    print("=" * 60)
    
    glm_service = GLMService()
    intent_service = IntentService(glm_service)
    
    test_inputs = [
        ("孟德尔杂交后代比例是多少？", "punnett_square"),
        ("DNA的双螺旋结构是怎样的？", "dna_structure"),
        ("群体的表型分布情况如何？", "phenotype_distribution"),
        ("基因表达水平是怎么变化的？", "gene_expression"),
        ("这个遗传病的家系图怎么画？", "pedigree_chart"),
        ("减数分裂中的交叉互换现象是什么？", "cross_over_map"),
        ("给我出一些遗传学的测验题目", "quiz"),
        ("我想看视频学习DNA结构", "video"),
        ("基因型和表型的区别是什么？", "general"),
        ("你好", "greeting"),
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
    
    async def run_tests():
        for i, (text, expected) in enumerate(test_inputs, 1):
            print(f"\n测试 {i}: {text}")
            print(f"预期意图: {expected}")
            
            try:
                result = await intent_service.recognize_intent(text)
                actual = result['intent']
                keywords = result['keywords']
                
                print(f"实际意图: {actual}")
                print(f"关键词: {keywords}")
                print(f"使用的A2UI组件: {intent_to_component.get(actual, '未知')}")
                
                status = "✅" if actual == expected else "❌"
                print(f"匹配状态: {status}")
                
            except Exception as e:
                print(f"错误: {e}")
                import traceback
                traceback.print_exc()
            
            print("-" * 60)
    
    asyncio.run(run_tests())

if __name__ == "__main__":
    test_intent()
