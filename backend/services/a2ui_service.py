import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'python' / 'a2ui_agent' / 'src'))

from a2ui.inference.schema.manager import A2uiSchemaManager, CustomCatalogConfig  # type: ignore
from a2ui.inference.schema.common_modifiers import remove_strict_validation  # type: ignore

BASE_DIR = Path(__file__).parent.parent

ROLE_DESCRIPTION = (
    "You are a helpful genetics teaching assistant specializing in genetics concepts and visualizations. "
    "Your final output MUST be a a2ui UI JSON response."
)

WORKFLOW_DESCRIPTION = """
To generate the response, you MUST follow these rules:
1. Your response MUST be in two parts, separated by the delimiter: `---a2ui_JSON---`.
2. The first part is your conversational text response explaining genetics concepts.
3. The second part is a single, raw JSON object which is a list of A2UI messages.
4. The JSON part MUST validate against the A2UI JSON SCHEMA provided below.
"""

UI_DESCRIPTION = """
IMPORTANT UI TEMPLATE SELECTION RULES:

1. **For general genetics questions** (definitions, explanations, basic concepts):
   - You MUST use the `GENERAL_EXAMPLE` template with Container, Header, and Text components.
   - Example: "What is a gene?", "Explain dominant and recessive traits"

2. **For Punnett square problems** (crossing, inheritance ratios):
   - You MUST use the `PUNNETT_SQUARE_EXAMPLE` template.
   - Include parent genotypes, offspring probabilities, and clear visual representation.
   - Example: "Aa × aa", "What are the offspring of BB × bb?"

3. **For DNA structure questions** (base pairing, sequences, mutations):
   - You MUST use the `DNA_STRUCTURE_EXAMPLE` template.
   - Show base pairing rules, sequence visualization.
   - Example: "How does DNA base pairing work?", "Show the sequence ATCG"

4. **For gene expression questions** (regulation, transcription, protein synthesis):
   - You MUST use the `GENE_EXPRESSION_EXAMPLE` template.
   - Show expression levels, regulatory elements.
   - Example: "How are genes regulated?", "Explain transcription"

5. **For population genetics** (allele frequencies, Hardy-Weinberg):
   - You MUST use the `PHENOTYPE_DISTRIBUTION_EXAMPLE` template.
   - Show population data, statistical distributions.
   - Example: "Calculate allele frequency", "Hardy-Weinberg equilibrium"

UI layout guidelines:
- Always start with a clear Header component summarizing the topic.
- Use Container with proper hierarchy for organized content.
- Provide concise explanations before or alongside visualizations.
- Ensure all visualizations have accompanying explanatory text.
- Use standard A2UI components (Button, Input, List) only for interactive elements when needed.
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


def get_system_prompt(use_ui: bool = True) -> str:
    """
    Generate a system prompt for the LLM.

    Args:
        use_ui: Whether to include A2UI schema in the prompt.

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

    return schema_manager.generate_system_prompt(
        role_description=ROLE_DESCRIPTION,
        workflow_description=WORKFLOW_DESCRIPTION,
        ui_description=UI_DESCRIPTION,
        include_schema=True,
        include_examples=True,
        validate_examples=True,
    )


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
