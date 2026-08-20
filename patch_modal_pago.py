import re

with open('src/app/pages/tesoreria/modales/modal-pago-manual.component.ts', 'r') as f:
    content = f.read()

# Add inputs
content = content.replace("import { Component, EventEmitter, Input, Output } from '@angular/core';", "import { Component, input, output, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';\nimport { Parametro } from '../../../core/services/parametros.service';")

# Change detection & remove standalone
content = content.replace("  standalone: true,\n", "")
content = content.replace("@Component({\n  selector: 'app-modal-pago-manual',\n", "@Component({\n  selector: 'app-modal-pago-manual',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n")

content = content.replace(
'''                <option value="EFECTIVO">💵 Efectivo en Ventanilla</option>
                <option value="TRANSFERENCIA_BANCOLOMBIA">🏦 Transferencia Bancolombia / Davivienda</option>
                <option value="NEQUI_QR">📱 Nequi / Daviplata QR</option>
                <option value="TARJETA_CREDITO">💳 Datáfono / Tarjeta</option>''',
'''                @for (medio of mediosPagoList(); track medio.codigo) {
                  <option [value]="medio.codigo">{{ medio.nombre }}</option>
                }'''
)

# Replace @Input and @Output with input and output
# Well, wait, mixing Input/Output with input/output signals is okay in Angular 22, 
# but if I just add mediosPagoList as input(), I don't have to refactor everything.
# Let's just add the input().
ts_code = '''export class ModalPagoManualComponent {
  mediosPagoList = input<Parametro[]>([]);
  @Input() visible = false;'''
content = content.replace("export class ModalPagoManualComponent {\n  @Input() visible = false;", ts_code)

with open('src/app/pages/tesoreria/modales/modal-pago-manual.component.ts', 'w') as f:
    f.write(content)
