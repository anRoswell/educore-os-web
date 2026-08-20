import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# We look for styles: [ ... ]
# We know it starts with "styles: [`" and ends with "  `]"
# It might be in the @Component decorator.
# We can use regex to replace it with styles: []
new_content = re.sub(r'styles:\s*\[`[\s\S]*?`\]', 'styles: []', content)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(new_content)
