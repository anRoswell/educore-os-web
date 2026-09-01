import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tesoreria-reportes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in">
      <div class="card-title-bar mb-4">
        <div>
          <h3>📊 Reportes Financieros & Exportación a Software Contable</h3>
          <p>Exportación para Siigo, World Office, Helisa y cumplimiento de Documento Equivalente DIAN</p>
        </div>
        <div class="header-actions">
          <button (click)="exportarExcelSiigo.emit()" class="btn btn-success" style="box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
            <span>📥 Exportar a Excel / Siigo</span>
          </button>
        </div>
      </div>

      <div class="report-cards-grid grid-cols-3 mt-4">
        <!-- 1. Cartera por Antigüedad -->
        <div class="report-card report-cartera card">
          <div class="report-card-header">
            <div class="icon-indicator-box amber">
              <span>🏢</span>
            </div>
            <div>
              <h4>Cartera por Antigüedad</h4>
              <p class="text-xs text-slate-500">Clasificación según días de vencimiento</p>
            </div>
          </div>
          <div class="report-card-body mt-3">
            <div class="metric-row">
              <span class="metric-label">Corriente (0-30 días):</span>
              <strong class="metric-val text-slate-700">\$4.2M COP</strong>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Vencida (31-60 días):</span>
              <strong class="metric-val text-warning">\$8.5M COP</strong>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Difícil Cobro (>90 días):</span>
              <strong class="metric-val text-danger font-bold">\$5.75M COP</strong>
            </div>
          </div>
          <div class="report-card-footer mt-3">
            <span class="badge badge-warning">⚠️ 12 Estudiantes en Seguimiento</span>
          </div>
        </div>

        <!-- 2. Medios de Recaudo -->
        <div class="report-card report-recaudos card">
          <div class="report-card-header">
            <div class="icon-indicator-box blue">
              <span>💳</span>
            </div>
            <div>
              <h4>Medios de Recaudo (Agosto)</h4>
              <p class="text-xs text-slate-500">Participación por canal de pago</p>
            </div>
          </div>
          <div class="report-card-body mt-3">
            <div class="metric-row">
              <span class="metric-label">PSE / Wompi Bancolombia:</span>
              <strong class="metric-val text-primary font-bold">68.4%</strong>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Nequi / Daviplata QR:</span>
              <strong class="metric-val text-slate-700">18.9%</strong>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Efectivo en Ventanilla:</span>
              <strong class="metric-val text-slate-700">12.7%</strong>
            </div>
          </div>
          <div class="report-card-footer mt-3">
            <span class="badge badge-primary">⚡ 87.3% Recaudo Digital</span>
          </div>
        </div>

        <!-- 3. Documento Equivalente DIAN -->
        <div class="report-card report-dian card">
          <div class="report-card-header">
            <div class="icon-indicator-box green">
              <span>📑</span>
            </div>
            <div>
              <h4>Documento Equivalente DIAN</h4>
              <p class="text-xs text-slate-500">Resolución de facturación electrónica</p>
            </div>
          </div>
          <div class="report-card-body mt-3">
            <div class="metric-row">
              <span class="metric-label">Rango Autorizado:</span>
              <code class="metric-code">ED-2026-001 al 9999</code>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Emitidos este mes:</span>
              <strong class="metric-val text-slate-700">850 facturas</strong>
            </div>
            <div class="metric-row mt-2">
              <span class="metric-label">Sincronización DIAN:</span>
              <strong class="metric-val text-success">✓ Transmitido & Al Día</strong>
            </div>
          </div>
          <div class="report-card-footer mt-3">
            <span class="badge badge-success">✓ Resolución Vigente 2026</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .report-card {
      position: relative;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem 1.35rem;
      box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
      transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .report-card-header {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }
      }

      .icon-indicator-box {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
        transition: transform 0.25s ease;

        &.amber {
          background-color: #fef3c7;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        &.blue {
          background-color: #e0e7ff;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        &.green {
          background-color: #d1fae5;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
      }

      .metric-label {
        color: #64748b;
      }

      .metric-code {
        background: #f1f5f9;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-family: monospace;
        color: #334155;
      }

      .report-card-footer {
        padding-top: 0.75rem;
        border-top: 1px solid rgba(226, 232, 240, 0.7);
        display: flex;
        align-items: center;
      }

      &:hover {
        transform: translateY(-5px);

        .icon-indicator-box {
          transform: scale(1.1);
        }
      }

      // 1. Cartera por Antigüedad
      &.report-cartera {
        border-left: 4.5px solid #f59e0b;
        background: linear-gradient(145deg, #ffffff 0%, rgba(254, 252, 232, 0.45) 100%);

        &:hover {
          border-left-color: #d97706;
          box-shadow: 0 16px 28px -4px rgba(245, 158, 11, 0.22), 0 8px 14px -2px rgba(245, 158, 11, 0.12);
        }
      }

      // 2. Medios de Recaudo
      &.report-recaudos {
        border-left: 4.5px solid #3b82f6;
        background: linear-gradient(145deg, #ffffff 0%, rgba(239, 246, 255, 0.45) 100%);

        &:hover {
          border-left-color: #2563eb;
          box-shadow: 0 16px 28px -4px rgba(59, 130, 246, 0.22), 0 8px 14px -2px rgba(59, 130, 246, 0.12);
        }
      }

      // 3. Documento Equivalente DIAN
      &.report-dian {
        border-left: 4.5px solid #10b981;
        background: linear-gradient(145deg, #ffffff 0%, rgba(240, 253, 244, 0.45) 100%);

        &:hover {
          border-left-color: #059669;
          box-shadow: 0 16px 28px -4px rgba(16, 185, 129, 0.22), 0 8px 14px -2px rgba(16, 185, 129, 0.12);
        }
      }
    }
  `]
})
export class TesoreriaReportesComponent {
  @Output() exportarExcelSiigo = new EventEmitter<void>();
}
