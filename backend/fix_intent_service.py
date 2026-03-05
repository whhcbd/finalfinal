# Fix the syntax error in intent_service.py
with open('services/intent_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the premature string closing
new_lines = []
in_triple_string = False

for i, line in enumerate(lines):
    # Line 116 has premature """ - remove it
    if i == 115 and '"""' in line and i < len(lines) - 30:
        # Skip this line - it's the premature closing
        continue

    # Line 149 is the actual closing - keep it
    new_lines.append(line)

# Write back
with open('services/intent_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Fixed intent_service.py - removed premature string closure')
