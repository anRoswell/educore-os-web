import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import { ExogenaValidacionModel, ExogenaExportacionModel } from '../models/contabilidad.models';

@Component({
  selector: 'app-contabilidad-exogena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .exogena-header-banner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .exogena-header-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .exogena-icon-wrap {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .exogena-texts-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .exogena-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }
    .exogena-title-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.25;
    }
    .exogena-subtitle-text {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.3;
    }
    .exogena-kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1024px) {
      .exogena-kpis-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .exogena-kpis-grid {
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
      transform: translateY(-1px);
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
      font-size: 1.35rem;
      font-weight: 800;
      font-family: var(--font-mono, monospace);
      line-height: 1.2;
    }
    .kpi-widget-footer {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.35rem;
    }
    .exogena-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .exogena-card-header {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }
    .table-custom th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .table-custom td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      white-space: nowrap;
    }
    .table-custom tr:hover {
      background: #f8fafc;
    }
  `],
  template: `
    <div class="tab-content" data-testid="tab-content-exogena">
      <!-- Header Banner -->
      <div class="exogena-header-banner" data-testid="exogena-header-banner">
        <div class="exogena-header-main">
          <div class="exogena-icon-wrap">🏛️</div>
          <div class="exogena-texts-wrap">
            <div class="exogena-title-row">
              <h2 class="exogena-title-text" data-testid="exogena-title">
                Información Exógena DIAN (Medios Magnéticos)
              </h2>
              <span class="badge-mini" style="background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2);">
                Resolución DIAN Vigente
              </span>
            </div>
            <p class="exogena-subtitle-text" data-testid="exogena-subtitle">
              Generación de formatos anuales oficiales 1001, 1007, 1008, 1009 y 2276 con auditoría de consistencia fiscal previa y exportación XML.
            </p>
          </div>
        </div>

        <div class="flex items-end gap-3 flex-wrap">
          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Año Gravable</label>
            <select
              class="input-base input-sm w-28 font-semibold"
              data-testid="select-anio-exogena"
              [ngModel]="anio()"
              (ngModelChange)="onAnioChange($event)"
            >
              <option [value]="2026">2026</option>
              <option [value]="2025">2025</option>
              <option [value]="2024">2024</option>
            </select>
          </div>

          <div class="form-group-inline mb-0">
            <label class="form-label-sm">Formato</label>
            <select
              class="input-base input-sm font-semibold"
              data-testid="select-formato-exogena"
              [ngModel]="formato()"
              (ngModelChange)="onFormatoChange($event)"
            >
              <option value="1001">1001 — Pagos y Retenciones</option>
              <option value="1007">1007 — Ingresos Recibidos</option>
              <option value="1008">1008 — Cuentas por Cobrar</option>
              <option value="1009">1009 — Cuentas por Pagar</option>
              <option value="2276">2276 — Rentas de Trabajo</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold"
              data-testid="btn-validar-exogena"
              [disabled]="cargando()"
              (click)="validarConsistencia()"
            >
              <span>🔍</span>
              <span>Pre-Validar Fiscal</span>
            </button>

            <button
              type="button"
              class="btn-primary btn-sm h-[38px] flex items-center gap-1.5 font-semibold shadow-sm"
              data-testid="btn-consultar-exogena"
              [disabled]="cargando()"
              (click)="consultarFormato()"
            >
              <span>📊</span>
              <span>Generar Formato</span>
            </button>
          </div>

          @if (resultado()) {
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 shadow-2xs"
                data-testid="btn-descargar-excel-exogena"
                (click)="descargarExcel()"
              >
                <span>📥</span>
                <span>Descargar Excel</span>
              </button>

              <button
                type="button"
                class="btn-secondary btn-sm h-[38px] flex items-center gap-1.5 font-semibold text-purple-800 bg-purple-50 border-purple-200 hover:bg-purple-100 shadow-2xs"
                data-testid="btn-descargar-xml-exogena"
                (click)="descargarXml()"
              >
                <span>🏛️</span>
                <span>Descargar XML DIAN</span>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Error Banner -->
      @if (errorMensaje()) {
        <div class="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between" data-testid="exogena-error-banner">
          <span>{{ errorMensaje() }}</span>
          <button type="button" class="text-red-500 font-bold ml-2" (click)="errorMensaje.set(null)">✕</button>
        </div>
      }

      <!-- KPIs Grid: Auditoría de Consistencia Fiscal -->
      <div class="exogena-kpis-grid" data-testid="exogena-kpis">
        <!-- KPI 1: Terceros Auditados -->
        <div
          class="kpi-widget-card"
          style="border-color: #e0e7ff; background: linear-gradient(135deg, rgba(224, 231, 255, 0.3) 0%, #ffffff 100%);"
          data-testid="kpi-total-terceros"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" style="color: #4338ca;">Terceros Auditados</span>
            <span class="text-base">👥</span>
          </div>
          <div class="kpi-widget-value" style="color: #4f46e5;">
            {{ validacion()?.totalTercerosAuditados || 0 }}
          </div>
          <div class="kpi-widget-footer" style="color: #6366f1;">Proveedores y contratistas</div>
        </div>

        <!-- KPI 2: Alertas NIT / Dígito Verif. -->
        <div
          class="kpi-widget-card"
          [style.borderColor]="(validacion()?.alertasNits || 0) === 0 ? '#d1fae5' : '#fee2e2'"
          [style.background]="(validacion()?.alertasNits || 0) === 0 ? 'linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(254, 226, 226, 0.35) 0%, #ffffff 100%)'"
          data-testid="kpi-alertas-nit"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="(validacion()?.alertasNits || 0) === 0 ? '#047857' : '#b91c1c'">Alertas NIT / Dígito</span>
            <span class="text-base">{{ (validacion()?.alertasNits || 0) === 0 ? '✅' : '🚨' }}</span>
          </div>
          <div class="kpi-widget-value" [style.color]="(validacion()?.alertasNits || 0) === 0 ? '#059669' : '#dc2626'">
            {{ validacion()?.alertasNits || 0 }}
          </div>
          <div class="kpi-widget-footer" [style.color]="(validacion()?.alertasNits || 0) === 0 ? '#10b981' : '#ef4444'">
            {{ (validacion()?.alertasNits || 0) === 0 ? 'Sin inconsistencias en NIT' : 'Documentos por corregir' }}
          </div>
        </div>

        <!-- KPI 3: Alertas de Dirección -->
        <div
          class="kpi-widget-card"
          [style.borderColor]="(validacion()?.alertasDirecciones || 0) === 0 ? '#d1fae5' : '#fef3c7'"
          [style.background]="(validacion()?.alertasDirecciones || 0) === 0 ? 'linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(254, 243, 199, 0.35) 0%, #ffffff 100%)'"
          data-testid="kpi-alertas-direccion"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="(validacion()?.alertasDirecciones || 0) === 0 ? '#047857' : '#b45309'">Alertas de Dirección</span>
            <span class="text-base">{{ (validacion()?.alertasDirecciones || 0) === 0 ? '✅' : '📍' }}</span>
          </div>
          <div class="kpi-widget-value" [style.color]="(validacion()?.alertasDirecciones || 0) === 0 ? '#059669' : '#d97706'">
            {{ validacion()?.alertasDirecciones || 0 }}
          </div>
          <div class="kpi-widget-footer" [style.color]="(validacion()?.alertasDirecciones || 0) === 0 ? '#10b981' : '#f59e0b'">
            {{ (validacion()?.alertasDirecciones || 0) === 0 ? 'Direcciones completas' : 'Direcciones fiscales requeridas' }}
          </div>
        </div>

        <!-- KPI 4: Alertas Códigos DANE -->
        <div
          class="kpi-widget-card"
          [style.borderColor]="(validacion()?.alertasCodigosDane || 0) === 0 ? '#d1fae5' : '#dbeafe'"
          [style.background]="(validacion()?.alertasCodigosDane || 0) === 0 ? 'linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, #ffffff 100%)' : 'linear-gradient(135deg, rgba(219, 234, 254, 0.35) 0%, #ffffff 100%)'"
          data-testid="kpi-alertas-dane"
        >
          <div class="kpi-widget-header">
            <span class="kpi-widget-title" [style.color]="(validacion()?.alertasCodigosDane || 0) === 0 ? '#047857' : '#1d4ed8'">Alertas Códigos DANE</span>
            <span class="text-base">{{ (validacion()?.alertasCodigosDane || 0) === 0 ? '✅' : '🏙️' }}</span>
          </div>
          <div class="kpi-widget-value" [style.color]="(validacion()?.alertasCodigosDane || 0) === 0 ? '#059669' : '#2563eb'">
            {{ validacion()?.alertasCodigosDane || 0 }}
          </div>
          <div class="kpi-widget-footer" [style.color]="(validacion()?.alertasCodigosDane || 0) === 0 ? '#10b981' : '#3b82f6'">
            {{ (validacion()?.alertasCodigosDane || 0) === 0 ? 'Códigos DANE validados' : 'Municipio / Dpto DIAN' }}
          </div>
        </div>
      </div>

      <!-- Panel de Pre-validación si tiene detalles -->
      @if (validacion() && validacion()!.detalles && validacion()!.detalles!.length > 0) {
        <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs" data-testid="panel-alertas-validacion">
          <div class="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <h4 class="text-xs font-bold text-amber-900 flex items-center gap-1.5 m-0">
              <span>⚠️</span>
              <span>Inconsistencias Fiscales Detectadas en Terceros ({{ validacion()!.detalles!.length }})</span>
            </h4>
            <span class="text-xs text-amber-700 font-medium">Deben corregirse en el Maestro de Terceros antes del envío</span>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            @for (det of validacion()!.detalles!; track det.terceroId) {
              <div class="text-xs text-amber-900 bg-white/85 p-2.5 px-3 rounded-lg border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <span class="leading-relaxed"><strong>{{ det.nombreCompleto }}</strong> (Doc: {{ det.numeroDocumento }}): {{ det.descripcion }}</span>
                <span class="font-semibold uppercase text-2xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">{{ det.tipoAlerta }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tabla de Datos del Formato -->
      <div class="exogena-card" data-testid="card-datos-exogena">
        <div class="exogena-card-header">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-800" data-testid="table-exogena-title">
              Formato {{ formato() }} — Versión {{ resultado()?.version || '10' }}
            </span>
            <span class="text-xs text-slate-500">
              ({{ resultado()?.registros || 0 }} registros fiscales para la vigencia {{ anio() }})
            </span>
          </div>

          @if (resultado()) {
            <div class="flex items-center gap-3 text-xs font-semibold">
              @if (resultado()?.totalPagos !== undefined) {
                <span class="text-slate-700">Total Pagos: <strong class="text-slate-900">$ {{ resultado()!.totalPagos | number:'1.0-0' }}</strong></span>
              }
              @if (resultado()?.totalRetenciones !== undefined) {
                <span class="text-red-700">Total Retenciones: <strong>$ {{ resultado()!.totalRetenciones | number:'1.0-0' }}</strong></span>
              }
            </div>
          }
        </div>

        <div class="overflow-x-auto">
          <table class="table-custom" data-testid="table-exogena-datos">
            <thead>
              <tr>
                <th class="w-10 text-center">#</th>
                @for (col of resultado()?.columnas || []; track col) {
                  <th>{{ col }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of resultado()?.datos || []; track $index; let idx = $index) {
                <tr [attr.data-testid]="'row-exogena-' + idx">
                  <td class="text-center font-semibold text-slate-400">{{ idx + 1 }}</td>
                  @for (col of resultado()?.columnas || []; track col) {
                    <td>{{ row[col] !== undefined ? row[col] : '-' }}</td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="(resultado()?.columnas?.length || 1) + 1" class="text-center py-10 text-slate-400" data-testid="empty-exogena-datos">
                    Haga clic en "Generar Formato" para cargar la previsualización tributaria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ContabilidadExogenaComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly anio = signal<number>(2026);
  readonly formato = signal<string>('1001');
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly validacion = signal<ExogenaValidacionModel | null>(null);
  readonly resultado = signal<ExogenaExportacionModel | null>(null);

  ngOnInit(): void {
    this.validarConsistencia();
    this.consultarFormato();
  }

  onAnioChange(a: number): void {
    this.anio.set(Number(a));
    this.validarConsistencia();
    this.consultarFormato();
  }

  onFormatoChange(f: string): void {
    this.formato.set(f);
    this.consultarFormato();
  }

  validarConsistencia(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.svc.validarExogena(this.anio()).subscribe({
      next: (res) => {
        this.validacion.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al validar exogena:', err);
        this.cargando.set(false);
      },
    });
  }

  consultarFormato(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.svc.getExogenaFormato(this.formato(), this.anio()).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al consultar formato exógena:', err);
        this.errorMensaje.set('No se pudo generar el formato exógena.');
        this.cargando.set(false);
      },
    });
  }

  descargarExcel(): void {
    this.svc.descargarExogenaExcel(this.formato(), this.anio());
  }

  descargarXml(): void {
    this.svc.descargarExogenaXml(this.formato(), this.anio());
  }
}
