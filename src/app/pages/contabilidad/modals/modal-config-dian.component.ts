import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { DianConfigModel, AmbienteDian } from '../models/contabilidad.models';

import { FlatpickrDirective } from '../../../shared/directives/flatpickr.directive';

@Component({
  selector: 'app-modal-config-dian',
  standalone: true,
  imports: [CommonModule, FormsModule, FlatpickrDirective],
  styles: [`
    .modal-dian-wide {
      width: 95% !important;
      max-width: 1140px !important;
      max-height: 94vh !important;
      overflow-y: auto;
      padding: 1.25rem 1.5rem !important;
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .modal-header-dian {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.625rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 0.75rem;
    }
    .modal-dian-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 920px) {
      .modal-dian-grid {
        grid-template-columns: 1fr;
      }
    }
    .modal-dian-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .dian-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.625rem;
      padding: 0.75rem 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }
    .dian-card-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid #e2e8f0;
      margin: 0;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .form-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
    }
    .form-row-nit-dv {
      display: grid;
      grid-template-columns: 1fr 70px;
      gap: 0.5rem;
    }
    .form-row-resolucion {
      display: grid;
      grid-template-columns: 1fr 90px;
      gap: 0.5rem;
    }
    .cert-file-input {
      padding-top: 0.2rem !important;
      font-size: 0.7rem !important;
      height: 2.1rem !important;
    }
    .modal-dian-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }
    .modal-dian-actions-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-config-dian-backdrop" (click)="cancelar()">
        <div class="modal-box modal-dian-wide" data-testid="modal-config-dian" (click)="$event.stopPropagation()">
          <div class="modal-header-dian">
            <div>
              <h3 class="modal-title font-bold text-base text-slate-800" data-testid="modal-config-dian-title">
                ⚙️ Configuración Facturación Electrónica DIAN
              </h3>
              <p class="text-xs text-slate-500">Parámetros UBL 2.1, rangos autorizados y credenciales de firma digital</p>
            </div>
            <button type="button" class="btn-close text-slate-400 hover:text-slate-600 text-lg cursor-pointer" (click)="cancelar()" data-testid="btn-close-config-dian">✕</button>
          </div>

          <div class="modal-body p-0">
            @if (mensajeExito()) {
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded p-2.5 flex items-center gap-2 mb-2" data-testid="alert-success-config-dian">
                <span>✅</span> {{ mensajeExito() }}
              </div>
            }

            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5 mb-2" data-testid="alert-error-config-dian">
                ⚠️ {{ errorMensaje() }}
              </div>
            }

            <div class="modal-dian-grid">
              <!-- ─── COLUMNA IZQUIERDA: IDENTIFICACIÓN Y RESOLUCIÓN ──────── -->
              <div class="modal-dian-col">
                <!-- 1. Identificación y Ambiente -->
                <div class="dian-card">
                  <h4 class="dian-card-title">
                    <span>🏛️</span> 1. Identificación y Ambiente
                  </h4>

                  <div class="form-group">
                    <label class="form-label">Ambiente DIAN *</label>
                    <select class="input-base text-xs" data-testid="select-ambiente-dian" [ngModel]="ambiente()" (ngModelChange)="ambiente.set($event)">
                      <option value="HABILITACION">Habilitación / Pruebas</option>
                      <option value="PRODUCCION">Producción Oficial</option>
                    </select>
                  </div>

                  <div class="form-row-nit-dv">
                    <div class="form-group">
                      <label class="form-label">NIT Emisor *</label>
                      <input type="text" class="input-base text-xs" data-testid="input-nit-emisor" placeholder="900123456" [ngModel]="nitEmisor()" (ngModelChange)="nitEmisor.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">DV *</label>
                      <input type="text" class="input-base text-xs text-center font-bold" data-testid="input-dv-emisor" placeholder="1" [ngModel]="dvEmisor()" (ngModelChange)="dvEmisor.set($event)" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Razón Social Institucional *</label>
                    <input type="text" class="input-base text-xs" data-testid="input-razon-social" placeholder="Colegio Campestre Los Álamos S.A.S." [ngModel]="razonSocial()" (ngModelChange)="razonSocial.set($event)" />
                  </div>
                </div>

                <!-- 2. Resolución DIAN y Rangos de Factura -->
                <div class="dian-card">
                  <h4 class="dian-card-title">
                    <span>📜</span> 2. Resolución DIAN y Rangos de Factura
                  </h4>

                  <div class="form-row-resolucion">
                    <div class="form-group">
                      <label class="form-label">No. Resolución</label>
                      <input type="text" class="input-base text-xs" data-testid="input-resolucion-numero" placeholder="18760000001" [ngModel]="resolucion()" (ngModelChange)="resolucion.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Prefijo *</label>
                      <input type="text" class="input-base text-xs font-semibold uppercase" data-testid="input-prefijo-factura" placeholder="FE" [ngModel]="prefijoFactura()" (ngModelChange)="prefijoFactura.set($event)" />
                    </div>
                  </div>

                  <!-- Desde y Hasta comparten la misma fila (Rangos numéricos) -->
                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Rango Desde *</label>
                      <input type="number" class="input-base text-xs" data-testid="input-rango-desde" [ngModel]="rangoDesde()" (ngModelChange)="rangoDesde.set(+$event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Rango Hasta *</label>
                      <input type="number" class="input-base text-xs" data-testid="input-rango-hasta" [ngModel]="rangoHasta()" (ngModelChange)="rangoHasta.set(+$event)" />
                    </div>
                  </div>

                  <!-- Desde y Hasta comparten la misma fila (Fechas de vigencia) -->
                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Fecha Inicio (Desde)</label>
                      <input type="text" appFlatpickr class="input-base text-xs" data-testid="input-fecha-desde" placeholder="dd/mm/aaaa" [ngModel]="fechaDesde()" (ngModelChange)="fechaDesde.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fecha Fin (Hasta)</label>
                      <input type="text" appFlatpickr [minDate]="fechaDesde()" class="input-base text-xs" data-testid="input-fecha-hasta" placeholder="dd/mm/aaaa" [ngModel]="fechaHasta()" (ngModelChange)="fechaHasta.set($event)" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ─── COLUMNA DERECHA: TÉCNICA, CERTIFICADO Y PREFIJOS ────── -->
              <div class="modal-dian-col">
                <!-- 3. Claves Técnicas y Certificado Digital -->
                <div class="dian-card">
                  <h4 class="dian-card-title">
                    <span>🔐</span> 3. Claves Técnicas y Certificado Digital
                  </h4>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Clave Técnica DIAN</label>
                      <input type="password" class="input-base text-xs" data-testid="input-clave-tecnica" placeholder="••••••••••••••••" [ngModel]="claveTecnica()" (ngModelChange)="claveTecnica.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">PIN del Software</label>
                      <input type="password" class="input-base text-xs" data-testid="input-pin-software" placeholder="12345" [ngModel]="pinSoftware()" (ngModelChange)="pinSoftware.set($event)" />
                    </div>
                  </div>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">ID Software (UUID DIAN)</label>
                      <input type="text" class="input-base text-xs font-mono" data-testid="input-id-software" placeholder="430b3266-..." [ngModel]="idSoftware()" (ngModelChange)="idSoftware.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">TestSetID (Habilitación)</label>
                      <input type="text" class="input-base text-xs font-mono" data-testid="input-test-set-id" placeholder="e1e730dd-..." [ngModel]="testSetId()" (ngModelChange)="testSetId.set($event)" />
                    </div>
                  </div>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Contraseña Certificado</label>
                      <input type="password" class="input-base text-xs" data-testid="input-password-cert" placeholder="Contraseña de exportación" [ngModel]="passwordCert()" (ngModelChange)="passwordCert.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Archivo (.p12/.pfx)</label>
                      <input type="file" class="input-base text-xs cert-file-input" data-testid="file-certificado" (change)="onCertFileSelected($event)" accept=".p12,.pfx" />
                      @if (tieneCertificadoActual()) {
                        <span class="text-[11px] text-emerald-600 font-medium block mt-0.5">✓ Certificado cargado y activo</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- 4. Notas Electrónicas y Documento Soporte -->
                <div class="dian-card">
                  <h4 class="dian-card-title">
                    <span>📑</span> 4. Notas Electrónicas y Doc. Soporte
                  </h4>

                  <div class="form-row-3">
                    <div class="form-group">
                      <label class="form-label">Prefijo Nota Crédito</label>
                      <input type="text" class="input-base text-xs font-semibold uppercase text-center" data-testid="input-prefijo-nc" placeholder="NC" [ngModel]="prefijoNc()" (ngModelChange)="prefijoNc.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Prefijo Nota Débito</label>
                      <input type="text" class="input-base text-xs font-semibold uppercase text-center" data-testid="input-prefijo-nd" placeholder="ND" [ngModel]="prefijoNd()" (ngModelChange)="prefijoNd.set($event)" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Prefijo Doc. Soporte</label>
                      <input type="text" class="input-base text-xs font-semibold uppercase text-center" data-testid="input-prefijo-ds" placeholder="DS" [ngModel]="prefijoDs()" (ngModelChange)="prefijoDs.set($event)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-dian-actions">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              data-testid="btn-probar-conexion-dian"
              [disabled]="probandoConexion()"
              (click)="probarConexion()"
            >
              @if (probandoConexion()) {
                ⏳ Probando Conexión...
              } @else {
                📡 Probar Conexión DIAN
              }
            </button>

            <div class="modal-dian-actions-right">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-testid="btn-cancelar-config-dian"
                (click)="cancelar()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                data-testid="btn-guardar-config-dian"
                [disabled]="guardando()"
                (click)="guardar()"
              >
                @if (guardando()) {
                  Guardando...
                } @else {
                  💾 Guardar Configuración
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalConfigDianComponent {
  private readonly dianService = inject(DianService);

  readonly visible = input<boolean>(false);
  readonly configInicial = input<DianConfigModel | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<DianConfigModel>();

  readonly ambiente = signal<AmbienteDian>('HABILITACION');
  readonly nitEmisor = signal('');
  readonly dvEmisor = signal('');
  readonly razonSocial = signal('');
  readonly resolucion = signal('');
  readonly prefijoFactura = signal('FE');
  readonly rangoDesde = signal(1);
  readonly rangoHasta = signal(999999);
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly claveTecnica = signal('');
  readonly pinSoftware = signal('');
  readonly idSoftware = signal('');
  readonly testSetId = signal('');
  readonly passwordCert = signal('');
  readonly certificadoB64 = signal<string | null>(null);
  readonly tieneCertificadoActual = signal(false);

  readonly prefijoNc = signal('NC');
  readonly prefijoNd = signal('ND');
  readonly prefijoDs = signal('DS');

  readonly guardando = signal(false);
  readonly probandoConexion = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  constructor() {
    effect(() => {
      const cfg = this.configInicial();
      if (cfg) {
        this.ambiente.set(cfg.ambiente || 'HABILITACION');
        this.nitEmisor.set(cfg.nitEmisor || '');
        this.dvEmisor.set(cfg.dvEmisor || '');
        this.razonSocial.set(cfg.razonSocialEmisor || '');
        this.resolucion.set(cfg.resolucionDian || '');
        this.prefijoFactura.set(cfg.prefijoFactura || 'FE');
        this.rangoDesde.set(cfg.rangoDesde || 1);
        this.rangoHasta.set(cfg.rangoHasta || 999999);
        this.fechaDesde.set(cfg.fechaResolucionDesde || '');
        this.fechaHasta.set(cfg.fechaResolucionHasta || '');
        this.claveTecnica.set(cfg.claveTecnica || '');
        this.pinSoftware.set(cfg.pinSoftware || '');
        this.idSoftware.set(cfg.idSoftware || '');
        this.testSetId.set(cfg.testSetId || '');
        this.prefijoNc.set(cfg.prefijoNc || 'NC');
        this.prefijoNd.set(cfg.prefijoNd || 'ND');
        this.prefijoDs.set(cfg.prefijoDs || 'DS');
        this.tieneCertificadoActual.set(!!cfg.certificadoDigitalBase64);
      }
    });
  }

  onCertFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const b64 = resultStr.split(',')[1] || resultStr;
        this.certificadoB64.set(b64);
        this.tieneCertificadoActual.set(true);
      };
      reader.readAsDataURL(file);
    }
  }

  probarConexion(): void {
    this.probandoConexion.set(true);
    this.errorMensaje.set(null);
    this.mensajeExito.set(null);

    this.dianService.testConnection().subscribe({
      next: (res) => {
        this.probandoConexion.set(false);
        if (res.success) {
          this.mensajeExito.set(res.message);
        } else {
          this.errorMensaje.set(res.message);
        }
      },
      error: (err) => {
        this.probandoConexion.set(false);
        this.errorMensaje.set(err.error?.message || err.message || 'Error probando conexión DIAN');
      },
    });
  }

  guardar(): void {
    if (!this.nitEmisor().trim() || !this.dvEmisor().trim() || !this.razonSocial().trim()) {
      this.errorMensaje.set('Debe completar el NIT, DV y la Razón Social Institucional.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const payload: Partial<DianConfigModel> = {
      ambiente: this.ambiente(),
      nitEmisor: this.nitEmisor().trim(),
      dvEmisor: this.dvEmisor().trim(),
      razonSocialEmisor: this.razonSocial().trim(),
      resolucionDian: this.resolucion().trim() || undefined,
      prefijoFactura: this.prefijoFactura().trim(),
      rangoDesde: this.rangoDesde(),
      rangoHasta: this.rangoHasta(),
      fechaResolucionDesde: this.fechaDesde() || undefined,
      fechaResolucionHasta: this.fechaHasta() || undefined,
      claveTecnica: this.claveTecnica() || undefined,
      pinSoftware: this.pinSoftware() || undefined,
      idSoftware: this.idSoftware() || undefined,
      testSetId: this.testSetId() || undefined,
      prefijoNc: this.prefijoNc().trim(),
      prefijoNd: this.prefijoNd().trim(),
      prefijoDs: this.prefijoDs().trim(),
    };

    if (this.passwordCert()) {
      payload.passwordCertificado = this.passwordCert();
    }
    if (this.certificadoB64()) {
      payload.certificadoDigitalBase64 = this.certificadoB64()!;
    }

    this.dianService.saveConfig(payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mensajeExito.set('Configuración guardada correctamente.');
        this.guardado.emit(res.config);
        setTimeout(() => this.cerrar.emit(), 800);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err.error?.message || err.message || 'Error guardando configuración');
      },
    });
  }

  cancelar(): void {
    this.cerrar.emit();
  }
}
