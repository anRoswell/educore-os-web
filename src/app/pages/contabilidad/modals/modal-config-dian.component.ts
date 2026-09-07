import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DianService } from '../services/dian.service';
import { DianConfigModel, AmbienteDian } from '../models/contabilidad.models';

@Component({
  selector: 'app-modal-config-dian',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="modal-backdrop" data-testid="modal-config-dian-backdrop" (click)="cancelar()">
        <div class="modal-box w-[760px] max-w-[95vw] max-h-[90vh] overflow-y-auto" data-testid="modal-config-dian" (click)="$event.stopPropagation()">
          <div class="modal-header flex items-center justify-between pb-3 border-b">
            <div>
              <h3 class="modal-title font-bold text-lg text-slate-800" data-testid="modal-config-dian-title">
                ⚙️ Configuración Facturación Electrónica DIAN
              </h3>
              <p class="text-xs text-slate-500">Parámetros UBL 2.1, rangos autorizados y credenciales de firma digital</p>
            </div>
            <button type="button" class="btn-close text-slate-400 hover:text-slate-600" (click)="cancelar()" data-testid="btn-close-config-dian">✕</button>
          </div>

          <div class="modal-body space-y-4 pt-3">
            @if (mensajeExito()) {
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded p-2.5 flex items-center gap-2" data-testid="alert-success-config-dian">
                <span>✅</span> {{ mensajeExito() }}
              </div>
            }

            @if (errorMensaje()) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5" data-testid="alert-error-config-dian">
                ⚠️ {{ errorMensaje() }}
              </div>
            }

            <!-- Ambiente y Datos de la Institución -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">1. Identificación y Ambiente</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Ambiente DIAN *</label>
                  <select class="input-base text-xs" data-testid="select-ambiente-dian" [ngModel]="ambiente()" (ngModelChange)="ambiente.set($event)">
                    <option value="HABILITACION">Habilitación / Pruebas</option>
                    <option value="PRODUCCION">Producción Oficial</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">NIT Emisor *</label>
                  <input type="text" class="input-base text-xs" data-testid="input-nit-emisor" placeholder="900123456" [ngModel]="nitEmisor()" (ngModelChange)="nitEmisor.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Dígito Verificación (DV) *</label>
                  <input type="text" class="input-base text-xs" data-testid="input-dv-emisor" placeholder="1" [ngModel]="dvEmisor()" (ngModelChange)="dvEmisor.set($event)" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label text-xs font-semibold">Razón Social Institucional *</label>
                <input type="text" class="input-base text-xs" data-testid="input-razon-social" placeholder="Colegio Campestre Los Álamos S.A.S." [ngModel]="razonSocial()" (ngModelChange)="razonSocial.set($event)" />
              </div>
            </div>

            <!-- Resolución y Numeración -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">2. Resolución DIAN y Rangos de Factura</h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">No. Resolución</label>
                  <input type="text" class="input-base text-xs" data-testid="input-resolucion-numero" placeholder="18760000001" [ngModel]="resolucion()" (ngModelChange)="resolucion.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Prefijo Factura *</label>
                  <input type="text" class="input-base text-xs" data-testid="input-prefijo-factura" placeholder="FE" [ngModel]="prefijoFactura()" (ngModelChange)="prefijoFactura.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Rango Desde *</label>
                  <input type="number" class="input-base text-xs" data-testid="input-rango-desde" [ngModel]="rangoDesde()" (ngModelChange)="rangoDesde.set(+$event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Rango Hasta *</label>
                  <input type="number" class="input-base text-xs" data-testid="input-rango-hasta" [ngModel]="rangoHasta()" (ngModelChange)="rangoHasta.set(+$event)" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Fecha Inicio Vigencia</label>
                  <input type="date" class="input-base text-xs" data-testid="input-fecha-desde" [ngModel]="fechaDesde()" (ngModelChange)="fechaDesde.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Fecha Fin Vigencia</label>
                  <input type="date" class="input-base text-xs" data-testid="input-fecha-hasta" [ngModel]="fechaHasta()" (ngModelChange)="fechaHasta.set($event)" />
                </div>
              </div>
            </div>

            <!-- Parámetros Técnicos y Certificado -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">3. Claves Técnicas y Certificado Digital</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Clave Técnica DIAN</label>
                  <input type="password" class="input-base text-xs" data-testid="input-clave-tecnica" placeholder="••••••••••••••••" [ngModel]="claveTecnica()" (ngModelChange)="claveTecnica.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">PIN del Software</label>
                  <input type="password" class="input-base text-xs" data-testid="input-pin-software" placeholder="12345" [ngModel]="pinSoftware()" (ngModelChange)="pinSoftware.set($event)" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">ID Software (UUID DIAN)</label>
                  <input type="text" class="input-base text-xs" data-testid="input-id-software" placeholder="430b3266-..." [ngModel]="idSoftware()" (ngModelChange)="idSoftware.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">TestSetID (Ambiente Habilitación)</label>
                  <input type="text" class="input-base text-xs" data-testid="input-test-set-id" placeholder="e1e730dd-..." [ngModel]="testSetId()" (ngModelChange)="testSetId.set($event)" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Contraseña del Certificado (.p12/.pfx)</label>
                  <input type="password" class="input-base text-xs" data-testid="input-password-cert" placeholder="Contraseña de exportación privada" [ngModel]="passwordCert()" (ngModelChange)="passwordCert.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Cargar Archivo de Certificado (.p12/.pfx)</label>
                  <input type="file" class="input-base text-xs" data-testid="file-certificado" (change)="onCertFileSelected($event)" accept=".p12,.pfx" />
                  @if (tieneCertificadoActual()) {
                    <span class="text-xs text-emerald-600 block mt-1 font-medium">✓ Certificado digital cargado y activo</span>
                  }
                </div>
              </div>
            </div>

            <!-- Prefijos Notas y Documento Soporte -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">4. Notas Electrónicas y Documento Soporte</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Prefijo Nota Crédito</label>
                  <input type="text" class="input-base text-xs" data-testid="input-prefijo-nc" placeholder="NC" [ngModel]="prefijoNc()" (ngModelChange)="prefijoNc.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Prefijo Nota Débito</label>
                  <input type="text" class="input-base text-xs" data-testid="input-prefijo-nd" placeholder="ND" [ngModel]="prefijoNd()" (ngModelChange)="prefijoNd.set($event)" />
                </div>
                <div class="form-group">
                  <label class="form-label text-xs font-semibold">Prefijo Doc. Soporte</label>
                  <input type="text" class="input-base text-xs" data-testid="input-prefijo-ds" placeholder="DS" [ngModel]="prefijoDs()" (ngModelChange)="prefijoDs.set($event)" />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions flex items-center justify-between pt-4 border-t mt-4">
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

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary"
                data-testid="btn-cancelar-config-dian"
                (click)="cancelar()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary"
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
