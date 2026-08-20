import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Replace the styles array block with an empty styles array or remove it
content = re.sub(r'styles: \[[\s\S]*?\]\)', 'styles: [])', content)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
