import py_compile
import sys

try:
    py_compile.compile('intent_service.py', doraise=True)
    print("Syntax is correct!")
except py_compile.PyCompileError as e:
    print(f"Syntax error at line {e.lineno}:")
    print(f"  {e.msg}")
    print(f"  {e.text}")
