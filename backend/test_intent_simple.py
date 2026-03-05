import asyncio
from services.intent_service import IntentService
from services.glm_service import GLMService

async def test_intent():
    print("开始测试意图识别...")
    
    glm_service = GLMService()
    intent_service = IntentService(glm_service)
    
    test_inputs = [
        "孟德尔杂交后代比例是多少？",
        "DNA的双螺旋结构是怎样的？",
        "群体的表型分布情况如何？",
        "基因表达水平是怎么变化的？",
        "这个遗传病的家系图怎么画？",
        "减数分裂中的交叉互换现象是什么？",
        "给我出一些遗传学的测验题目",
        "我想看视频学习DNA结构",
        "基因型和表型的区别是什么？",
        "你好",
        "Aa和aa杂交的后代是什么？",
        "染色体的交叉互换过程是怎样的？"
    ]
    
    for i, text in enumerate(test_inputs, 1):
        print(f"\n测试 {i}: {text}")
        try:
            result = await intent_service.recognize_intent(text)
            print(f"  意图: {result['intent']}")
            print(f"  关键词: {result['keywords']}")
        except Exception as e:
            print(f"  错误: {e}")

if __name__ == "__main__":
    asyncio.run(test_intent())
