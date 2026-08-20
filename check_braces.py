with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    text = f.read()

open_braces = 0
for i, char in enumerate(text):
    if char == '{':
        open_braces += 1
    elif char == '}':
        open_braces -= 1
        if open_braces == 0:
            print(f"Class closed at index {i}, line {text.count(chr(10), 0, i) + 1}")
            break
