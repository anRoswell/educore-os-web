import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

content = content.replace('helpKey=', 'term=')
content = content.replace('[busquedaEstudiante]="busquedaEstudiante()"', '')
content = content.replace('[cuentas]="cuentas()"', '')
content = content.replace('[pagos]="pagos()"', '')

content = content.replace('(pagarWompiCargo)="pagarWompi($event)"', '(pagarWompiCargo)="pagarWompi($any($event))"')
content = content.replace('(pagarCajaCargo)="abrirModalPagoDirecto($event)"', '(pagarCajaCargo)="abrirModalPagoDirecto($any($event))"')

content = content.replace('[facturaParaPagar]="facturaParaPagar()"', '')
content = content.replace('[form]="$any(becaActual() || {})"', '')

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
