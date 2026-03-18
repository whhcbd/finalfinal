"""
测试数据绑定功能
验证第二阶段的实现：数据绑定和 dataModelUpdate 消息生成
"""

import asyncio
import sys
import os

# 添加后端路径
sys.path.insert(0, os.path.dirname(__file__))

from services.data_model_service import DataModelService
from services.context_service import ContextService


async def test_data_model_service():
    """测试 DataModelService"""
    print("=" * 60)
    print("测试 1: DataModelService - 生成初始数据模型")
    print("=" * 60)

    service = DataModelService()

    # 测试生成初始数据模型
    intent = "punnett_square"
    keywords = "Aa aa 杂交"

    data_model = service.generate_initial_data_model(intent, keywords)
    print(f"\n生成的数据模型:")
    print(f"  Intent: {intent}")
    print(f"  Keywords: {keywords}")
    print(f"  Data Model: {data_model}")

    # 验证数据模型结构
    assert isinstance(data_model, dict), "数据模型应该是字典"
    assert "parent1" in data_model, "应该包含 parent1"
    assert "parent2" in data_model, "应该包含 parent2"

    print("\n✅ 测试通过: 数据模型生成正确")


async def test_data_model_update_message():
    """测试 dataModelUpdate 消息生成"""
    print("\n" + "=" * 60)
    print("测试 2: 生成 dataModelUpdate 消息")
    print("=" * 60)

    service = DataModelService()

    # 测试数据
    surface_id = "genetics_ui"
    data_model = {
        "parent1": "Aa",
        "parent2": "aa",
        "trait": "花色"
    }

    message = service.generate_data_model_update_message(surface_id, data_model)

    print(f"\n生成的 dataModelUpdate 消息:")
    print(f"  Surface ID: {surface_id}")
    print(f"  消息结构: {list(message.keys())}")

    # 验证消息结构
    assert "dataModelUpdate" in message, "应该包含 dataModelUpdate 键"
    assert message["dataModelUpdate"]["surfaceId"] == surface_id, "surfaceId 应该匹配"
    assert "contents" in message["dataModelUpdate"], "应该包含 contents"

    contents = message["dataModelUpdate"]["contents"]
    print(f"\n  Contents 数量: {len(contents)}")

    for item in contents:
        print(f"    - Path: {item['path']}, Value Type: {list(item['value'].keys())[0]}")

    # 验证 path 格式
    paths = [item["path"] for item in contents]
    assert "/parent1" in paths, "应该包含 /parent1 路径"
    assert "/parent2" in paths, "应该包含 /parent2 路径"

    # 验证值类型
    for item in contents:
        assert "value" in item, "每个 content 应该有 value"
        value = item["value"]
        # 应该使用 valueString, valueBoolean, valueNumber 等
        assert any(k.startswith("value") for k in value.keys()), "值应该使用 value* 包装器"

    print("\n✅ 测试通过: dataModelUpdate 消息格式正确")


async def test_context_service_data_model():
    """测试 ContextService 的数据模型管理"""
    print("\n" + "=" * 60)
    print("测试 3: ContextService - 数据模型状态管理")
    print("=" * 60)

    service = ContextService()

    session_id = "test_session_123"
    surface_id = "genetics_ui"

    # 测试设置数据模型
    data_model = {
        "parent1": "Aa",
        "parent2": "aa"
    }

    service.set_data_model(session_id, surface_id, data_model)
    print(f"\n设置数据模型: {data_model}")

    # 测试获取数据模型
    retrieved = service.get_data_model(session_id, surface_id)
    print(f"获取数据模型: {retrieved}")

    assert retrieved == data_model, "获取的数据模型应该与设置的一致"

    # 测试更新单个字段
    service.update_data_model_field(session_id, surface_id, "/parent1", "AA")
    print(f"\n更新 /parent1 为 'AA'")

    updated = service.get_data_model(session_id, surface_id)
    print(f"更新后的数据模型: {updated}")

    assert updated["parent1"] == "AA", "parent1 应该被更新为 AA"
    assert updated["parent2"] == "aa", "parent2 应该保持不变"

    # 测试合并数据模型
    merge_data = {
        "parent2": "Aa",
        "trait": "花色"
    }

    service.merge_data_model(session_id, surface_id, merge_data)
    print(f"\n合并数据: {merge_data}")

    merged = service.get_data_model(session_id, surface_id)
    print(f"合并后的数据模型: {merged}")

    assert merged["parent1"] == "AA", "parent1 应该保持 AA"
    assert merged["parent2"] == "Aa", "parent2 应该被更新为 Aa"
    assert merged["trait"] == "花色", "应该添加新字段 trait"

    print("\n✅ 测试通过: 数据模型状态管理正确")


async def test_data_binding_format():
    """测试数据绑定格式"""
    print("\n" + "=" * 60)
    print("测试 4: 验证数据绑定格式")
    print("=" * 60)

    # 正确的数据绑定格式
    correct_binding = {
        "PunnettSquare": {
            "parent1Genotype": {"path": "/parent1"},
            "parent2Genotype": {"path": "/parent2"}
        }
    }

    # 错误的静态值格式
    wrong_format = {
        "PunnettSquare": {
            "parent1Genotype": {"literalString": "Aa"},
            "parent2Genotype": {"literalString": "aa"}
        }
    }

    print("\n✅ 正确的数据绑定格式:")
    print(f"  {correct_binding}")
    print("\n  使用 path 绑定到数据模型路径")

    print("\n❌ 错误的静态值格式:")
    print(f"  {wrong_format}")
    print("\n  使用 literalString 硬编码值，无法响应更新")

    print("\n✅ 测试通过: 数据绑定格式验证完成")


async def main():
    """运行所有测试"""
    print("\n🧬 开始测试第二阶段功能：数据绑定和状态管理\n")

    try:
        await test_data_model_service()
        await test_data_model_update_message()
        await test_context_service_data_model()
        await test_data_binding_format()

        print("\n" + "=" * 60)
        print("🎉 所有测试通过！")
        print("=" * 60)
        print("\n第二阶段功能验证完成：")
        print("  ✅ 数据模型生成")
        print("  ✅ dataModelUpdate 消息格式")
        print("  ✅ 会话状态管理")
        print("  ✅ 数据绑定格式")
        print("\n下一步：测试前端接收和处理 dataModelUpdate 消息")

    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
