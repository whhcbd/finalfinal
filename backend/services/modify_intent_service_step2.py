import re

# Read the file
with open('services/intent_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new keyword patterns to _build_keyword_patterns method
old_patterns_end = '''            'genetic_engineering': r'(?:(?:基因工程)|(?:CRISPR)|(?:基因编辑)|genetic.?engineering|CRISPR|gene.?editing)',
            'double_helix': r'(?:(?:双螺旋)|(?:double.?helix))'
        }
        return patterns'''

new_patterns_end = '''            'genetic_engineering': r'(?:(?:基因工程)|(?:CRISPR)|(?:基因编辑)|genetic.?engineering|CRISPR|gene.?editing)',
            'double_helix': r'(?:(?:双螺旋)|(?:double.?helix))',
            'punnett_square': r'(?:(?:后代)|(?:F1代)|(?:F2代)|(?:杂交)|(?:基因型比例)|(?:表型比例)|(?:棋盘)|offspring|genotype.?ratio|phenotype.?ratio)',
            'base_pairing': r'(?:(?:碱基配对)|A.?T|C.?G|base.?pairing)',
            'nucleotide': r'(?:(?:核苷酸)|(?:脱氧核糖)|nucleotide|deoxyribose)',
            'population': r'(?:(?:群体)|population)',
            'expression_level': r'(?:(?:表达水平)|expression.?level)',
            'inheritance_pattern': r'(?:(?:遗传模式)|(?:遗传病)|inheritance.?pattern|genetic.?disease)',
            'recombination': r'(?:(?:重组)|recombination)'
        }
        return patterns'''

content = content.replace(old_patterns_end, new_patterns_end)

# Write back
with open('services/intent_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Keyword patterns updated successfully')
