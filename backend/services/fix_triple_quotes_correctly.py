# Fix the triple-quoted string structure in intent_service.py
with open('intent_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The problem: Line 116 has """ that prematurely closes the string
# Lines 117-147 are duplicate examples that should be inside the string
# We need to: 1) Remove line 116's """ and merge 117-147 into the string
#              2) Remove the duplicate lines 117-147

# Find line 115 (last line before the problematic """ at line 116)
# Find line 148 (first line after the duplicate section)

# Simpler approach: Rebuild the _build_system_prompt method correctly
import re

# Find the start of _build_system_prompt
pattern = r'(def _build_system_prompt\(self\) -> str:\s+return """\n)'
match = re.search(pattern, ''.join(lines))

if match:
    print(f'Found _build_system_prompt method at position {match.start()}')
    
    # Find the first closing """ after line 22
    content = ''.join(lines)
    first_closing_pos = content.find('"""', content.find('"""') + 3)
    
    if first_closing_pos != -1:
        print(f'First closing """ at position {first_closing_pos}')
        
        # Find where the duplicate section starts (look for "用户: "endicrone system"")
        duplicate_start = content.find('用户: "endicrone system"', first_closing_pos)
        
        if duplicate_start != -1:
            print(f'Duplicate section starts at position {duplicate_start}')
            
            # Find where this duplicate section ends (before next method)
            duplicate_end = content.find('\n\n    def _build_keyword_patterns', duplicate_start)
            
            if duplicate_end != -1:
                print(f'Duplicate section ends at position {duplicate_end}')
                
                # Remove the duplicate section (from first closing """ to before next method)
                # This removes both the premature closing and the duplicate examples
                new_content = content[:first_closing_pos] + content[duplicate_end:]
                
                print(f'Removed {duplicate_end - first_closing_pos} characters (duplicate section)')
                print(f'New content length: {len(new_content)} (old: {len(content)})')
                
                # Write back
                with open('intent_service.py', 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print('Fixed successfully!')
            else:
                print('Could not find duplicate end')
        else:
            print('Could not find duplicate start')
    else:
        print('Could not find _build_system_prompt method')
