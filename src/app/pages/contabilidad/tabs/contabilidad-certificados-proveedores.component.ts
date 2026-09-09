import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  ProveedorRetencionModel,
  CertificadoProveedorResumenModel,
  Formulario350ResumenModel,
} from '../models/contabilidad.models';
import { ModalDetalleCertificadoProveedorComponent } from '../modals/modal-detalle-certificado-proveedor.component';

export type SubTabCertificados = 'proveedores' | 'formulario350';

@Component({
  selector: 'app-contabilidad-certificados-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleCertificadoProveedorComponent],
  styles: [`
    .cert-prov-header-banner {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      border: 1.5px solid #e2e8f0;
      border-left: 5px solid #4f46e5;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .cert-prov-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .cert-prov-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      border: 1.5px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    .cert-prov-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .cert-prov-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .cert-prov-title-text {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .cert-prov-subtitle-text {
      font-size: 0.775rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }

    .f350-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .f350-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .f350-kpis-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-widget-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .kpi-widget-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
      border-color: #cbd5e1;
    }
    .kpi-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .kpi-widget-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .kpi-widget-value {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: var(--font-mono);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
  `],
  template: `
    <div class="certificados-prov-container space-y-4" data-testid="certificados-prov-tab-container">
      <!-- Encabezado de la Pestaña -->
      <div class="cert-prov-header-banner" data-testid="certificados-prov-header-banner">
        <div class="cert-prov-header-main">
          <div class="cert-prov-icon-wrap">📜</div>
          <div class="cert-prov-texts-wrap">
            <div class="cert-prov-title-row">
              <h3 class="cert-prov-title-text" data-testid="title-certificados-proveedores">
                Certificados Tributarios a Proveedores & Formulario 350 DIAN
              </h3>
              <span class="badge-mini bg-blue-50 text-blue-700 border-blue-200 font-semibold">Art. 381 E.T.</span>
            </div>
            <p class="cert-prov-subtitle-text">
              Emisión oficial de certificados anuales de retención en la fuente (Renta, IVA, ICA) y precálculo de la declaración mensual Formulario 350 DIAN.
            </p>
          </div>
        </div>

        <!-- Sub-tabs Nav (Con indicación visual clara de selección activa) -->
        <div class="subtabs-nav-container inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner" data-testid="certificados-subtabs-nav">
          <button
            type="button"
            class="subtab-button px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
            [ngClass]="subTab() === 'proveedores' ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 font-semibold'"
            (click)="subTab.set('proveedores')"
            data-testid="subtab-proveedores"
          >
            <span>📜</span>
            <span>Certificados Proveedores (Art. 381)</span>
          </button>
          <button
            type="button"
            class="subtab-button px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
            [ngClass]="subTab() === 'formulario350' ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 font-semibold'"
            (click)="subTab.set('formulario350')"
            data-testid="subtab-formulario350"
          >
            <span>🏛️</span>
            <span>Formulario 350 DIAN</span>
          </button>
        </div>
      </div>

      <!-- Alerta de Notificación Toast -->
      @if (alertaToast()) {
        <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between shadow-sm" data-testid="alert-toast-certificados">
          <div class="flex items-center gap-2">
            <span>✅</span>
            <span>{{ alertaToast() }}</span>
          </div>
          <button type="button" class="text-emerald-700 font-bold" (click)="alertaToast.set(null)">✕</button>
        </div>
      }

      <!-- SUBTAB 1: CERTIFICADOS A PROVEEDORES ART. 381 E.T. -->
      @if (subTab() === 'proveedores') {
        <div class="space-y-4" data-testid="panel-subtab-proveedores">
          <!-- Barra de Filtros con Labels Encima de Inputs -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-end justify-between gap-4">
            <div class="flex flex-wrap items-end gap-3 flex-1">
              <!-- Filtro Año Gravable -->
              <div class="form-group-inline mb-0">
                <label class="form-label-sm">Año Gravable</label>
                <select
                  class="input-base input-sm w-year"
                  data-testid="select-anio-cert-prov"
                  [ngModel]="anioSeleccionado()"
                  (ngModelChange)="cambiarAnio($event)"
                >
                  <option [value]="2026">2026</option>
                  <option [value]="2025">2025</option>
                  <option [value]="2024">2024</option>
                </select>
              </div>

              <!-- Buscador de Proveedores -->
              <div class="form-group-inline mb-0 flex-1 max-w-[440px]">
                <label class="form-label-sm">Buscar Proveedor / NIT</label>
                <input
                  type="text"
                  class="input-base input-sm w-full"
                  data-testid="input-buscar-proveedor"
                  [ngModel]="busqueda()"
                  (ngModelChange)="busqueda.set($event)"
                  placeholder="🔍 Filtrar por razón social, nombre o NIT..."
                />
              </div>
            </div>

            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 0.6rem 1.25rem; border-radius: 10px; text-align: right; flex-shrink: 0;">
              <span style="font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; display: block;">Proveedores Retenidos:</span>
              <span style="font-size: 0.95rem; font-weight: 900; color: #312e81;" data-testid="label-total-proveedores-encontrados">
                {{ proveedoresFiltrados().length }} registros
              </span>
            </div>
          </div>

          <!-- Tabla de Proveedores con Retenciones -->
          <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-xs" data-testid="tabla-proveedores-retenciones">
                <thead class="bg-slate-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th class="p-3 text-left">Proveedor / Razón Social</th>
                    <th class="p-3 text-left">NIT / Documento</th>
                    <th class="p-3 text-left">Ciudad</th>
                    <th class="p-3 text-center">Operaciones</th>
                    <th class="p-3 text-right">Base Gravable Acumulada</th>
                    <th class="p-3 text-right">Total Retenido</th>
                    <th class="p-3 text-left">Conceptos</th>
                    <th class="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  @for (p of proveedoresFiltrados(); track p.terceroId) {
                    <tr class="hover:bg-slate-50 transition-colors" [attr.data-testid]="'row-proveedor-' + p.terceroId">
                      <td class="p-3 font-semibold text-gray-800" data-testid="col-proveedor-nombre">
                        {{ p.razonSocial }}
                      </td>
                      <td class="p-3 font-mono text-gray-600" data-testid="col-proveedor-nit">
                        {{ p.tipoDocumento }} {{ p.numeroDocumento }}
                      </td>
                      <td class="p-3 text-gray-500">{{ p.ciudad || 'Colombia' }}</td>
                      <td class="p-3 text-center font-bold text-gray-700">{{ p.cantidadOperaciones }}</td>
                      <td class="p-3 text-right text-gray-600">$ {{ p.totalBaseGravable | number:'1.0-0' }}</td>
                      <td class="p-3 text-right font-extrabold text-indigo-900" data-testid="col-proveedor-total-retenido">
                        $ {{ p.totalRetenido | number:'1.0-0' }}
                      </td>
                      <td class="p-3">
                        <div class="flex flex-wrap gap-1">
                          @for (t of p.tiposRetencion; track t) {
                            <span class="badge-mini bg-slate-100 text-slate-700 text-[10px]">{{ t }}</span>
                          }
                        </div>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            class="btn-secondary text-[11px] py-1 px-2 text-indigo-700 hover:bg-indigo-50"
                            data-testid="btn-ver-detalle-cert"
                            (click)="abrirDetalle(p)"
                            title="Ver desglose contable"
                          >
                            👁️ Ver
                          </button>
                          <button
                            type="button"
                            class="btn-secondary text-[11px] py-1 px-2 text-emerald-700 hover:bg-emerald-50"
                            data-testid="btn-descargar-pdf-tabla"
                            (click)="descargarPdfProveedor(p)"
                            title="Descargar PDF oficial"
                          >
                            📥 PDF
                          </button>
                          <button
                            type="button"
                            class="btn-secondary text-[11px] py-1 px-2 text-blue-700 hover:bg-blue-50"
                            data-testid="btn-email-tabla"
                            (click)="enviarEmailProveedor(p)"
                            title="Despachar email"
                          >
                            ✉️
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="p-8 text-center text-gray-400">
                        No se encontraron retenciones practicadas a proveedores para el año gravable {{ anioSeleccionado() }}.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- SUBTAB 2: BORRADOR FORMULARIO 350 DIAN -->
      @if (subTab() === 'formulario350') {
        <div class="space-y-4" data-testid="panel-subtab-formulario350">
          <!-- Filtros de Periodo Formulario 350 con Labels Encima -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-end justify-between gap-4">
            <div class="flex flex-wrap items-end gap-3 flex-1">
              <!-- Año -->
              <div class="form-group-inline mb-0">
                <label class="form-label-sm">Año Gravable</label>
                <select
                  class="input-base input-sm w-year"
                  data-testid="select-f350-anio"
                  [ngModel]="f350Anio()"
                  (ngModelChange)="cambiarPeriodoF350($event, f350Mes())"
                >
                  <option [value]="2026">2026</option>
                  <option [value]="2025">2025</option>
                </select>
              </div>

              <!-- Mes Declarado -->
              <div class="form-group-inline mb-0">
                <label class="form-label-sm">Mes Declarado</label>
                <select
                  class="input-base input-sm"
                  data-testid="select-f350-mes"
                  [ngModel]="f350Mes()"
                  (ngModelChange)="cambiarPeriodoF350(f350Anio(), $event)"
                >
                  <option [value]="1">01 — Enero</option>
                  <option [value]="2">02 — Febrero</option>
                  <option [value]="3">03 — Marzo</option>
                  <option [value]="4">04 — Abril</option>
                  <option [value]="5">05 — Mayo</option>
                  <option [value]="6">06 — Junio</option>
                  <option [value]="7">07 — Julio</option>
                  <option [value]="8">08 — Agosto</option>
                  <option [value]="9">09 — Septiembre</option>
                  <option [value]="10">10 — Octubre</option>
                  <option [value]="11">11 — Noviembre</option>
                  <option [value]="12">12 — Diciembre</option>
                </select>
              </div>
            </div>

            <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; padding: 0.6rem 1.25rem; border-radius: 10px; text-align: right; flex-shrink: 0;">
              <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; color: #065f46;">
                <span>🏛️</span> Borrador Consolidado DIAN
              </span>
            </div>
          </div>

          @if (f350Data(); as f) {
            <!-- Tarjetas de Totales del Formulario 350 Estilo NIIF 15 -->
            <div class="f350-kpis-grid" data-testid="kpis-formulario350">
              <div class="kpi-widget-card">
                <div class="kpi-widget-header">
                  <span class="kpi-widget-title">Total Base Renta</span>
                  <span class="text-sm">📊</span>
                </div>
                <div class="kpi-widget-value text-slate-800">
                  $ {{ f.totalBasesRenta | number:'1.0-0' }}
                </div>
                <div class="kpi-widget-footer">Renglones 27 al 32</div>
              </div>

              <div class="kpi-widget-card" style="border-color: #fef3c7; background: linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, #ffffff 100%);">
                <div class="kpi-widget-header">
                  <span class="kpi-widget-title" style="color: #b45309;">Retenciones de Renta</span>
                  <span class="text-sm">💼</span>
                </div>
                <div class="kpi-widget-value" style="color: #b45309;">
                  $ {{ f.totalRetencionesRenta | number:'1.0-0' }}
                </div>
                <div class="kpi-widget-footer" style="color: #d97706;">Total Retención Renta</div>
              </div>

              <div class="kpi-widget-card" style="border-color: #f3e8ff; background: linear-gradient(135deg, rgba(243, 232, 255, 0.25) 0%, #ffffff 100%);">
                <div class="kpi-widget-header">
                  <span class="kpi-widget-title" style="color: #6b21a8;">Retenciones de IVA</span>
                  <span class="text-sm">🧾</span>
                </div>
                <div class="kpi-widget-value" style="color: #6b21a8;">
                  $ {{ f.totalRetencionesIva | number:'1.0-0' }}
                </div>
                <div class="kpi-widget-footer" style="color: #7c3aed;">Renglón 67 (ReteIVA 15%)</div>
              </div>

              <div class="kpi-widget-card" style="border-color: #d1fae5; background: linear-gradient(135deg, rgba(209, 250, 229, 0.25) 0%, #ffffff 100%);">
                <div class="kpi-widget-header">
                  <span class="kpi-widget-title" style="color: #047857;">Total a Pagar Form. 350</span>
                  <span class="text-sm">🏛️</span>
                </div>
                <div class="kpi-widget-value" style="color: #047857;" data-testid="label-f350-total-pagar">
                  $ {{ f.totalRetencionesPagar | number:'1.0-0' }}
                </div>
                <div class="kpi-widget-footer" style="color: #059669;" [title]="f.totalRetencionesLetras">
                  {{ f.totalRetencionesLetras }}
                </div>
              </div>
            </div>

            <!-- Tabla de Renglones DIAN -->
            <div class="bg-white border rounded-lg shadow-sm overflow-hidden space-y-4 p-4">
              <!-- Sección Renta -->
              <div>
                <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Retenciones a Título de Renta y Complementarios
                </h3>
                <div class="border rounded overflow-hidden text-xs">
                  <table class="w-full">
                    <thead class="bg-slate-50 text-gray-600 font-semibold border-b">
                      <tr>
                        <th class="p-2.5 text-center w-16">Renglón</th>
                        <th class="p-2.5 text-left">Concepto del Pago o Abono en Cuenta</th>
                        <th class="p-2.5 text-left">Cuentas PUC</th>
                        <th class="p-2.5 text-right">Base Gravable</th>
                        <th class="p-2.5 text-right">Retención Practicada</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y">
                      @for (r of f.renglonesRenta; track r.codigoRenglon) {
                        <tr class="hover:bg-gray-50">
                          <td class="p-2.5 text-center font-mono font-bold text-indigo-900 bg-indigo-50/50">
                            {{ r.codigoRenglon }}
                          </td>
                          <td class="p-2.5 text-gray-800 font-medium">{{ r.concepto }}</td>
                          <td class="p-2.5 font-mono text-gray-500">{{ r.cuentasPuc.join(', ') }}</td>
                          <td class="p-2.5 text-right text-gray-700">$ {{ r.baseGravable | number:'1.0-0' }}</td>
                          <td class="p-2.5 text-right font-bold text-gray-900">$ {{ r.retencion | number:'1.0-0' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Sección IVA -->
              <div>
                <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Retenciones a Título de Impuesto sobre las Ventas (IVA)
                </h3>
                <div class="border rounded overflow-hidden text-xs">
                  <table class="w-full">
                    <thead class="bg-slate-50 text-gray-600 font-semibold border-b">
                      <tr>
                        <th class="p-2.5 text-center w-16">Renglón</th>
                        <th class="p-2.5 text-left">Concepto de la Retención IVA</th>
                        <th class="p-2.5 text-left">Cuentas PUC</th>
                        <th class="p-2.5 text-right">Base Gravable</th>
                        <th class="p-2.5 text-right">Retención Practicada</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y">
                      @for (r of f.renglonesIva; track r.codigoRenglon) {
                        <tr class="hover:bg-gray-50">
                          <td class="p-2.5 text-center font-mono font-bold text-indigo-900 bg-indigo-50/50">
                            {{ r.codigoRenglon }}
                          </td>
                          <td class="p-2.5 text-gray-800 font-medium">{{ r.concepto }}</td>
                          <td class="p-2.5 font-mono text-gray-500">{{ r.cuentasPuc.join(', ') }}</td>
                          <td class="p-2.5 text-right text-gray-700">$ {{ r.baseGravable | number:'1.0-0' }}</td>
                          <td class="p-2.5 text-right font-bold text-gray-900">$ {{ r.retencion | number:'1.0-0' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal Detalle Certificado Proveedor -->
    <app-modal-detalle-certificado-proveedor
      [visible]="mostrarModalDetalle()"
      [certificado]="certificadoSeleccionado()"
      (cerrarModal)="mostrarModalDetalle.set(false)"
    />
  `,
})
export class ContabilidadCertificadosProveedoresTabComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);

  readonly subTab = signal<SubTabCertificados>('proveedores');
  readonly anioSeleccionado = signal(new Date().getFullYear());
  readonly busqueda = signal('');
  readonly alertaToast = signal<string | null>(null);

  readonly proveedores = signal<ProveedorRetencionModel[]>([]);
  readonly cargando = signal(false);

  readonly mostrarModalDetalle = signal(false);
  readonly certificadoSeleccionado = signal<CertificadoProveedorResumenModel | null>(null);

  // Formulario 350
  readonly f350Anio = signal(new Date().getFullYear());
  readonly f350Mes = signal(3); // Marzo default
  readonly f350Data = signal<Formulario350ResumenModel | null>(null);

  readonly proveedoresFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.proveedores();
    return this.proveedores().filter(
      (p) =>
        p.razonSocial.toLowerCase().includes(q) ||
        p.numeroDocumento.toLowerCase().includes(q) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(q)),
    );
  });

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarFormulario350();
  }

  cambiarAnio(val: any): void {
    this.anioSeleccionado.set(Number(val));
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.cargando.set(true);
    this.contabilidadService.getProveedoresRetenciones(this.anioSeleccionado()).subscribe({
      next: (lista) => {
        this.proveedores.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  cambiarPeriodoF350(anio: any, mes: any): void {
    this.f350Anio.set(Number(anio));
    this.f350Mes.set(Number(mes));
    this.cargarFormulario350();
  }

  cargarFormulario350(): void {
    this.contabilidadService.getFormulario350(this.f350Anio(), this.f350Mes()).subscribe({
      next: (res) => {
        this.f350Data.set(res);
      },
      error: () => {},
    });
  }

  abrirDetalle(prov: ProveedorRetencionModel): void {
    this.contabilidadService.getCertificadoProveedor(prov.terceroId, this.anioSeleccionado()).subscribe({
      next: (cert) => {
        this.certificadoSeleccionado.set(cert);
        this.mostrarModalDetalle.set(true);
      },
      error: () => {},
    });
  }

  descargarPdfProveedor(prov: ProveedorRetencionModel): void {
    this.contabilidadService.descargarPdfCertificadoProveedor(prov.terceroId, this.anioSeleccionado()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_Retencion_Art381_${this.anioSeleccionado()}_${prov.numeroDocumento}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {},
    });
  }

  enviarEmailProveedor(prov: ProveedorRetencionModel): void {
    this.contabilidadService.enviarEmailCertificadoProveedor(prov.terceroId, this.anioSeleccionado()).subscribe({
      next: (res) => {
        this.alertaToast.set(`Certificado enviado satisfactoriamente a ${prov.razonSocial} (${prov.email || 'correo registrado'}).`);
        setTimeout(() => this.alertaToast.set(null), 5000);
      },
      error: () => {
        this.alertaToast.set('No se pudo enviar el correo en este momento.');
      },
    });
  }
}
