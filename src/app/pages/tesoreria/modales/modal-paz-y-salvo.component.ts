import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { imprimirElementoHtml } from '../../../core/utils/print.utils';

@Component({
  selector: 'app-modal-paz-y-salvo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('pazSalvo')">
      <div class="modal-card card card-glass" style="max-width: 750px;">
        <div class="modal-header">
          <h3>📄 Certificado de Paz y Salvo Financiero</h3>
          <button (click)="cerrarModal()" class="close-btn">&times;</button>
        </div>

        <div class="modal-body print-area">
          <div class="report-header-card" style="display: flex; align-items: center; gap: 1rem; border-bottom: 2px solid #1e1b4b; padding-bottom: 0.75rem;">
            <div class="report-logo-box" style="width: 56px; height: 56px; border-radius: 10px; overflow: hidden; background: #059669; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
              @if (authService.colegio()?.logoUrl) {
                <img [src]="authService.colegio()?.logoUrl" alt="Escudo" style="width: 100%; height: 100%; object-fit: cover;" />
              } @else {
                {{ authService.colegio()?.nombre?.substring(0, 2)?.toUpperCase() }}
              }
            </div>
            <div style="flex: 1;">
              <h2 style="color: #1e1b4b; margin: 0; font-size: 1.2rem; font-weight: 800;">{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</h2>
              <p class="text-xs text-slate-500" style="margin: 0.2rem 0;">Resolución de Aprobación Oficial MEN N° {{ authService.colegio()?.resolucionAprobacion || '10245' }} | NIT: {{ authService.colegio()?.nit }} | DANE: {{ authService.colegio()?.codigoDane }}</p>
            </div>
          </div>

          <div class="text-center my-4">
            <h3 style="color: #1e1b4b; letter-spacing: 0.1em; text-transform: uppercase;">CERTIFICADO DE PAZ Y SALVO FINANCIERO</h3>
            <span class="text-xs font-mono" style="color: #059669; font-weight: bold;">CÓDIGO DE VERIFICACIÓN DIGITAL: {{ hashPazYSalvo }}</span>
          </div>

          <div class="p-3" style="font-size: 0.95rem; line-height: 1.8; text-align: justify; color: #1e293b;">
            <p>
              La Oficina de Tesorería y Pagaduría del <strong>{{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}</strong>,
              hace constar que el(la) estudiante:
            </p>
            <div class="my-3 p-3 text-center" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <h3 style="margin: 0; color: #1e1b4b;">{{ estudiante?.nombre }}</h3>
              <p style="margin: 0.25rem 0; font-size: 0.9rem;">
                Identificado(a) con <strong>{{ estudiante?.documento }}</strong>, matriculado(a) en el grado <strong>{{ estudiante?.grado }} ({{ estudiante?.grupo }})</strong>
              </p>
            </div>
            <p>
              Se encuentra a la fecha <strong>A PAZ Y SALVO POR TODO CONCEPTO DE DERECHOS ACADÉMICOS, MATRÍCULAS, PENSIONES MENSUALES Y SERVICIOS COMPLEMENTARIOS</strong> correspondientes al presente año lectivo 2026.
            </p>
            <p class="text-xs text-slate-500 mt-2">
              Se expide el presente documento a solicitud del interesado en {{ authService.colegio()?.ciudad || 'Bogotá D.C.' }}, a los {{ fechaHoyTexto }}.
            </p>
          </div>

          <div class="firmas-grid mt-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; text-align: center; font-size: 0.8rem; margin-top: 2rem;">
            <div>
              <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
              <strong>LIC. ANDRÉS SALAZAR C.</strong><br>
              <span>Jefe de Tesorería & Cartera</span>
            </div>
            <div>
              <div style="border-top: 1px solid #0f172a; margin-bottom: 0.25rem;"></div>
              <strong>DRA. MARÍA MERCEDES ROJAS</strong><br>
              <span>Rectora Institucional</span>
            </div>
          </div>

          <!-- Pie de página institucional con Dirección, Teléfono y Correo -->
          <div class="report-footer-contacts mt-4" style="border-top: 1px solid #e2e8f0; padding-top: 0.6rem; text-align: center; font-size: 0.75rem; color: #64748b;">
            <span>📍 Dirección: {{ authService.colegio()?.direccion || 'Campus Central' }} — {{ authService.colegio()?.ciudad || 'Colombia' }}</span>
            <span style="margin: 0 0.5rem;">•</span>
            <span>📞 Tel: {{ authService.colegio()?.telefonoContacto || '(601) 341-2000' }}</span>
            <span style="margin: 0 0.5rem;">•</span>
            <span>✉️ Correo: {{ authService.colegio()?.emailContacto || 'rectoria@sanbartolome.edu.co' }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="imprimir()" class="btn btn-primary">
            🖨️ Imprimir Paz y Salvo Oficial
          </button>
          <button (click)="cerrarModal()" class="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalPazYSalvoComponent {
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);

  @Input() estudiante: any;
  @Input() hashPazYSalvo: string = '';
  @Input() fechaHoyTexto: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() descargar = new EventEmitter<any>();

  cerrarModal() {
    this.modalManager.close('pazSalvo');
    this.close.emit();
    this.cerrar.emit();
  }

  imprimir() {
    this.descargar.emit(this.estudiante);
    imprimirElementoHtml('.print-area', `Paz y Salvo - ${this.estudiante?.nombre || 'Estudiante'}`);
  }
}
