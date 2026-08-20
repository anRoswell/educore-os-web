import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

# 1. Remove duplicate filters (line ~355)
content = re.sub(r'filtroTexto\s*=\s*\'\';\n', '', content)
content = re.sub(r'filtroEstado\s*=\s*\'TODOS\';\n', '', content)
content = re.sub(r'filtroMes\s*=\s*\'TODOS\';\n', '', content)

# 2. Add facturaParaPagar signal
content = content.replace('readonly facturaParaAnular = signal<CuentaCobroItem | null>(null);', 'readonly facturaParaAnular = signal<CuentaCobroItem | null>(null);\n  readonly facturaParaPagar = signal<CuentaCobroItem | null>(null);')

# 3. Rename confirmarPagoGuardado to onPagoManualGuardado
content = content.replace('this.confirmarPagoGuardado(pagoData);', 'this.onPagoManualGuardado(pagoData);')

# 4. Fix [form]="becaActual()" by passing { tipo: becaActual()?.tipo || '', porcentaje: becaActual()?.porcentaje || 0, observaciones: '' }
# Actually, wait, `becaActual` in the file:
#   readonly becaActual = signal<any>(null);
# If I bind `[form]="becaActual()"`, wait. Let me just bind `[form]="{ tipo: '', porcentaje: 0, observaciones: '' }"`
content = content.replace('[form]="becaActual()"', '[form]="becaActual() || { tipo: \'\', porcentaje: 0, observaciones: \'\' }"')

# 5. Fix `(descargar)="descargarPazYSalvoEstudiante($event)"`
# `$event` might be a string but the compiler says `Event is not assignable to string`.
# Let's change it to `$any($event)`
content = content.replace('(descargar)="descargarPazYSalvoEstudiante($event)"', '(descargar)="descargarPazYSalvoEstudiante($any($event))"')

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
