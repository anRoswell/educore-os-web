import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadPucComponent } from './tabs/contabilidad-puc.component';
import { ContabilidadComprobantesComponent } from './tabs/contabilidad-comprobantes.component';
import { ContabilidadMapeoComponent } from './tabs/contabilidad-mapeo.component';
import { ContabilidadPeriodosComponent } from './tabs/contabilidad-periodos.component';
import { ContabilidadReportesComponent } from './tabs/contabilidad-reportes.component';
import { ContabilidadDianComponent } from './tabs/contabilidad-dian.component';
import { ContabilidadDiferidosComponent } from './tabs/contabilidad-diferidos.component';
import { ContabilidadNominaComponent } from './tabs/contabilidad-nomina.component';
import { ContabilidadCajaMenorTabComponent } from './tabs/contabilidad-caja-menor.component';
import { ContabilidadCertificadosProveedoresTabComponent } from './tabs/contabilidad-certificados-proveedores.component';
import { ContabilidadPresupuestoTabComponent } from './tabs/contabilidad-presupuesto.component';
import { ContabilidadDeterioroComponent } from './tabs/contabilidad-deterioro.component';
import { ContabilidadConciliacionComponent } from './tabs/contabilidad-conciliacion.component';
import { ContabilidadExogenaComponent } from './tabs/contabilidad-exogena.component';
import { ContabilidadCierreComponent } from './tabs/contabilidad-cierre.component';
import { ContabilidadActivosFijosComponent } from './tabs/contabilidad-activos-fijos.component';
import { ContabilidadDocumentoSoporteComponent } from './tabs/contabilidad-documento-soporte.component';
import { ContabilidadNominaElectronicaComponent } from './tabs/contabilidad-nomina-electronica.component';

export type TabActivo =
  | 'puc'
  | 'comprobantes'
  | 'mapeo'
  | 'periodos'
  | 'reportes'
  | 'dian'
  | 'documento-soporte'
  | 'nomina-electronica'
  | 'diferidos'
  | 'nomina'
  | 'caja-menor'
  | 'certificados-prov'
  | 'presupuesto'
  | 'deterioro'
  | 'conciliacion'
  | 'exogena'
  | 'cierre'
  | 'activos-fijos';

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [
    CommonModule,
    ContabilidadPucComponent,
    ContabilidadComprobantesComponent,
    ContabilidadMapeoComponent,
    ContabilidadPeriodosComponent,
    ContabilidadReportesComponent,
    ContabilidadDianComponent,
    ContabilidadDocumentoSoporteComponent,
    ContabilidadNominaElectronicaComponent,
    ContabilidadDiferidosComponent,
    ContabilidadNominaComponent,
    ContabilidadCajaMenorTabComponent,
    ContabilidadCertificadosProveedoresTabComponent,
    ContabilidadPresupuestoTabComponent,
    ContabilidadDeterioroComponent,
    ContabilidadConciliacionComponent,
    ContabilidadExogenaComponent,
    ContabilidadCierreComponent,
    ContabilidadActivosFijosComponent,
  ],
  template: `
    <div class="page-header" data-testid="contabilidad-page-header">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 data-testid="title-contabilidad">Contabilidad NIIF</h1>
          <span
            class="badge-mini"
            style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);"
          >
            NIIF
          </span>
        </div>
        <p>Motor de partida doble, PUC educativo NIIF para Pymes, reportes financieros y cierre contable.</p>
      </div>
      <div class="header-actions">
        <span class="badge-info text-xs">NIIF para Pymes — Decreto 2420</span>
      </div>
    </div>

    <!-- 5 Tabs Principales -->
    <div class="tabs-nav mb-4" data-testid="contabilidad-tabs-nav">
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'puc'"
        (click)="setTab('puc')"
        data-testid="tab-puc"
      >
        📊 Plan de Cuentas (PUC)
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'comprobantes'"
        (click)="setTab('comprobantes')"
        data-testid="tab-comprobantes"
      >
        📄 Comprobantes
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'mapeo'"
        (click)="setTab('mapeo')"
        data-testid="tab-mapeo"
      >
        🔄 Mapeo de Cuentas
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'periodos'"
        (click)="setTab('periodos')"
        data-testid="tab-periodos"
      >
        📅 Periodos Contables
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'reportes'"
        (click)="setTab('reportes')"
        data-testid="tab-reportes"
      >
        📈 Reportes Financieros
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'dian'"
        (click)="setTab('dian')"
        data-testid="tab-dian"
      >
        🏛️ DIAN & Docs Electrónicos
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'documento-soporte'"
        (click)="setTab('documento-soporte')"
        data-testid="tab-documento-soporte"
      >
        📝 Documento Soporte DSE
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'nomina-electronica'"
        (click)="setTab('nomina-electronica')"
        data-testid="tab-nomina-electronica"
      >
        💼 Nómina Electrónica UBL
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'diferidos'"
        (click)="setTab('diferidos')"
        data-testid="tab-diferidos"
      >
        ⏳ Ingresos Diferidos NIIF 15
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'nomina'"
        (click)="setTab('nomina')"
        data-testid="tab-nomina"
      >
        👥 Nómina Contable NIC 19
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'caja-menor'"
        (click)="setTab('caja-menor')"
        data-testid="tab-caja-menor"
      >
        💼 Caja Menor Escolar
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'certificados-prov'"
        (click)="setTab('certificados-prov')"
        data-testid="tab-certificados-prov"
      >
        📜 Certificados Proveedores
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'presupuesto'"
        (click)="setTab('presupuesto')"
        data-testid="tab-presupuesto"
      >
        📊 Presupuesto Institucional
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'deterioro'"
        (click)="setTab('deterioro')"
        data-testid="tab-deterioro"
      >
        📉 Deterioro Cartera NIIF 9
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'conciliacion'"
        (click)="setTab('conciliacion')"
        data-testid="tab-conciliacion"
      >
        🏦 Conciliación Bancaria
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'exogena'"
        (click)="setTab('exogena')"
        data-testid="tab-exogena"
      >
        🏛️ Exógena DIAN
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'cierre'"
        (click)="setTab('cierre')"
        data-testid="tab-cierre"
      >
        🏛️ Cierre Anual (Periodo 13)
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="tab() === 'activos-fijos'"
        (click)="setTab('activos-fijos')"
        data-testid="tab-activos-fijos"
      >
        🏛️ Activos Fijos & NIC 16/36
      </button>
    </div>

    <div class="tab-panel" data-testid="contabilidad-tab-panel">
      @if (tab() === 'puc') {
        <app-contabilidad-puc />
      }
      @if (tab() === 'comprobantes') {
        <app-contabilidad-comprobantes />
      }
      @if (tab() === 'mapeo') {
        <app-contabilidad-mapeo />
      }
      @if (tab() === 'periodos') {
        <app-contabilidad-periodos />
      }
      @if (tab() === 'reportes') {
        <app-contabilidad-reportes />
      }
      @if (tab() === 'dian') {
        <app-contabilidad-dian />
      }
      @if (tab() === 'documento-soporte') {
        <app-contabilidad-documento-soporte />
      }
      @if (tab() === 'nomina-electronica') {
        <app-contabilidad-nomina-electronica />
      }
      @if (tab() === 'diferidos') {
        <app-contabilidad-diferidos />
      }
      @if (tab() === 'nomina') {
        <app-contabilidad-nomina />
      }
      @if (tab() === 'caja-menor') {
        <app-contabilidad-caja-menor />
      }
      @if (tab() === 'certificados-prov') {
        <app-contabilidad-certificados-proveedores />
      }
      @if (tab() === 'presupuesto') {
        <app-contabilidad-presupuesto />
      }
      @if (tab() === 'deterioro') {
        <app-contabilidad-deterioro />
      }
      @if (tab() === 'conciliacion') {
        <app-contabilidad-conciliacion />
      }
      @if (tab() === 'exogena') {
        <app-contabilidad-exogena />
      }
      @if (tab() === 'cierre') {
        <app-contabilidad-cierre />
      }
      @if (tab() === 'activos-fijos') {
        <app-contabilidad-activos-fijos />
      }
    </div>
  `,
})
export class ContabilidadComponent {
  readonly tab = signal<TabActivo>('puc');

  setTab(t: TabActivo): void {
    this.tab.set(t);
  }
}
