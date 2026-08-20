import re

with open('src/app/pages/tesoreria/tabs/tesoreria-facturas.component.ts', 'r') as f:
    content = f.read()

content = content.replace("import { Component, EventEmitter, Input, Output } from '@angular/core';", "import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';\nimport { Parametro } from '../../core/services/parametros.service';")
content = content.replace("  standalone: true,\n", "")
content = content.replace("@Component({\n  selector: 'app-tesoreria-facturas',\n", "@Component({\n  selector: 'app-tesoreria-facturas',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n")
content = content.replace(
'''            <option value="TODOS">Todos los Estados</option>
            <option [value]="EstadoCuenta.AL_DIA">🟢 Al Día (Pagado)</option>
            <option [value]="EstadoCuenta.POR_VENCER">🟡 Por Vencer</option>
            <option [value]="EstadoCuenta.EN_MORA">🔴 En Mora (>30 días)</option>
            <option [value]="EstadoCuenta.ANULADO">⚪ Anulado</option>''',
'''            <option value="TODOS">Todos los Estados</option>
            @for (estado of estadosCuentaList(); track estado.codigo) {
              <option [value]="estado.codigo">{{ estado.nombre }}</option>
            }'''
)
content = content.replace(
'''            <option value="TODOS">Todos los Meses</option>
            <option value="Agosto 2026">Agosto 2026</option>
            <option value="Julio 2026">Julio 2026</option>
            <option value="Junio 2026">Junio 2026</option>
            <option value="Mayo 2026">Mayo 2026</option>''',
'''            <option value="TODOS">Todos los Meses</option>
            @for (mes of mesesList(); track mes.codigo) {
              <option [value]="mes.codigo">{{ mes.nombre }}</option>
            }'''
)
content = content.replace(" cuentasFiltradas;", " cuentasFiltradas();")

ts_code = """export class TesoreriaFacturasComponent {
  readonly EstadoCuenta = EstadoCuenta;
  
  cuentasFiltradas = input<CuentaCobroItem[]>([]);
  estadosCuentaList = input<Parametro[]>([]);
  mesesList = input<Parametro[]>([]);
  filtroTexto = input('');
  filtroEstado = input('TODOS');
  filtroMes = input('TODOS');

  filtrar = output<{ texto: string, estado: string, mes: string }>();
  verFicha360 = output<string>();
  pagarWompi = output<CuentaCobroItem>();
  pagarCaja = output<CuentaCobroItem>();
  editarValor = output<CuentaCobroItem>();
  anularFactura = output<CuentaCobroItem>();
  verRecibo = output<CuentaCobroItem>();
  descargarPazYSalvo = output<string>();

  onFilterChange(type: 'texto'|'estado'|'mes', value: string) {
    this.filtrar.emit({
      texto: type === 'texto' ? value : this.filtroTexto(),
      estado: type === 'estado' ? value : this.filtroEstado(),
      mes: type === 'mes' ? value : this.filtroMes()
    });
  }
}"""
content = re.sub(r'export class TesoreriaFacturasComponent \{.*\}', ts_code, content, flags=re.DOTALL)

with open('src/app/pages/tesoreria/tabs/tesoreria-facturas.component.ts', 'w') as f:
    f.write(content)
