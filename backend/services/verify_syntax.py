import py_compile

try:
    with open('intent_service.py', 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Try to compile
    py_compile.compile(code, '<string>', 'exec')
    print("SUCCESS: intent_service.py syntax is correct!")
    
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}, column {e.offset}:")
    print(f"  {e.msg}")
    print(f"\nContext (lines {max(1, e.lineno-3)} to {e.lineno+3}):")
    lines = code.split('\n')
    for i in range(max(0, e.lineno-3), min(len(lines), e.lineno+3)):
        marker = " >>>" if i == e.lineno-1 else "    "
        print(f"{marker}{i+1:4d}: {lines[i][:100]}")
except Exception as e:
    print(f"ERROR: {e}")
