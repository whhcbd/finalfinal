import os
import sys
import json
from pathlib import Path
import logging

sys.path.insert(0, str(Path(__file__).parent.parent / 'python' / 'a2ui_agent' / 'src'))

from a2ui.inference.schema.manager import A2uiSchemaManager, CustomCatalogConfig  # type: ignore
from a2ui.inference.schema.common_modifiers import remove_strict_validation  # type: ignore

BASE_DIR = Path(__file__).parent.parent
logger = logging.getLogger(__name__)

ROLE_DESCRIPTION = (
    "You are a helpful genetics teaching assistant specializing in genetics concepts and visualizations. "
    "Your final output MUST be a a2ui UI JSON response. "
    "IMPORTANT: Always respond in the same language as the user's question (Chinese for Chinese questions, English for English questions)."
)

WORKFLOW_DESCRIPTION = """
To generate the response, you MUST follow these rules:
1. Output ONLY valid A2UI JSON - no text, no markdown, no explanation
2. The output must be a JSON array of A2UI messages
3. The JSON MUST validate against the A2UI JSON SCHEMA provided below
4. Do not include any conversational text - only the JSON array
"""

UI_DESCRIPTION = """
CRITICAL: You MUST use CUSTOM GENETICS COMPONENTS, NOT standard A2UI components!

## CUSTOM COMPONENT SELECTION RULES (MANDATORY):

1. **PunnettSquare** - Use for genetic crosses showing offspring genotypes:
   - When user asks about crossing specific genotypes (Aa × aa, AaBb × aabb)
   - When showing gamete combinations and offspring predictions
   - Example: "Aa和aa杂交会产生什么样的后代？"
   - REQUIRED FIELDS: parent1Genotype, parent2Genotype
   - OPTIONAL: trait, showPhenotype

2. **DNAStructure** - Use for DNA sequence visualization:
   - When user asks about DNA sequences, base pairing, or structure
   - When showing specific DNA sequences (ATCG)
   - Example: "GCTAGCTA这段DNA序列的碱基配对是怎样的？"
   - REQUIRED FIELDS: sequence
   - OPTIONAL: showLabels, highlightRegions

3. **PhenotypeDistribution** - Use for phenotype ratios and distributions:
   - When user asks about F2 generation ratios, phenotype proportions
   - When showing population phenotype statistics
   - Example: "F2代中紫色花和白色花的比例是多少？"
   - REQUIRED FIELDS: trait, data (array of {phenotype, count, percentage})
   - OPTIONAL: totalCount, showPercentage

4. **GeneExpression** - Use for gene expression levels:
   - When user asks about gene regulation, transcription levels
   - When showing expression data across conditions
   - Example: "GeneA在不同组织中的表达水平是怎样的？"
   - REQUIRED FIELDS: genes (array), conditions (array)

5. **PedigreeChart** - Use for family inheritance patterns:
   - When user asks about genetic disease inheritance in families
   - When showing family trees with genetic traits
   - Example: "画出常染色体隐性遗传的家系图"
   - REQUIRED FIELDS: generations (array of generation objects with individuals array), trait (string)

6. **CrossOverMap** - Use for chromosomal crossover:
   - When user asks about genetic linkage, recombination
   - When showing crossover events on chromosomes
   - Example: "展示染色体交叉互换图"
   - REQUIRED FIELDS: genes (array with positions)

## CRITICAL RULES:

❌ DO NOT use standard A2UI components (Container, Column, Row, Text, Card) for genetics visualizations
✅ ALWAYS use the custom genetics components listed above
✅ Keep A2UI JSON simple - typically just 2-3 messages: beginRendering, surfaceUpdate, (optional) dataModelUpdate
✅ Follow the example files exactly for component structure
✅ Use literalString, literalBoolean, literalNumber, literalArray for property values

## RESPONSE FORMAT:

Your response MUST be a JSON array with the following structure:

[
  {"beginRendering": {"surfaceId": "genetics_ui", "root": "main_component"}},
  {"surfaceUpdate": {"surfaceId": "genetics_ui", "components": [...]}}
]

Do NOT include:
- Text explanations before or after the JSON
- Markdown code blocks (```json)
- The delimiter ---a2ui_JSON---
- Any other formatting
"""

schema_manager = A2uiSchemaManager(
    version="0.8",
    custom_catalogs=[
        CustomCatalogConfig(
            name="genetics_catalog",
            catalog_path=str(BASE_DIR / "schemas" / "genetics_catalog.json"),
            examples_path=str(BASE_DIR / "examples" / "genetics_examples"),
        )
    ],
    schema_modifiers=[remove_strict_validation],
)


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

        To generate a response, you MUST follow these rules:
        1. Provide clear, accurate explanations of genetics concepts.
        2. Use RAG retrieval to get accurate genetics knowledge.
        3. Format responses in a clear, conversational style.
        4. Include relevant examples when explaining complex concepts.
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


def validate_and_fix_response(response_text: str) -> tuple[str, bool, str | None]:
    """
    Validate A2UI JSON response.

    Based on restaurant-agent.py validation logic from A2UI reference:
    1. Check for delimiter
    2. Check if JSON part is empty
    3. Clean JSON string (remove markdown fences)
    4. Parse JSON
    5. Validate against A2UI schema

    Args:
        response_text: The full response text from the LLM.

    Returns:
        A tuple of (text_part, is_valid, error_message).
        - text_part: The text part of the response (before the delimiter).
        - is_valid: Whether the A2UI JSON part is valid.
        - error_message: Error message if invalid, None if valid.
    """
    import json as json_lib

    delimiter = "---a2ui_JSON---"

    if delimiter not in response_text:
        return response_text, False, "Delimiter '---a2ui_JSON---' not found."

    text_part, json_string = response_text.split(delimiter, 1)

    json_string = json_string.strip()

    if not json_string:
        return text_part.strip(), False, "JSON part is empty."

    json_string_cleaned = (
        json_string.strip()
        .lstrip("```json")
        .rstrip("```")
        .strip()
    )

    if not json_string_cleaned:
        return text_part.strip(), False, "Cleaned JSON string is empty."

    try:
        parsed_json_data = json_lib.loads(json_string_cleaned)
    except json_lib.JSONDecodeError as e:
        return text_part.strip(), False, f"Invalid JSON: {e}"

    try:
        selected_catalog = schema_manager.get_selected_catalog()
        selected_catalog.validator.validate(parsed_json_data)
    except Exception as e:
        return text_part.strip(), False, f"Schema validation error: {e}"

    return text_part.strip(), True, None


def get_schema_validator():
    """
    Get the A2UI schema validator for use in validation.

    Returns:
        The schema validator instance.
    """
    return schema_manager.validator


if __name__ == "__main__":
    print("Testing A2UI Service...")
    print("\n" + "=" * 50)
    print("System Prompt (UI Mode):")
    print("=" * 50)
    prompt = get_system_prompt(use_ui=True)
    print(prompt[:500] + "..." if len(prompt) > 500 else prompt)

    print("\n" + "=" * 50)
    print("System Prompt (Text Mode):")
    print("=" * 50)
    prompt = get_system_prompt(use_ui=False)
    print(prompt)

    print("\n" + "=" * 50)
    print("Schema Manager Info:")
    print("=" * 50)
    print(f"Version: {schema_manager._version}")
    print(f"Supported Catalogs: {list(schema_manager.supported_catalogs.keys())}")
    print(f"Basic Catalog ID: {schema_manager._basic_catalog.catalog_id}")

    print("\n" + "=" * 50)
    print("Validation Test:")
    print("=" * 50)
    
    test_valid_response = """Here's an explanation of Punnett squares.

---a2ui_JSON---
[
  {
    "beginRendering": {
      "surfaceId": "genetics_ui",
      "root": "main_container"
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "genetics_ui",
      "components": [
        {
          "id": "main_container",
          "component": {
            "Container": {
              "children": [
                {
                  "id": "header_text",
                  "component": {
                    "Text": {
                      "text": "Punnett Square Example"
                    }
                  }
                },
                {
                  "id": "subheader_text",
                  "component": {
                    "Text": {
                      "text": "Aa × Aa Cross"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  }
]
"""
    
    text_part, is_valid, error = validate_and_fix_response(test_valid_response)
    print(f"Test Result: {'✅ Valid' if is_valid else '❌ Invalid'}")
    if error:
        print(f"Error: {error}")
    
    print("\n✅ A2UI Service test completed successfully!")
