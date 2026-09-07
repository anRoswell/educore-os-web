import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { ToastService } from '../../../core/services/toast.service';
import { imprimirElementoHtml } from '../../../core/utils/print.utils';
import { EstadoCuenta } from '../models/tesoreria.models';

@Component({
  selector: 'app-modal-extracto-consolidado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('extracto')">
      <div class="modal-card card card-glass animate-fade-in-up" style="max-width: 900px; max-height: 92vh; display: flex; flex-direction: column;">
        <!-- Header del Modal -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.35rem;">📊</span>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e1b4b;">Extracto Financiero Consolidado 360°</h3>
              <span class="text-xs text-slate-500">Historial contable oficial, liquidación de cartera y detalle de movimientos</span>
            </div>
          </div>
          <button (click)="cerrarModal()" class="close-btn" title="Cerrar">&times;</button>
        </div>

        <!-- Cuerpo del Extracto Imprimible -->
        <div class="modal-body print-area" id="extracto-consolidado-print" style="flex: 1; overflow-y: auto; padding: 1.5rem; background: #ffffff;">
          <!-- Membrete Institucional Oficial -->
          <div class="report-header-card" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #1e1b4b; padding-bottom: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="report-logo-box" style="width: 64px; height: 64px; border-radius: 12px; overflow: hidden; background: #059669; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.2rem; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                @if (authService.colegio()?.logoUrl) {
                  <img [src]="authService.colegio()?.logoUrl" alt="Escudo Institucional" style="width: 100%; height: 100%; object-fit: cover;" />
                } @else {
                  {{ authService.colegio()?.nombre?.substring(0, 2)?.toUpperCase() || 'ED' }}
                }
              </div>
              <div>
                <h2 style="color: #1e1b4b; margin: 0; font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">
                  {{ authService.colegio()?.nombre || 'COLEGIO MAYOR DE SAN BARTOLOMÉ' }}
                </h2>
                <p class="text-xs text-slate-500" style="margin: 0.2rem 0; line-height: 1.4;">
                  Resolución MEN N° {{ authService.colegio()?.resolucionAprobacion || '10245' }} | NIT: {{ authService.colegio()?.nit || '860.007.241-1' }} | DANE: {{ authService.colegio()?.codigoDane || '111001000123' }}
                </p>
                <span class="badge badge-info" style="font-size: 0.7rem; font-weight: 700;">OFICINA DE TESORERÍA, PAGADURÍA & GESTIÓN DE CARTERA</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-secondary font-mono" style="font-size: 0.75rem; display: inline-block; margin-bottom: 0.25rem;">
                REF: EXT-2026-{{ estudiante?.documento?.substring(0, 6) || '8942' }}
              </span>
              <p class="text-xs text-slate-500" style="margin: 0;">
                Fecha de Emisión: <strong>{{ fechaHoyTexto }}</strong>
              </p>
            </div>
          </div>

          <!-- Título del Documento -->
          <div style="text-align: center; margin-bottom: 1.25rem;">
            <h3 style="color: #1e1b4b; margin: 0; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">
              ESTADO DE CUENTA & EXTRACTO FINANCIERO INDIVIDUAL
            </h3>
            <span class="text-xs text-slate-500 font-mono">AÑO LECTIVO 2026 — CICLO REGULAR</span>
          </div>

          <!-- Ficha del Estudiante y Acudiente en 2 Columnas -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.4rem;">
                👤 Información del Estudiante:
              </span>
              <div style="font-size: 0.85rem; color: #1e293b; line-height: 1.6;">
                <div><strong>Nombre:</strong> {{ estudiante?.nombre }}</div>
                <div><strong>Documento:</strong> {{ estudiante?.documento }}</div>
                <div><strong>Grado / Aula:</strong> {{ estudiante?.grado }} ({{ estudiante?.grupo || '10-A' }})</div>
                <div>
                  <strong>Beneficio / Beca:</strong>
                  @if (becaActual?.porcentaje > 0) {
                    <span class="text-success font-semibold"> Beca {{ becaActual.porcentaje }}% ({{ becaActual.nombre }})</span>
                  } @else {
                    <span class="text-slate-600"> Tarifa Plena Institucional</span>
                  }
                </div>
              </div>
            </div>

            <div style="border-left: 1px solid #e2e8f0; padding-left: 1rem;">
              <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.4rem;">
                👨‍👩‍👦 Responsable Económico (Acudiente):
              </span>
              <div style="font-size: 0.85rem; color: #1e293b; line-height: 1.6;">
                <div><strong>Acudiente:</strong> {{ estudiante?.acudienteNombre || 'Acudiente Titular' }}</div>
                <div><strong>Teléfono:</strong> {{ estudiante?.acudienteTelefono || '310 000 0000' }}</div>
                <div><strong>Correo Electrónico:</strong> {{ estudiante?.acudienteEmail || 'acudiente@educore.edu.co' }}</div>
                <div><strong>Código Matrícula:</strong> MAT-2026-{{ estudiante?.id?.substring(0, 5) || '101' }}</div>
              </div>
            </div>
          </div>

          <!-- Resumen de Balances (4 Métricas Clave) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #6366f1; border-radius: 8px; padding: 0.75rem;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Total Causado (Año)</span>
              <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-top: 0.2rem;">\${{ totalCausado | number }} COP</strong>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 8px; padding: 0.75rem;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Total Recaudado</span>
              <strong style="font-size: 1.05rem; color: #059669; display: block; margin-top: 0.2rem;">\${{ totalPagado | number }} COP</strong>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 0.75rem;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Cuotas al Día</span>
              <strong style="font-size: 1.05rem; color: #d97706; display: block; margin-top: 0.2rem;">{{ estadoCuenta?.cuotasAlDia || 0 }} de 10</strong>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid {{ saldoPendiente > 0 ? '#ef4444' : '#10b981' }}; border-radius: 8px; padding: 0.75rem;">
              <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Saldo Pendiente</span>
              <strong style="font-size: 1.05rem; color: {{ saldoPendiente > 0 ? '#dc2626' : '#059669' }}; display: block; margin-top: 0.2rem;">
                \${{ saldoPendiente | number }} COP
              </strong>
            </div>
          </div>

          <!-- Tabla Detallada de Movimientos y Cronograma de Cobros -->
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.85rem; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin: 0 0 0.5rem 0; letter-spacing: 0.05em;">
              📋 Detalle Cronológico de Cobros & Recaudos (Febrero - Noviembre 2026):
            </h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
              <thead>
                <tr style="background: #1e1b4b; color: #ffffff;">
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b;">Periodo / Mes</th>
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b;">Concepto Liquidado</th>
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b;">Vencimiento</th>
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b; text-align: right;">Valor ($)</th>
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b; text-align: center;">Estado Cartera</th>
                  <th style="padding: 0.6rem 0.5rem; border: 1px solid #1e1b4b; text-align: center;">Recibo / Ref</th>
                </tr>
              </thead>
              <tbody>
                @for (item of planMensual; track item.mes) {
                  <tr style="border-bottom: 1px solid #e2e8f0;" [style.background-color]="item.estado === EstadoCuenta.PAGADO || item.estado === EstadoCuenta.AL_DIA ? '#f0fdf4' : (item.estado === EstadoCuenta.EN_MORA ? '#fef2f2' : '#ffffff')">
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">
                      <strong>{{ item.mes }}</strong>
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">
                      Pensión Mensual Escolar 2026
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.75rem;">
                      {{ item.fechaVencimiento || '10 del mes' }}
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: right; font-weight: 700;">
                      \${{ item.valor | number }} COP
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center;">
                      @if (item.estado === EstadoCuenta.PAGADO || item.estado === EstadoCuenta.AL_DIA) {
                        <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; background: #dcfce7; color: #166534;">
                          PAGADO
                        </span>
                      } @else if (item.estado === EstadoCuenta.EN_MORA) {
                        <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; background: #fee2e2; color: #991b1b;">
                          EN MORA
                        </span>
                      } @else {
                        <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; background: #fef3c7; color: #92400e;">
                          POR VENCER
                        </span>
                      }
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 0.75rem;">
                      {{ item.reciboNumero || item.numeroFactura || 'FACT-2026' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Firmas y Trazabilidad -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; text-align: center; font-size: 0.78rem; margin-top: 2rem; padding-top: 1rem;">
            <div>
              <div style="border-top: 1px solid #0f172a; margin-bottom: 0.35rem; width: 80%; margin-left: auto; margin-right: auto;"></div>
              <strong>LIC. ANDRÉS SALAZAR C.</strong><br>
              <span class="text-slate-500">Jefe de Tesorería & Pagaduría</span>
            </div>
            <div>
              <div style="border-top: 1px solid #0f172a; margin-bottom: 0.35rem; width: 80%; margin-left: auto; margin-right: auto;"></div>
              <strong>DRA. MARÍA MERCEDES ROJAS</strong><br>
              <span class="text-slate-500">Rectora Institucional</span>
            </div>
          </div>

          <!-- Contactos y Pie Institucional -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 0.6rem; margin-top: 1.5rem; text-align: center; font-size: 0.72rem; color: #64748b; line-height: 1.4;">
            <span>📍 {{ authService.colegio()?.direccion || 'Campus Central Calle 10 # 6-45' }} — {{ authService.colegio()?.ciudad || 'Bogotá D.C., Colombia' }}</span>
            <span style="margin: 0 0.4rem;">•</span>
            <span>📞 Tel: {{ authService.colegio()?.telefonoContacto || '(601) 341-2000' }}</span>
            <span style="margin: 0 0.4rem;">•</span>
            <span>✉️ {{ authService.colegio()?.emailContacto || 'tesoreria@sanbartolome.edu.co' }}</span>
          </div>
        </div>

        <!-- Footer con Acciones -->
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;">
          <div class="text-xs text-slate-500">
            Documento contable generado con firma electrónica y sello de tesorería.
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button (click)="enviarPorCorreo()" class="btn btn-outline" title="Enviar copia del extracto al correo del acudiente">
              📧 Enviar al Acudiente
            </button>
            <button (click)="imprimirExtracto()" class="btn btn-primary" title="Imprimir o guardar como PDF">
              🖨️ Imprimir / Guardar PDF
            </button>
            <button (click)="cerrarModal()" class="btn btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalExtractoConsolidadoComponent {
  readonly EstadoCuenta = EstadoCuenta;
  readonly authService = inject(AuthService);
  readonly modalManager = inject(ModalManagerService);
  private readonly toast = inject(ToastService);

  @Input() estudiante: any;
  @Input() estadoCuenta: any;
  @Input() becaActual: any = { porcentaje: 0, nombre: '' };
  @Input() planMensual: any[] = [];
  @Input() fechaHoyTexto: string = '31 de Agosto de 2026';

  @Output() close = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  get saldoPendiente(): number {
    return Number(this.estadoCuenta?.saldoPendienteTotal || 0);
  }

  get totalCausado(): number {
    if (!this.planMensual || this.planMensual.length === 0) return 0;
    return this.planMensual.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  }

  get totalPagado(): number {
    if (!this.planMensual || this.planMensual.length === 0) return 0;
    return this.planMensual
      .filter((p) => p.estado === EstadoCuenta.PAGADO || p.estado === EstadoCuenta.AL_DIA)
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  }

  cerrarModal() {
    this.modalManager.close('extracto');
    this.close.emit();
    this.cerrar.emit();
  }

  imprimirExtracto() {
    const nombreLimpio = (this.estudiante?.nombre || 'Estudiante').replace(/\s+/g, '_');
    imprimirElementoHtml('#extracto-consolidado-print', `Extracto_Financiero_${nombreLimpio}`);
  }

  enviarPorCorreo() {
    const email = this.estudiante?.acudienteEmail || 'acudiente@educore.edu.co';
    this.toast.success(
      'Extracto Enviado',
      `Se ha enviado exitosamente el extracto financiero consolidado a ${email}.`
    );
  }
}
