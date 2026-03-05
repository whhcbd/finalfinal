# Fix the syntax error by removing duplicate example lines (117-147)
with open('intent_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the problematic section
# Look for the pattern: duplicate examples after first """
# This is roughly between line 116 and 147

# Simpler approach: Use regex to remove duplicate section
import re

# Find the _build_system_prompt method and fix it
pattern = r'(def _build_system_prompt\(self\) -> str:\s+return """[\s\S]*?)(.*?)(async def identify_intent)'

match = re.search(pattern, content, re.DOTALL)
if match:
    print('Found _build_system_prompt method')
    before = match.group(1)
    duplicate_section = match.group(2)
    after = match.group(3)
    
    print(f'Before: {len(content)} chars')
    print(f'Duplicate section length: {len(duplicate_section)} chars')
    
    # Reconstruct without duplicate section
    # The method should end after examples, not have duplicate examples
    # Let's find the first closing """
    first_triple_quote_end = content.find('"""', content.find('"""') + 3)
    
    if first_triple_quote_end != -1:
        # Find where duplicate section starts (after the first closing """)
        # Look for "用户: "endicrone system"" pattern
        duplicate_start = content.find('用户: "endicrone system"', first_triple_quote_end)
        
        if duplicate_start != -1:
            # Find where this duplicate section ends (before async def identify_intent)
            duplicate_end = content.find('\n\n    async def identify_intent', duplicate_start)
            
            if duplicate_end != -1:
                # Remove the duplicate section
                new_content = content[:duplicate_start] + '\n\n    async def identify_intent' + content[duplicate_end + len('\n\n    async def identify_intent'):]
                
                print(f'Removed duplicate section ({duplicate_end - duplicate_start} chars)')
                
                # Write back
                with open('intent_service.py', 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f'After: {len(new_content)} chars')
                print('Fixed successfully!')
            else:
                print('Could not find duplicate end')
        else:
            print('Could not find duplicate start')
    else:
        print('Could not find _build_system_prompt method')
