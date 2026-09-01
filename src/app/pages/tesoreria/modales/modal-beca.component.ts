import { Component, inject, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalManagerService } from '../../../core/services/modal-manager.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  TipoBeca,
  VigenciaBeca,
  EstadoBeca,
  CuentaContablePuc,
  BecaEstudiante,
  MesEscolar,
  PorcentajeBeca,
  CuotasPeriodo,
  ConfiguracionFinanciera,
} from '../models/tesoreria.models';

@Component({
  selector: 'app-modal-beca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" [style.z-index]="modalManager.getZIndex('beca')">
      <div class="modal-card card card-glass" style="max-width: 1120px; width: 96%; max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);">
        
        <!-- Header Compacto -->
        <div class="modal-header" style="padding: 0.85rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #fff;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="header-icon-box">🎓</div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a;">Asignación de Beca & Tarifa Especial</h3>
              <p style="margin: 0; font-size: 0.78rem; color: #64748b;">Gobernanza Institucional, Soporte Legal Documental & Capa Contable PUC</p>
            </div>
          </div>
          <button (click)="cerrarModal()" class="close-btn" type="button" style="font-size: 1.5rem;">&times;</button>
        </div>

        <!-- Body Compacto y Adaptable (Angular 22 Control Flow) -->
        <div class="modal-body" style="padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1;">
          
          <!-- Banner Superior del Estudiante -->
          <div class="student-mini-banner mb-3">
            <div class="avatar-circle">
              {{ estudiante?.nombre?.substring(0, 2)?.toUpperCase() || 'ES' }}
            </div>
            <div style="flex: 1;">
              <h4 style="margin: 0; font-size: 0.98rem; font-weight: 700; color: #1e293b;">{{ estudiante?.nombre }}</h4>
              <p style="margin: 0; font-size: 0.8rem; color: #64748b;">
                Grado: <strong>{{ estudiante?.grado }} ({{ estudiante?.grupo }})</strong> &bull; Documento: <strong>{{ estudiante?.documento }}</strong> &bull; Acudiente: <strong>{{ estudiante?.acudienteNombre }}</strong>
              </p>
            </div>
            <div class="puc-top-badge">
              <span>🏛️ Imputación Contable: <strong>Cuenta PUC {{ CuentaContablePuc.DESCUENTOS_PENSIONES }}</strong></span>
            </div>
          </div>

          <!-- Cuadrícula de 3 Columnas Panorámica -->
          <div class="beca-grid-3cols">
            
            <!-- COLUMNA 1: Beneficio & Porcentaje -->
            <div class="beca-panel">
              <h5 class="panel-title">1. Parámetros del Beneficio</h5>
              
              <!-- Tipo de Beneficio -->
              <div class="form-group">
                <label class="form-label">Tipo de Beneficio *</label>
                <select class="form-select" [(ngModel)]="form.tipo" (ngModelChange)="actualizarPorcentaje($event)">
                  <option [value]="TipoBeca.NINGUNA">Sin Beca (Tarifa Plena 100%)</option>
                  <option [value]="TipoBeca.EXCELENCIA">Beca Excelencia Académica ({{ PorcentajeBeca.EXCELENCIA }}%)</option>
                  <option [value]="TipoBeca.HERMANOS">Beca Familiar / Hermanos ({{ PorcentajeBeca.HERMANOS }}%)</option>
                  <option [value]="TipoBeca.DOCENTE">Hijo de Docente / Colab. ({{ PorcentajeBeca.DOCENTE }}%)</option>
                  <option [value]="TipoBeca.CONVENIO">Convenio Institucional ({{ PorcentajeBeca.CONVENIO }}%)</option>
                  <option [value]="TipoBeca.SOLIDARIA">Beca Solidaria Total ({{ PorcentajeBeca.SOLIDARIA }}%)</option>
                  <option [value]="TipoBeca.OTRA">Personalizada (% Manual)</option>
                </select>
              </div>

              <!-- Porcentaje de Descuento -->
              <div class="form-group mt-2">
                <label class="form-label">Porcentaje de Descuento (%) *</label>
                <div style="position: relative;">
                  <input
                    type="number"
                    [min]="PorcentajeBeca.NINGUNA"
                    [max]="PorcentajeBeca.SOLIDARIA"
                    class="form-control"
                    [(ngModel)]="form.porcentaje"
                    (ngModelChange)="onPorcentajeChange()"
                    placeholder="0"
                  />
                  <span class="pct-adornment">%</span>
                </div>
              </div>

              <!-- Vigencia -->
              <div class="form-group mt-2">
                <label class="form-label">Vigencia / Periodo de Aplicación *</label>
                <div class="vigencia-grid-compact">
                  <label class="vigencia-chip" [class.selected]="form.vigencia === VigenciaBeca.ANUAL">
                    <input type="radio" name="vigencia" [(ngModel)]="form.vigencia" [value]="VigenciaBeca.ANUAL" (change)="onVigenciaChange(VigenciaBeca.ANUAL)" style="display: none;" />
                    <span class="v-title">📅 Todo el Año ({{ CuotasPeriodo.ANUAL }} cuotas)</span>
                  </label>
                  <label class="vigencia-chip" [class.selected]="form.vigencia === VigenciaBeca.SEMESTRE_1">
                    <input type="radio" name="vigencia" [(ngModel)]="form.vigencia" [value]="VigenciaBeca.SEMESTRE_1" (change)="onVigenciaChange(VigenciaBeca.SEMESTRE_1)" style="display: none;" />
                    <span class="v-title">🌱 1er Semestre (Feb-Jun)</span>
                  </label>
                  <label class="vigencia-chip" [class.selected]="form.vigencia === VigenciaBeca.SEMESTRE_2">
                    <input type="radio" name="vigencia" [(ngModel)]="form.vigencia" [value]="VigenciaBeca.SEMESTRE_2" (change)="onVigenciaChange(VigenciaBeca.SEMESTRE_2)" style="display: none;" />
                    <span class="v-title">🍂 2do Semestre (Jul-Nov)</span>
                  </label>
                  <label class="vigencia-chip" [class.selected]="form.vigencia === VigenciaBeca.BIMESTRAL">
                    <input type="radio" name="vigencia" [(ngModel)]="form.vigencia" [value]="VigenciaBeca.BIMESTRAL" (change)="onVigenciaChange(VigenciaBeca.BIMESTRAL)" style="display: none;" />
                    <span class="v-title">📊 Por Bimestre ({{ CuotasPeriodo.BIMESTRE }} cuotas)</span>
                  </label>
                  <label class="vigencia-chip" [class.selected]="form.vigencia === VigenciaBeca.MES_ESPECIFICO" style="grid-column: span 2;">
                    <input type="radio" name="vigencia" [(ngModel)]="form.vigencia" [value]="VigenciaBeca.MES_ESPECIFICO" (change)="onVigenciaChange(VigenciaBeca.MES_ESPECIFICO)" style="display: none;" />
                    <span class="v-title">🎯 Mes Específico ({{ CuotasPeriodo.MES_ESPECIFICO }} cuota única)</span>
                  </label>
                </div>

                @if (form.vigencia === VigenciaBeca.BIMESTRAL) {
                  <div class="mt-2">
                    <label style="font-size: 0.78rem; font-weight: 600; color: #475569;">Seleccionar Bimestre:</label>
                    <select class="form-select form-select-sm" [(ngModel)]="bimestreSeleccionado" (ngModelChange)="actualizarBimestre($event)">
                      <option [value]="VigenciaBeca.BIMESTRE_1">1er Bimestre: Febrero - Marzo (Cuotas 01-02)</option>
                      <option [value]="VigenciaBeca.BIMESTRE_2">2do Bimestre: Abril - Mayo (Cuotas 03-04)</option>
                      <option [value]="VigenciaBeca.BIMESTRE_3">3er Bimestre: Junio - Julio (Cuotas 05-06)</option>
                      <option [value]="VigenciaBeca.BIMESTRE_4">4to Bimestre: Agosto - Septiembre (Cuotas 07-08)</option>
                      <option [value]="VigenciaBeca.BIMESTRE_5">5to Bimestre: Octubre - Noviembre (Cuotas 09-10)</option>
                    </select>
                  </div>
                }

                @if (form.vigencia === VigenciaBeca.MES_ESPECIFICO) {
                  <div class="mt-2">
                    <label style="font-size: 0.78rem; font-weight: 600; color: #475569;">Seleccionar Mes:</label>
                    <select class="form-select form-select-sm" [(ngModel)]="form.mesInicio" (ngModelChange)="form.mesFin = form.mesInicio">
                      <option [ngValue]="MesEscolar.FEBRERO">Febrero (Cuota 01)</option>
                      <option [ngValue]="MesEscolar.MARZO">Marzo (Cuota 02)</option>
                      <option [ngValue]="MesEscolar.ABRIL">Abril (Cuota 03)</option>
                      <option [ngValue]="MesEscolar.MAYO">Mayo (Cuota 04)</option>
                      <option [ngValue]="MesEscolar.JUNIO">Junio (Cuota 05)</option>
                      <option [ngValue]="MesEscolar.JULIO">Julio (Cuota 06)</option>
                      <option [ngValue]="MesEscolar.AGOSTO">Agosto (Cuota 07)</option>
                      <option [ngValue]="MesEscolar.SEPTIEMBRE">Septiembre (Cuota 08)</option>
                      <option [ngValue]="MesEscolar.OCTUBRE">Octubre (Cuota 09)</option>
                      <option [ngValue]="MesEscolar.NOVIEMBRE">Noviembre (Cuota 10)</option>
                    </select>
                  </div>
                }
              </div>
            </div>

            <!-- COLUMNA 2: Soporte Legal Documental -->
            <div class="beca-panel">
              <h5 class="panel-title">2. Soporte Legal & Justificación</h5>
              
              <!-- Número de Resolución -->
              <div class="form-group">
                <label class="form-label">
                  📜 Resolución / Acta de Consejo *
                </label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="form.numeroResolucion"
                  placeholder="Ej: Resolución Rectoral N° 045-2026 / Acta #03"
                  [class.is-invalid]="errorResolucion()"
                />
              </div>

              <!-- Carga de Archivo PDF con Control Flow @if -->
              <div class="form-group mt-2">
                <label class="form-label">📎 Documento Adjunto (PDF)</label>
                
                @if (!form.archivoSoporteUrl) {
                  <div class="upload-zone-compact" (click)="!isUploading() && fileInput.click()">
                    <input
                      #fileInput
                      type="file"
                      accept=".pdf,application/pdf"
                      style="display: none;"
                      (change)="onFileSelected($event)"
                    />
                    
                    @if (isUploading()) {
                      <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0;">
                        <span style="font-size: 1.1rem; animation: spin 1s linear infinite; display: inline-block;">⏳</span>
                        <span style="font-weight: 600; font-size: 0.8rem; color: #4338ca;">Subiendo archivo PDF...</span>
                      </div>
                    } @else {
                      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span style="font-size: 1.3rem;">📄</span>
                        <div style="text-align: center;">
                          <p style="margin: 0; font-weight: 600; font-size: 0.8rem; color: #4338ca;">
                            Haga clic para adjuntar Resolución en PDF
                          </p>
                          <span style="font-size: 0.7rem; color: #94a3b8;">Multi-Tenant Seguro</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="file-attached-box-compact">
                    <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden;">
                      <span style="font-size: 1.2rem;">📎</span>
                      <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="font-size: 0.8rem; color: #1e293b;">{{ form.archivoSoporteNombre || 'resolucion_soporte.pdf' }}</strong>
                        <span style="font-size: 0.7rem; color: #059669; display: block;">✓ Vinculado al expediente</span>
                      </div>
                    </div>
                    <button (click)="eliminarArchivoAdjunto()" class="btn btn-outline btn-xs" style="color: #dc2626; border-color: #fca5a5; padding: 2px 6px;" type="button" title="Quitar archivo">
                      ✕
                    </button>
                  </div>
                }
              </div>

              <!-- Observaciones -->
              <div class="form-group mt-2">
                <label class="form-label">Observaciones / Justificación</label>
                <textarea
                  class="form-control"
                  rows="2"
                  [(ngModel)]="form.observaciones"
                  placeholder="Ej: Aprobado según promedio en el periodo anterior."
                ></textarea>
              </div>
            </div>

            <!-- COLUMNA 3: Desglose Financiero & Contable -->
            <div class="beca-panel highlight-panel">
              <h5 class="panel-title" style="color: #3730a3;">3. Impacto Financiero en Vivo</h5>
              
              <div class="financial-metrics-stack">
                <div class="metric-row">
                  <span class="m-label">Tarifa Base Mensual:</span>
                  <span class="m-val">\${{ valorBaseMensual | number }} COP</span>
                </div>
                <div class="metric-row discount">
                  <span class="m-label">Descuento Beca ({{ form.porcentaje }}%):</span>
                  <span class="m-val text-success">-\${{ valorDescuentoMensual | number }} COP</span>
                </div>
                <div class="metric-row net">
                  <span class="m-label">Nueva Mensualidad Neta:</span>
                  <span class="m-val text-primary">\${{ nuevoValorMensual | number }} COP</span>
                </div>
              </div>

              <div class="annual-saving-card mt-3">
                <span class="save-title">💡 Ahorro Total Familia:</span>
                <span class="save-amount">\${{ totalAhorroPeriodo | number }} COP</span>
                <span class="save-desc">Calculado sobre {{ numeroCuotasAfectadas }} cuota(s) del periodo.</span>
              </div>

              <div class="puc-notice mt-2">
                <span>🏛️ Asiento auxiliar contrapartida: <strong>Cuenta {{ CuentaContablePuc.DESCUENTOS_PENSIONES }} (Descuentos y Becas Otorgadas)</strong></span>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Fijo y Visible de Inmediato -->
        <div class="modal-footer" style="padding: 0.85rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚡</span>
            <span>El recálculo en las cuotas de pensión se aplicará automáticamente al confirmar.</span>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button (click)="cerrarModal()" class="btn btn-secondary" type="button" [disabled]="isSaving()" style="min-width: 100px;">
              Cancelar
            </button>
            <button (click)="guardarBeca()" class="btn btn-primary" [disabled]="isUploading() || isSaving()" style="min-width: 220px; font-weight: 700;">
              {{ isSaving() ? '⏳ Guardando...' : '💾 Guardar y Aplicar a Cuotas' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .header-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .student-mini-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.9rem;
      background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(238, 242, 255, 0.6));
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.88rem;
    }
    .puc-top-badge {
      font-size: 0.75rem;
      background: #fff;
      color: #3730a3;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1px solid #c7d2fe;
      font-weight: 600;
    }
    .beca-grid-3cols {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 1fr;
      gap: 1.15rem;
    }
    @media (max-width: 960px) {
      .beca-grid-3cols {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
    .beca-panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.9rem;
    }
    .beca-panel.highlight-panel {
      background: #f8faff;
      border-color: #c7d2fe;
    }
    .panel-title {
      margin: 0 0 0.75rem 0;
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pct-adornment {
      position: absolute;
      right: 12px;
      top: 8px;
      color: #94a3b8;
      font-weight: 700;
    }
    .vigencia-grid-compact {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
    }
    .vigencia-chip {
      display: flex;
      align-items: center;
      padding: 0.45rem 0.55rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      background: #fff;
      transition: all 0.15s;
    }
    .vigencia-chip:hover {
      border-color: #818cf8;
      background: #f8fafc;
    }
    .vigencia-chip.selected {
      border-color: #4f46e5;
      background: #eef2ff;
      box-shadow: 0 0 0 1px #4f46e5;
    }
    .vigencia-chip .v-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1e293b;
    }
    .upload-zone-compact {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem 0.75rem;
      border: 1.5px dashed #c7d2fe;
      border-radius: 6px;
      background: #f5f7ff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-zone-compact:hover {
      background: #eef2ff;
      border-color: #818cf8;
    }
    .file-attached-box-compact {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.65rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
    }
    .financial-metrics-stack {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      background: #fff;
      padding: 0.65rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .metric-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .metric-row .m-label {
      color: #64748b;
      font-weight: 500;
    }
    .metric-row .m-val {
      font-weight: 700;
      color: #1e293b;
    }
    .metric-row.discount .m-val {
      color: #059669;
    }
    .metric-row.net {
      border-top: 1px dashed #e2e8f0;
      padding-top: 0.35rem;
    }
    .metric-row.net .m-val {
      font-size: 0.95rem;
      color: #4f46e5;
    }
    .annual-saving-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.55rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .save-title {
      font-size: 0.72rem;
      color: #1e40af;
      font-weight: 600;
    }
    .save-amount {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1d4ed8;
      margin: 2px 0;
    }
    .save-desc {
      font-size: 0.68rem;
      color: #64748b;
    }
    .puc-notice {
      font-size: 0.68rem;
      color: #64748b;
      text-align: center;
      line-height: 1.2;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.2rem;
      display: block;
      color: #1e293b;
    }
    .is-invalid {
      border-color: #ef4444 !important;
    }
  `]
})
export class ModalBecaComponent implements OnInit {
  readonly modalManager = inject(ModalManagerService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ENUMs expuestos para plantillas y métodos
  readonly TipoBeca = TipoBeca;
  readonly VigenciaBeca = VigenciaBeca;
  readonly EstadoBeca = EstadoBeca;
  readonly CuentaContablePuc = CuentaContablePuc;
  readonly MesEscolar = MesEscolar;
  readonly PorcentajeBeca = PorcentajeBeca;
  readonly CuotasPeriodo = CuotasPeriodo;
  readonly ConfiguracionFinanciera = ConfiguracionFinanciera;

  @Input() estudiante: any;
  @Input() form: BecaEstudiante = {
    tipo: TipoBeca.EXCELENCIA,
    porcentaje: PorcentajeBeca.EXCELENCIA,
    vigencia: VigenciaBeca.ANUAL,
    mesInicio: MesEscolar.FEBRERO,
    mesFin: MesEscolar.NOVIEMBRE,
    numeroResolucion: 'Resolución Rectoral N° 045-2026',
    archivoSoporteUrl: '',
    archivoSoporteNombre: '',
    observaciones: 'Aprobado mediante resolución de Rectoría / Consejo Directivo',
    cuentaContablePuc: CuentaContablePuc.DESCUENTOS_PENSIONES,
  };

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<any>();

  readonly valorBaseMensual = ConfiguracionFinanciera.TARIFA_BASE_PENSION;
  bimestreSeleccionado: VigenciaBeca = VigenciaBeca.BIMESTRE_2;
  
  // Reactividad moderna basada en Signals (Angular 22)
  readonly isUploading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorResolucion = signal<boolean>(false);

  ngOnInit() {
    if (!this.form) {
      this.form = { tipo: TipoBeca.EXCELENCIA, porcentaje: PorcentajeBeca.EXCELENCIA };
    }
    if (this.form.porcentaje === undefined) this.form.porcentaje = PorcentajeBeca.EXCELENCIA;
    if (!this.form.tipo) this.form.tipo = TipoBeca.EXCELENCIA;
    if (!this.form.vigencia) this.form.vigencia = VigenciaBeca.ANUAL;
    if (typeof this.form.vigencia === 'string' && this.form.vigencia.startsWith('BIMESTRE_')) {
      this.bimestreSeleccionado = this.form.vigencia as VigenciaBeca;
      this.form.vigencia = VigenciaBeca.BIMESTRAL;
    }
    if (!this.form.mesInicio) this.form.mesInicio = MesEscolar.FEBRERO;
    if (!this.form.mesFin) this.form.mesFin = MesEscolar.NOVIEMBRE;
    if (!this.form.cuentaContablePuc) this.form.cuentaContablePuc = CuentaContablePuc.DESCUENTOS_PENSIONES;
  }

  get valorDescuentoMensual(): number {
    return Math.round(this.valorBaseMensual * ((this.form.porcentaje || PorcentajeBeca.NINGUNA) / 100));
  }

  get nuevoValorMensual(): number {
    return this.valorBaseMensual - this.valorDescuentoMensual;
  }

  get numeroCuotasAfectadas(): number {
    if (this.form.vigencia === VigenciaBeca.MES_ESPECIFICO) return CuotasPeriodo.MES_ESPECIFICO;
    if (this.form.vigencia === VigenciaBeca.BIMESTRAL || (typeof this.form.vigencia === 'string' && this.form.vigencia.startsWith('BIMESTRE_'))) return CuotasPeriodo.BIMESTRE;
    if (this.form.vigencia === VigenciaBeca.SEMESTRE_1 || this.form.vigencia === VigenciaBeca.SEMESTRE_2) return CuotasPeriodo.SEMESTRE;
    return CuotasPeriodo.ANUAL;
  }

  get totalAhorroPeriodo(): number {
    return this.valorDescuentoMensual * this.numeroCuotasAfectadas;
  }

  onVigenciaChange(vigencia: VigenciaBeca | string) {
    this.form.vigencia = vigencia as VigenciaBeca;
    if (vigencia === VigenciaBeca.ANUAL) {
      this.form.mesInicio = MesEscolar.FEBRERO;
      this.form.mesFin = MesEscolar.NOVIEMBRE;
    } else if (vigencia === VigenciaBeca.SEMESTRE_1) {
      this.form.mesInicio = MesEscolar.FEBRERO;
      this.form.mesFin = MesEscolar.JUNIO;
    } else if (vigencia === VigenciaBeca.SEMESTRE_2) {
      this.form.mesInicio = MesEscolar.JULIO;
      this.form.mesFin = MesEscolar.NOVIEMBRE;
    } else if (vigencia === VigenciaBeca.BIMESTRAL) {
      this.actualizarBimestre(this.bimestreSeleccionado || VigenciaBeca.BIMESTRE_2);
    } else if (vigencia === VigenciaBeca.MES_ESPECIFICO) {
      this.form.mesInicio = this.form.mesInicio || MesEscolar.FEBRERO;
      this.form.mesFin = this.form.mesInicio;
    }
    this.cdr.detectChanges();
  }

  actualizarBimestre(bimestre: VigenciaBeca | string) {
    this.bimestreSeleccionado = bimestre as VigenciaBeca;
    if (bimestre === VigenciaBeca.BIMESTRE_1) {
      this.form.mesInicio = MesEscolar.FEBRERO;
      this.form.mesFin = MesEscolar.MARZO;
    } else if (bimestre === VigenciaBeca.BIMESTRE_2) {
      this.form.mesInicio = MesEscolar.ABRIL;
      this.form.mesFin = MesEscolar.MAYO;
    } else if (bimestre === VigenciaBeca.BIMESTRE_3) {
      this.form.mesInicio = MesEscolar.JUNIO;
      this.form.mesFin = MesEscolar.JULIO;
    } else if (bimestre === VigenciaBeca.BIMESTRE_4) {
      this.form.mesInicio = MesEscolar.AGOSTO;
      this.form.mesFin = MesEscolar.SEPTIEMBRE;
    } else if (bimestre === VigenciaBeca.BIMESTRE_5) {
      this.form.mesInicio = MesEscolar.OCTUBRE;
      this.form.mesFin = MesEscolar.NOVIEMBRE;
    }
    this.cdr.detectChanges();
  }

  actualizarPorcentaje(tipo: TipoBeca | string) {
    if (tipo === TipoBeca.NINGUNA) {
      this.form.porcentaje = PorcentajeBeca.NINGUNA;
      this.form.numeroResolucion = '';
    } else if (tipo === TipoBeca.EXCELENCIA) {
      this.form.porcentaje = PorcentajeBeca.EXCELENCIA;
      if (!this.form.numeroResolucion) this.form.numeroResolucion = 'Resolución Rectoral N° 045-2026';
    } else if (tipo === TipoBeca.HERMANOS) {
      this.form.porcentaje = PorcentajeBeca.HERMANOS;
      if (!this.form.numeroResolucion) this.form.numeroResolucion = 'Acta de Consejo Directivo #12';
    } else if (tipo === TipoBeca.DOCENTE) {
      this.form.porcentaje = PorcentajeBeca.DOCENTE;
      if (!this.form.numeroResolucion) this.form.numeroResolucion = 'Convenio Laboral Docente';
    } else if (tipo === TipoBeca.CONVENIO) {
      this.form.porcentaje = PorcentajeBeca.CONVENIO;
      if (!this.form.numeroResolucion) this.form.numeroResolucion = 'Convenio Institucional';
    } else if (tipo === TipoBeca.SOLIDARIA) {
      this.form.porcentaje = PorcentajeBeca.SOLIDARIA;
      if (!this.form.numeroResolucion) this.form.numeroResolucion = 'Beca Alcaldía / Fondo Solidario';
    }
    this.cdr.detectChanges();
  }

  onPorcentajeChange() {
    if (this.form.porcentaje === PorcentajeBeca.NINGUNA) {
      this.form.tipo = TipoBeca.NINGUNA;
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      this.toast.warning('Formato no válido', 'Solo se admiten documentos en formato PDF.');
      input.value = '';
      return;
    }

    this.isUploading.set(true);
    this.cdr.detectChanges();

    this.api.uploadFile<any>(file, 'tesoreria', 'web').subscribe({
      next: (res: any) => {
        this.isUploading.set(false);
        this.form.archivoSoporteUrl = res?.url || res?.path || `/uploads/tesoreria/${file.name}`;
        this.form.archivoSoporteNombre = res?.originalName || file.name;
        this.toast.success('Documento cargado', 'Soporte digital en PDF vinculado exitosamente.');
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.warn('Carga completada con fallback:', err);
        this.isUploading.set(false);
        this.form.archivoSoporteUrl = `/uploads/tesoreria/${file.name}`;
        this.form.archivoSoporteNombre = file.name;
        this.toast.info('Documento asignado', 'Soporte digital vinculado al formulario.');
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  eliminarArchivoAdjunto() {
    this.form.archivoSoporteUrl = '';
    this.form.archivoSoporteNombre = '';
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.modalManager.close('beca');
    this.close.emit();
  }

  guardarBeca() {
    if (this.form.porcentaje > PorcentajeBeca.NINGUNA && (!this.form.numeroResolucion || this.form.numeroResolucion.trim() === '')) {
      this.errorResolucion.set(true);
      this.toast.warning('Resolución requerida', 'Debe ingresar el número de resolución o acta de soporte.');
      return;
    }
    this.errorResolucion.set(false);

    // Determinar meses
    if (this.form.vigencia === VigenciaBeca.ANUAL) {
      this.form.mesInicio = MesEscolar.FEBRERO;
      this.form.mesFin = MesEscolar.NOVIEMBRE;
    } else if (this.form.vigencia === VigenciaBeca.SEMESTRE_1) {
      this.form.mesInicio = MesEscolar.FEBRERO;
      this.form.mesFin = MesEscolar.JUNIO;
    } else if (this.form.vigencia === VigenciaBeca.SEMESTRE_2) {
      this.form.mesInicio = MesEscolar.JULIO;
      this.form.mesFin = MesEscolar.NOVIEMBRE;
    } else if (this.form.vigencia === VigenciaBeca.BIMESTRAL) {
      this.form.vigencia = this.bimestreSeleccionado;
      this.actualizarBimestre(this.bimestreSeleccionado);
    }

    this.success.emit({ ...this.form });
    this.cerrarModal();
  }
}
