import sys
import os

# Add services directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from intent_service import IntentService
    print("SUCCESS: IntentService imported successfully")
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}: {e.msg}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
