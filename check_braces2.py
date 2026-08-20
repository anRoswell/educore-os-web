with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    text = f.read()

class_idx = text.find('export class TesoreriaComponent')
text_from_class = text[class_idx:]
open_braces = 0
found_first = False
for i, char in enumerate(text_from_class):
    if char == '{':
        open_braces += 1
        found_first = True
    elif char == '}':
        open_braces -= 1
        if found_first and open_braces == 0:
            print(f"Class closed at relative index {i}, global line {text.count(chr(10), 0, class_idx + i) + 1}")
            break
