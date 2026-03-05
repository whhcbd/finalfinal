# Fix all Chinese punctuation in intent_service.py
with open('services/intent_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Chinese colons with English colons
content = content.replace('：', ':')

# Fix triple-quoted string structure
# Find the _build_system_prompt method and fix it
import re

# Remove the premature """ at line 116 area
pattern = r'(用户: "基因型和表型的区别是什么"\n输出: \{"intent": "general", "keywords": "genotype, phenotype, gene, inheritance"\}\n"""\n\n## EXAMPLES）'

replacement = r'用户: "基因型和表型的区别是什么"\n输出: {"intent": "general", "keywords": "genotype, phenotype, gene, inheritance"}\n"""'

content = re.sub(pattern, replacement, content)

# Fix docstring with Chinese punctuation
content = content.replace('    async def identify_intent(self, user_message: str) -> IntentResult:\n        """识别用户意图和提取关键词"""',
                        '    async def identify_intent(self, user_message: str) -> IntentResult:\n        """Identify user intent and extract keywords"""')

# Fix _build_keyword_patterns docstring
content = content.replace('    def _build_keyword_patterns(self) -> dict:\n        """构建生物遗传学术语的正则表达式模式\n        \n        Returns:',
                        '    def _build_keyword_patterns(self) -> dict:\n        """Build regex patterns for genetics terminology\n        \n        Returns:')

# Write back
with open('services/intent_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed all Chinese punctuation in intent_service.py')
