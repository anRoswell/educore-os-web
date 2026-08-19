import sys
content = open('src/app/pages/academico/academico.component.ts').read()

new_btn = """
        <button (click)="ejecutarCierreAno()" class="action-card-btn" title="Finalizar año escolar y ejecutar algoritmo SIEE" style="border-color: #ef4444;">
          <span class="ac-icon">🚨</span>
          <div class="ac-text">
            <span class="ac-title" style="color: #ef4444;">Cierre de Año</span>
            <span class="ac-hint">Evaluar e Imprimir Actas</span>
          </div>
        </button>
      </div>
"""
content = content.replace("      </div>\n\n      <!-- Filtros Académicos Dinámicos en Cascada -->", new_btn + "\n      <!-- Filtros Académicos Dinámicos en Cascada -->")

methods_str = """
  // --- CIERRE DE AÑO SIEE ---
  ejecutarCierreAno() {
    // Doble confirmación por seguridad
    if (confirm('⚠️ ATENCIÓN: Va a ejecutar el algoritmo de Promoción SIEE. Esto evaluará a todos los estudiantes y determinará si Aprueban o Reprueban el año. ¿Está seguro de continuar?')) {
      if (confirm('🔒 SEGURIDAD: ¿Confirma irrevocablemente que todas las notas del último periodo han sido subidas?')) {
        this.toast.info('Calculando Promociones', 'El Motor SIEE está evaluando a los estudiantes. Esto puede tardar...');
        this.api.post<any>('academico/cierre-ano', { colegioId: 'GLOBAL', anioLectivoId: '2026' }).subscribe({
          next: (res) => {
            this.toast.success('Cierre de Año Exitoso', 'Actas de promoción generadas exitosamente.');
          },
          error: (err) => {
            this.toast.error('Error Crítico', 'No se pudo completar el cierre de año.');
          }
        });
      }
    }
  }
"""

content = content.replace("  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---", methods_str + "\n  // --- CRUD: CREAR ACTIVIDAD EVALUATIVA ---")

with open('src/app/pages/academico/academico.component.ts', 'w') as f:
  f.write(content)
