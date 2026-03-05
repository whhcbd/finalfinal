import py_compile
import sys

try:
    py_compile.compile('services/intent_service.py', doraise=True)
    print("✓ intent_service.py syntax is valid")
except py_compile.PyCompileError as e:
    print(f"✗ Syntax error in intent_service.py: {e}")
    sys.exit(1)

try:
    from services.intent_service import IntentService
    print("✓ IntentService imported successfully")
except Exception as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

print("All tests passed!")
