# Fix the syntax error by removing duplicate example lines (117-147)
with open('intent_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 117-147 (indices 116-147, 0-indexed)
# This removes the duplicate example code outside the string
new_lines = lines[:116] + lines[147:]

# Write back
with open('intent_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Fixed intent_service.py - removed {147-116} lines (117-147)')
print('Total lines before:', len(lines))
print('Total lines after:', len(new_lines))
