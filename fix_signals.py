import re

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'r') as f:
    content = f.read()

lists_signals = '''
  // Catálogos desde Backend
  private parametrosService = inject(ParametrosService);
  estadosCuentaList = signal<Parametro[]>([]);
  mesesList = signal<Parametro[]>([]);
  mediosPagoList = signal<Parametro[]>([]);

  // Filtros
  filtroTexto = signal('');
  filtroEstado = signal('TODOS');
  filtroMes = signal('TODOS');

  onFiltrarFacturas(event: any) {
    this.filtroTexto.set(event.texto);
    this.filtroEstado.set(event.estado);
    this.filtroMes.set(event.mes);
  }
'''
if 'private parametrosService = inject' not in content:
    content = content.replace("export class TesoreriaComponent implements OnInit {", "export class TesoreriaComponent implements OnInit {\n" + lists_signals)

with open('src/app/pages/tesoreria/tesoreria.component.ts', 'w') as f:
    f.write(content)
