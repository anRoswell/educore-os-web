import sys

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

# Add signal
content = content.replace(
    'isSaving = signal<boolean>(false);',
    'isSaving = signal<boolean>(false);\n  isLoadingPlanilla = signal<boolean>(false);'
)

# Update logic to simulate network delay
old_cargar = """  cargarPlanillaAsistencia() {
    const id = this.cargaDocenteSeleccionada();
    if (!id) return;
    
    // Fake the student list since there is no get route specific to attendance students yet, 
    // we use the 'academico/planilla' trick or just mock.
    this.api.get<any[]>('academico/planilla', { grupoId: id }).subscribe({
      next: (items) => {
        if (items && items.length > 0) {"""

new_cargar = """  cargarPlanillaAsistencia() {
    const id = this.cargaDocenteSeleccionada();
    if (!id) return;
    
    this.isLoadingPlanilla.set(true);
    // Fake the student list since there is no get route specific to attendance students yet, 
    // we use the 'academico/planilla' trick or just mock.
    this.api.get<any[]>('academico/planilla', { grupoId: id }).subscribe({
      next: (items) => {
        setTimeout(() => {
          this.isLoadingPlanilla.set(false);
          if (items && items.length > 0) {"""
content = content.replace(old_cargar, new_cargar)

# Fix else/error blocks
old_else_mock = """        } else {
          // Mock data if empty
          this.alumnosLista.set(["""
new_else_mock = """        } else {
          // Mock data if empty
          this.alumnosLista.set(["""
content = content.replace(old_else_mock, new_else_mock) # no change needed here

old_closing = """          ]);
        }
      },
      error: () => {
         this.alumnosLista.set(["""
new_closing = """          ]);
        }
        }, 600); // 600ms skeleton delay
      },
      error: () => {
        setTimeout(() => {
          this.isLoadingPlanilla.set(false);
          this.alumnosLista.set(["""
content = content.replace(old_closing, new_closing)

old_error_end = """          ]);
      }
    });"""
new_error_end = """          ]);
        }, 600);
      }
    });"""
content = content.replace(old_error_end, new_error_end)

# Update HTML Stats Grid
old_p_total = "<p>{{ alumnosLista().length }} Alumnos</p>"
new_p_total = """@if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 80px; height: 32px;"></div> } @else { <p>{{ alumnosLista().length }} Alumnos</p> }"""
content = content.replace(old_p_total, new_p_total)

old_p_presentes = "<p>{{ totalesAsistencia().presentes }}</p>"
new_p_presentes = """@if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().presentes }}</p> }"""
content = content.replace(old_p_presentes, new_p_presentes)

old_p_retardos = "<p>{{ totalesAsistencia().retardos }}</p>"
new_p_retardos = """@if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().retardos }}</p> }"""
content = content.replace(old_p_retardos, new_p_retardos)

old_p_faltas = "<p>{{ totalesAsistencia().faltas }}</p>"
new_p_faltas = """@if (isLoadingPlanilla()) { <div class="skeleton-box" style="width: 40px; height: 32px;"></div> } @else { <p>{{ totalesAsistencia().faltas }}</p> }"""
content = content.replace(old_p_faltas, new_p_faltas)

# Update HTML Table
old_tbody = """                <tbody>
                  @for (a of alumnosLista(); track a.matriculaId; let i = $index) {"""
new_tbody = """                <tbody>
                  @if (isLoadingPlanilla()) {
                    @for (item of [1,2,3,4,5]; track item) {
                      <tr>
                        <td><div class="skeleton-box" style="width: 20px; height: 20px;"></div></td>
                        <td><div class="skeleton-box" style="width: 150px; height: 20px;"></div></td>
                        <td><div class="skeleton-box" style="width: 180px; height: 36px; border-radius: 8px;"></div></td>
                        <td><div class="skeleton-box" style="width: 46px; height: 24px; border-radius: 12px;"></div></td>
                        <td><div class="skeleton-box" style="width: 100px; height: 30px;"></div></td>
                      </tr>
                    }
                  } @else {
                  @for (a of alumnosLista(); track a.matriculaId; let i = $index) {"""
content = content.replace(old_tbody, new_tbody)

old_tbody_end = """                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center text-slate-500 py-4">Selecciona un grupo para cargar la planilla de estudiantes.</td>
                    </tr>
                  }
                </tbody>"""
new_tbody_end = """                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center text-slate-500 py-4">Selecciona un grupo para cargar la planilla de estudiantes.</td>
                    </tr>
                  }
                  }
                </tbody>"""
content = content.replace(old_tbody_end, new_tbody_end)

# Add CSS animation
old_css = """    .stat-card:hover {
      transform: translateY(-2px);"""
new_css = """    .skeleton-box {
      background: #e2e8f0;
      background-image: linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 6px;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .stat-card:hover {
      transform: translateY(-2px);"""
content = content.replace(old_css, new_css)

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
