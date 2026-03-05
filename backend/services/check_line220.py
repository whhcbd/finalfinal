# Check line 220 for any hidden characters
with open('intent_service.py', 'rb') as f:
    content = f.read()

lines = content.split(b'\n')
for i in range(215, 225):
    line = lines[i]
    print(f"Line {i+1} ({len(line)} bytes): {line}")
    print(f"  Decoded: {line.decode('utf-8', errors='replace')[:100]}")
