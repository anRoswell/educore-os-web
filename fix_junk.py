import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

bad_block = '''  confirmarPagoManual(pagoData: any) {
    this.confirmarPagoGuardado(pagoData);
    this.cerrarModalPagoManual();
  }
`,
    };
    this.modalPagoManual.set(true);
  }'''

good_block = '''  confirmarPagoManual(pagoData: any) {
    this.confirmarPagoGuardado(pagoData);
    this.cerrarModalPagoManual();
  }'''

content = content.replace(bad_block, good_block)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
