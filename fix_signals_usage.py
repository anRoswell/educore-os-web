import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Replace this.filtroTexto with this.filtroTexto() inside computed/functions
content = re.sub(r'this\.filtroTexto\.', 'this.filtroTexto().', content)
content = re.sub(r'this\.filtroTexto\)', 'this.filtroTexto())', content)
content = re.sub(r'this\.filtroEstado\b(?!\(\))', 'this.filtroEstado()', content)
content = re.sub(r'this\.filtroMes\b(?!\(\))', 'this.filtroMes()', content)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
