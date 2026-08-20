import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Fix ModalNuevoCobroComponent
content = content.replace("[nuevoCobro]=\"nuevoCobro\"", "[form]=\"nuevoCobro\"\n        [conceptosList]=\"conceptosList()\"")

# Fix ModalPazYSalvoComponent
content = content.replace("[saldoTotal]=\"estadoCuentaEstudiante().saldoPendienteTotal\"", "[hashPazYSalvo]=\"'PYZ-8923-26'\"\n        [fechaHoyTexto]=\"'20 de Agosto de 2026'\"")

# Fix ModalBecaComponent
content = content.replace("[becaActual]=\"becaActual()\"", "[form]=\"becaActual()\"")

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
