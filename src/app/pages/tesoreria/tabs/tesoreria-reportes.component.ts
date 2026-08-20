import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-tesoreria-reportes',
  standalone: true,
  template: `
    <div class="tab-body animate-fade-in">
      <div class="card-title-bar mb-4">
        <div>
          <h3>📊 Reportes Financieros & Exportación a Software Contable</h3>
          <p>Exportación para Siigo, World Office, Helisa y cumplimiento de Documento Equivalente DIAN</p>
        </div>
        <div class="header-actions">
          <button (click)="exportarExcelSiigo.emit()" class="btn btn-success">
            <span>📥 Exportar a Excel / Siigo</span>
          </button>
        </div>
      </div>

      <div class="grid-cols-3 mt-4">
        <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <h4>🏢 Cartera por Antigüedad</h4>
          <p class="text-xs text-slate-500">Clasificación según días de vencimiento</p>
          <div class="mt-3">
            <div class="flex-between text-sm"><span>Corriente (0-30 días):</span><strong>\$4.2M COP</strong></div>
            <div class="flex-between text-sm mt-2"><span>Vencida (31-60 días):</span><strong>\$8.5M COP</strong></div>
            <div class="flex-between text-sm mt-2 text-danger"><span>Difícil Cobro (>90 días):</span><strong>\$5.75M COP</strong></div>
          </div>
        </div>

        <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <h4>💳 Medios de Recaudo (Agosto)</h4>
          <p class="text-xs text-slate-500">Participación por canal de pago</p>
          <div class="mt-3">
            <div class="flex-between text-sm"><span>PSE Bancolombia / Wompi:</span><strong>68.4%</strong></div>
            <div class="flex-between text-sm mt-2"><span>Nequi / Daviplata QR:</span><strong>18.9%</strong></div>
            <div class="flex-between text-sm mt-2"><span>Efectivo en Ventanilla:</span><strong>12.7%</strong></div>
          </div>
        </div>

        <div class="card" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <h4>📑 Documento Equivalente DIAN</h4>
          <p class="text-xs text-slate-500">Resolución de facturación electrónica</p>
          <div class="mt-3">
            <div class="flex-between text-sm"><span>Rango Autorizado:</span><code>ED-2026-001 al 9999</code></div>
            <div class="flex-between text-sm mt-2"><span>Emitidos este mes:</span><strong>850 facturas</strong></div>
            <div class="flex-between text-sm mt-2 text-success"><span>Sincronización DIAN:</span><strong>✓ Al Día</strong></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TesoreriaReportesComponent {
  @Output() exportarExcelSiigo = new EventEmitter<void>();
}
