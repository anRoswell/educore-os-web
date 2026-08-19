import sys

with open('src/app/pages/matriculas/matriculas.component.ts', 'r') as f:
    content = f.read()

signals = """  readonly modalNuevaMatricula = signal(false);
  readonly modalPlantillas = signal(false);
  plantillaContrato = '';
  plantillaPagare = '';
"""
content = content.replace("  readonly modalNuevaMatricula = signal(false);", signals)

with open('src/app/pages/matriculas/matriculas.component.ts', 'w') as f:
    f.write(content)
