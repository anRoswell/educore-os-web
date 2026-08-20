import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# Replace variables
content = content.replace("nuevoPagoManual: any = null;", "facturaParaPagar = signal<CuentaCobroItem | null>(null);")

# Update abrirModalPagoDirecto
abrir_modal = '''  abrirModalPagoDirecto(cuenta: CuentaCobroItem) {
    this.facturaParaPagar.set(cuenta);
    this.modalPagoManual.set(true);
  }

  cerrarModalPagoManual() {
    this.modalPagoManual.set(false);
    this.facturaParaPagar.set(null);
  }

  confirmarPagoManual(pagoData: any) {
    this.confirmarPagoGuardado(pagoData);
    this.cerrarModalPagoManual();
  }
'''
content = re.sub(r'abrirModalPagoDirecto\(cuenta: CuentaCobroItem\) \{[\s\S]*?\}', abrir_modal, content)

# update HTML bindings if necessary, but I already did them correctly in fix_all.py:
# [facturaParaPagar]="facturaParaPagar()"
# (cerrar)="cerrarModalPagoManual()"
# (pagoRegistrado)="confirmarPagoManual($event)"

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
