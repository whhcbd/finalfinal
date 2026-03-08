# 解决 GLM 返回错误格式的方案

## 问题根源

GLM-4.7 返回错误的 PedigreeChart 格式：
```json
{
  "generations": 3,
  "diseaseName": "常染色体隐性遗传病"
}
```

而不是正确的格式：
```json
{
  "generations": [
    {
      "individuals": [
        {"id": "1", "gender": "male", "phenotype": "carrier", "generation": 0}
      ]
    }
  ],
  "trait": "常染色体隐性遗传病"
}
```

**原因：** System prompt 中没有包含实际的 JSON example，GLM 只看到文字描述，无法理解正确的数据结构。

## 解决方案：动态加载 Example

参考官方示范 `personalized_learning/agent/a2ui_templates.py`，在 system prompt 中包含完整的 JSON example。

但为了避免 prompt 过长，采用**动态加载**策略：根据 intent 只加载相关组件的 example。

## 实施步骤

### 步骤 1：修改 `backend/services/a2ui_service.py`

在文件开头添加函数，用于加载 example 文件：

```python
import json
from pathlib import Path

def load_example_for_intent(intent: str) -> str:
    """
    根据 intent 加载对应的 example JSON 文件

    Args:
        intent: 意图类型 (punnett_square, dna_structure, pedigree_chart, etc.)

    Returns:
        格式化的 example 字符串，如果文件不存在则返回空字符串
    """
    intent_to_file = {
        "punnett_square": "punnett_square_example.json",
        "dna_structure": "dna_structure_example.json",
        "pedigree_chart": "pedigree_chart_example.json",
        "gene_expression": "gene_expression_example.json",
        "cross_over_map": "cross_over_map_example.json",
        "phenotype_distribution": "phenotype_distribution_example.json",
    }

    filename = intent_to_file.get(intent)
    if not filename:
        return ""

    example_path = BASE_DIR / "examples" / "genetics_examples" / filename

    try:
        with open(example_path, 'r', encoding='utf-8') as f:
            example_data = json.load(f)

        # 格式化为易读的 JSON 字符串
        example_json = json.dumps(example_data, indent=2, ensure_ascii=False)

        return f"""
## EXAMPLE JSON FOR THIS COMPONENT:

Below is a complete, working example of the correct JSON format for this component.
Follow this structure EXACTLY:

{example_json}

IMPORTANT:
- Copy the structure above precisely
- Replace the data values with content relevant to the user's question
- Keep all property names and nesting levels identical
- Use literalString, literalArray, literalNumber wrappers as shown
"""
    except Exception as e:
        logger.error(f"Failed to load example for intent '{intent}': {e}")
        return ""
```

### 步骤 2：修改 `get_system_prompt()` 函数

更新函数签名，接受 `intent` 参数：

```python
def get_system_prompt(use_ui: bool = True, intent: str = None) -> str:
    """
    Generate a system prompt for the LLM.

    Args:
        use_ui: Whether to include A2UI schema in the prompt.
        intent: The user's intent (used to load relevant example)

    Returns:
        The complete system prompt string.
    """
    if not use_ui:
        return """
        You are a helpful genetics teaching assistant.
        ...
        """

    base_prompt = schema_manager.generate_system_prompt(
        role_description=ROLE_DESCRIPTION,
        workflow_description=WORKFLOW_DESCRIPTION,
        ui_description=UI_DESCRIPTION,
        include_schema=True,
        include_examples=False,  # 改为 False，我们手动加载
        validate_examples=False,
    )

    # 如果提供了 intent，动态加载对应的 example
    if intent:
        example_section = load_example_for_intent(intent)
        if example_section:
            base_prompt += "\n\n" + example_section

    return base_prompt
```

### 步骤 3：修改 `backend/main.py` 中的调用

找到第 662 行，修改 `get_system_prompt()` 的调用：

```python
ui_messages = [
    {"role": "system", "content": get_system_prompt(use_ui=True, intent=intent)},
    {"role": "user", "content": f"""用户问题：{request.message}
    ...
```

### 步骤 4：测试验证

1. 重启后端服务
2. 提问："画一个常染色体隐性遗传病的三代家系图"
3. 检查返回的 JSON 格式是否正确
4. 检查后端日志，确认 example 被加载

## 预期效果

- ✅ GLM 能看到完整的 JSON example
- ✅ Prompt 长度增加约 1500-2000 字符（可接受）
- ✅ 只加载相关组件的 example，避免信息过载
- ✅ 维护简单，只需修改 JSON 文件

## 备选方案（如果动态加载仍然失败）

如果 GLM 仍然返回错误格式，可以采用更激进的方案：

### 方案 A：在 User Prompt 中包含 Example

在 `main.py` 第 663-701 行的 user prompt 中，直接包含 example：

```python
{"role": "user", "content": f"""用户问题：{request.message}

意图类型：{intent}

请生成 A2UI JSON 数组。

⚠️ 完整示例（必须严格遵守此格式）：

{load_example_for_intent(intent)}

现在根据用户问题生成 JSON："""}
```

### 方案 B：移除降级策略，强制 GLM 学习

1. 删除 `main.py` 中的 `generate_local_a2ui()` 函数
2. 删除第 720-742 行的降级逻辑
3. 让 GLM 的错误直接暴露，倒逼它学会正确格式

## 注意事项

1. **不要删除 example JSON 文件** - 它们现在是 prompt 的一部分
2. **保持 example 文件与组件定义同步** - 修改组件时同步更新 example
3. **监控 prompt 长度** - 如果超过 20000 tokens，考虑简化 schema 部分
4. **测试所有 6 个组件** - 确保每个 intent 都能正确加载 example

## 实施优先级

1. **高优先级**：步骤 1-3（动态加载 example）
2. **中优先级**：步骤 4（测试验证）
3. **低优先级**：备选方案（仅在动态加载失败时使用）
