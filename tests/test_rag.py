"""
RAG 功能测试脚本

使用方法：
1. 确保后端服务已启动（py -m uvicorn backend.main:app --reload --port 8000）
2. 运行此脚本：python test_rag.py
"""

import sys
import os
from pathlib import Path

# 设置 UTF-8 编码输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_embedding_service():
    """测试 Embedding Service 是否能正常加载模型"""
    print("=" * 60)
    print("测试 1: Embedding Service 模型加载")
    print("=" * 60)

    try:
        from backend.services.embedding_service import EmbeddingService

        print("✓ 成功导入 EmbeddingService")

        # 创建服务实例
        service = EmbeddingService()
        print(f"✓ 创建服务实例，模型名称: {service.model_name}")

        # 测试生成嵌入向量
        print("\n正在生成测试文本的嵌入向量...")
        test_texts = ["孟德尔遗传定律", "DNA双螺旋结构"]
        embeddings = service.generate_embeddings(test_texts)

        print(f"✓ 成功生成嵌入向量")
        print(f"  - 向量维度: {embeddings.shape}")
        print(f"  - 嵌入维度: {service.embedding_dimension}")

        # 测试查询嵌入
        query = "什么是基因突变？"
        query_embedding = service.generate_query_embedding(query)
        print(f"✓ 成功生成查询嵌入向量，维度: {query_embedding.shape}")

        return True

    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_vector_store():
    """测试 Vector Store 是否能正常工作"""
    print("\n" + "=" * 60)
    print("测试 2: Vector Store 向量存储")
    print("=" * 60)

    try:
        from backend.services.vector_store import VectorStore
        from backend.services.embedding_service import EmbeddingService

        print("✓ 成功导入 VectorStore")

        # 创建服务实例
        embedding_service = EmbeddingService()

        # 获取嵌入维度
        test_embedding = embedding_service.generate_query_embedding("测试")
        dimension = len(test_embedding)

        vector_store = VectorStore(dimension=dimension)

        print(f"✓ 创建 VectorStore 实例，维度: {dimension}")

        # 添加测试文档
        test_docs = [
            {"text": "孟德尔遗传定律包括分离定律和自由组合定律。", "id": 0, "source": "test"},
            {"text": "DNA是双螺旋结构，由两条反向平行的核苷酸链组成。", "id": 1, "source": "test"},
            {"text": "基因突变是DNA序列发生的改变，可能导致性状变化。", "id": 2, "source": "test"}
        ]

        print("\n正在添加测试文档到向量存储...")
        texts = [doc["text"] for doc in test_docs]
        embeddings = embedding_service.generate_embeddings(texts)
        vector_store.add_documents(embeddings, test_docs)

        print(f"✓ 成功添加 {len(test_docs)} 个文档")
        print(f"  - 向量存储大小: {len(vector_store.documents)} 个文档")

        # 测试相似度搜索
        query = "什么是DNA结构？"
        print(f"\n正在搜索与查询相关的文档: '{query}'")
        query_embedding = embedding_service.generate_query_embedding(query)
        results = vector_store.search(query_embedding, top_k=2)

        print(f"✓ 搜索完成，找到 {len(results)} 个相关文档:")
        for i, result in enumerate(results, 1):
            doc = result["document"]
            score = result["score"]
            print(f"  {i}. 相似度: {score:.4f}")
            print(f"     内容: {doc['text'][:50]}...")
            print(f"     元数据: id={doc['id']}, source={doc['source']}")

        return True

    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rag_service():
    """测试 RAG Service 完整流程"""
    print("\n" + "=" * 60)
    print("测试 3: RAG Service 完整流程")
    print("=" * 60)

    try:
        import asyncio
        from backend.services.rag_service import RAGService

        print("✓ 成功导入 RAGService")

        # 创建服务实例
        rag_service = RAGService()
        print("✓ 创建 RAGService 实例")

        # 检查知识库路径
        kb_path = os.getenv("KNOWLEDGE_BASE_PATH")
        if kb_path and os.path.exists(kb_path):
            print(f"✓ 知识库文件存在: {kb_path}")
            file_size = os.path.getsize(kb_path) / (1024 * 1024)
            print(f"  - 文件大小: {file_size:.2f} MB")
        else:
            print(f"⚠ 知识库文件不存在或未配置: {kb_path}")
            return False

        # 初始化知识库
        print("\n正在初始化知识库（这可能需要几分钟）...")
        asyncio.run(rag_service.initialize())

        if rag_service._disabled:
            print("✗ RAG 服务被禁用")
            return False

        print(f"✓ 知识库初始化完成")
        print(f"  - 文档数量: {len(rag_service.vector_store.documents)}")

        # 测试检索
        query = "孟德尔遗传定律的内容是什么？"
        print(f"\n正在检索相关内容: '{query}'")
        context = asyncio.run(rag_service.get_context_for_query(query))

        print(f"✓ 检索完成，上下文长度: {len(context)} 字符")
        print(f"\n检索到的上下文片段:")
        print("-" * 60)
        print(context[:500] + "..." if len(context) > 500 else context)
        print("-" * 60)

        return True

    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("RAG 功能测试")
    print("=" * 60)
    print()

    # 检查环境变量
    from dotenv import load_dotenv
    load_dotenv()

    kb_path = os.getenv("KNOWLEDGE_BASE_PATH")
    print(f"知识库路径: {kb_path}")
    print(f"嵌入模型: {os.getenv('EMBEDDING_MODEL_NAME', 'paraphrase-multilingual-MiniLM-L12-v2')}")
    print()

    results = []

    # 测试 1: Embedding Service
    results.append(("Embedding Service", test_embedding_service()))

    # 测试 2: Vector Store
    results.append(("Vector Store", test_vector_store()))

    # 测试 3: RAG Service
    results.append(("RAG Service", test_rag_service()))

    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)

    for name, passed in results:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"{name}: {status}")

    all_passed = all(passed for _, passed in results)

    if all_passed:
        print("\n🎉 所有测试通过！RAG 功能已成功启用。")
        return 0
    else:
        print("\n⚠ 部分测试失败，请检查错误信息。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
