# Find all triple quotes and their positions
with open('intent_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Checking for triple-quoted strings...")
print()

in_string = False
start_line = 0
for i, line in enumerate(lines):
    if '"""' in line:
        if not in_string:
            start_line = i
            in_string = True
            print(f"Line {i+1}: START triple-quoted string")
        else:
            in_string = False
            print(f"Line {i+1}: END triple-quoted string (started at line {start_line+1})")
    # Show context around line 220
    if i >= 215 and i <= 225:
        marker = ">>>" if i == 220 else "   "
        print(f"{marker}{i+1:4d}: {line.rstrip()}")
