import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContabilidadService } from '../services/contabilidad.service';
import {
  BalanceGeneral,
  EstadoResultados,
  LibroDiarioItem,
  LibroMayorCuenta,
  AuxiliarTerceroReporte,
  Tercero,
} from '../models/contabilidad.models';

type ReporteActivo = 'balance' | 'pyg' | 'diario' | 'mayor' | 'auxiliar';

@Component({
  selector: 'app-contabilidad-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-content" data-testid="tab-content-reportes">
      <!-- Selector de reporte -->
      <div class="tabs-nav mb-5 flex-wrap" data-testid="nav-reportes">
        @for (r of reportes; track r.key) {
          <button
            type="button"
            class="tab-btn"
            [class.active]="reporteActivo() === r.key"
            [attr.data-testid]="'btn-subreporte-' + r.key"
            (click)="seleccionarReporte(r.key)"
          >
            {{ r.icono }} {{ r.label }}
          </button>
        }
      </div>

      <!-- ─── 1. BALANCE GENERAL ─────────────────────────────────────────── -->
      @if (reporteActivo() === 'balance') {
        <div data-testid="seccion-balance-general">
          <div class="flex gap-3 mb-4 items-end flex-wrap">
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Fecha de Corte *</label>
              <input
                class="input-base text-xs"
                data-testid="input-balance-fecha-corte"
                type="date"
                [(ngModel)]="balanceFechaCorte"
              />
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              data-testid="btn-generar-balance"
              (click)="generarBalance()"
              [disabled]="cargando()"
            >
              {{ cargando() ? 'Generando...' : '📊 Generar' }}
            </button>
            @if (balance()) {
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-excel-balance"
                (click)="exportarExcel('balance-general')"
              >
                ⬇ Exportar Excel
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-pdf-balance"
                (click)="exportarPdf('balance-general')"
              >
                🖨 Exportar PDF
              </button>
            }
          </div>

          @if (cargando()) {
            <div class="flex justify-center py-8"><div class="spinner"></div></div>
          } @else if (balance()) {
            <!-- KPIs Balance General -->
            <div class="grid grid-cols-4 gap-3 mb-4" data-testid="kpis-balance">
              <div class="stat-card border-blue-500">
                <span class="stat-label">Total Activos</span>
                <span class="stat-value text-blue-700">{{ balance()!.totalActivos | number:'1.2-2' }}</span>
              </div>
              <div class="stat-card border-red-500">
                <span class="stat-label">Total Pasivos</span>
                <span class="stat-value text-red-600">{{ balance()!.totalPasivos | number:'1.2-2' }}</span>
              </div>
              <div class="stat-card border-purple-500">
                <span class="stat-label">Total Patrimonio</span>
                <span class="stat-value text-purple-700">{{ balance()!.totalPatrimonio | number:'1.2-2' }}</span>
              </div>
              <div
                class="stat-card"
                [class.border-green-500]="balance()!.cuadra"
                [class.border-red-500]="!balance()!.cuadra"
              >
                <span class="stat-label">Ecuación Patrimonial</span>
                <span
                  class="stat-value text-sm"
                  [class.text-green-600]="balance()!.cuadra"
                  [class.text-red-600]="!balance()!.cuadra"
                >
                  {{ balance()!.cuadra ? '✓ CUADRA' : '✗ DESCUADRADO' }}
                </span>
              </div>
            </div>

            <!-- Tablas ACTIVOS / PASIVOS+PATRIMONIO lado a lado -->
            <div class="grid grid-cols-2 gap-4 overflow-auto max-h-[480px]">
              <div class="border rounded p-3 bg-white">
                <h4 class="font-bold mb-2 text-blue-800 text-sm">ACTIVOS (Clase 1)</h4>
                <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.activos, total: balance()!.totalActivos }"></ng-container>
              </div>
              <div class="border rounded p-3 bg-white space-y-4">
                <div>
                  <h4 class="font-bold mb-2 text-red-800 text-sm">PASIVOS (Clase 2)</h4>
                  <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.pasivos, total: balance()!.totalPasivos }"></ng-container>
                </div>
                <div>
                  <h4 class="font-bold mb-2 text-purple-800 text-sm">PATRIMONIO (Clase 3)</h4>
                  <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: balance()!.patrimonio, total: balance()!.totalPatrimonio }"></ng-container>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ─── 2. ESTADO DE RESULTADOS (PyG) ──────────────────────────────── -->
      @if (reporteActivo() === 'pyg') {
        <div data-testid="seccion-pyg">
          <div class="flex gap-3 mb-4 items-end flex-wrap">
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Desde *</label>
              <input
                class="input-base text-xs"
                data-testid="input-pyg-desde"
                type="date"
                [(ngModel)]="pygDesde"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Hasta *</label>
              <input
                class="input-base text-xs"
                data-testid="input-pyg-hasta"
                type="date"
                [(ngModel)]="pygHasta"
              />
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              data-testid="btn-generar-pyg"
              (click)="generarPyg()"
              [disabled]="cargando()"
            >
              {{ cargando() ? 'Generando...' : '📊 Generar' }}
            </button>
            @if (pyg()) {
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-excel-pyg"
                (click)="exportarExcel('estado-resultados')"
              >
                ⬇ Exportar Excel
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-pdf-pyg"
                (click)="exportarPdf('estado-resultados')"
              >
                🖨 Exportar PDF
              </button>
            }
          </div>

          @if (cargando()) {
            <div class="flex justify-center py-8"><div class="spinner"></div></div>
          } @else if (pyg()) {
            <div class="grid grid-cols-3 gap-3 mb-4" data-testid="kpis-pyg">
              <div class="stat-card border-green-500">
                <span class="stat-label">Total Ingresos</span>
                <span class="stat-value text-green-600">{{ pyg()!.totalIngresos | number:'1.2-2' }}</span>
              </div>
              <div class="stat-card border-red-500">
                <span class="stat-label">Total Gastos y Costos</span>
                <span class="stat-value text-red-600">{{ pyg()!.totalGastos | number:'1.2-2' }}</span>
              </div>
              <div
                class="stat-card"
                [class.border-green-500]="pyg()!.excedente >= 0"
                [class.border-red-500]="pyg()!.excedente < 0"
              >
                <span class="stat-label">{{ pyg()!.excedente >= 0 ? 'Excedente del Ejercicio' : 'Déficit del Ejercicio' }}</span>
                <span
                  class="stat-value"
                  [class.text-green-600]="pyg()!.excedente >= 0"
                  [class.text-red-600]="pyg()!.excedente < 0"
                >
                  {{ pyg()!.excedente | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 overflow-auto max-h-[480px]">
              <div class="border rounded p-3 bg-white">
                <h4 class="font-bold mb-2 text-green-800 text-sm">INGRESOS EDUCATIVOS (Clase 4)</h4>
                <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: pyg()!.ingresos, total: pyg()!.totalIngresos }"></ng-container>
              </div>
              <div class="border rounded p-3 bg-white">
                <h4 class="font-bold mb-2 text-red-800 text-sm">GASTOS Y COSTOS OPERACIONALES</h4>
                <ng-container *ngTemplateOutlet="tablaBalance; context: { $implicit: pyg()!.gastos, total: pyg()!.totalGastos }"></ng-container>
              </div>
            </div>
          }
        </div>
      }

      <!-- ─── 3. LIBRO DIARIO ────────────────────────────────────────────── -->
      @if (reporteActivo() === 'diario') {
        <div data-testid="seccion-libro-diario">
          <div class="flex gap-3 mb-4 items-end flex-wrap">
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Desde *</label>
              <input
                class="input-base text-xs"
                data-testid="input-diario-desde"
                type="date"
                [(ngModel)]="desdeFiltro"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Hasta *</label>
              <input
                class="input-base text-xs"
                data-testid="input-diario-hasta"
                type="date"
                [(ngModel)]="hastaFiltro"
              />
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              data-testid="btn-generar-diario"
              (click)="generarDiario()"
              [disabled]="cargando()"
            >
              {{ cargando() ? 'Cargando...' : '📋 Consultar' }}
            </button>
            @if (libroDiario().length > 0) {
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-excel-diario"
                (click)="exportarExcel('libro-diario')"
              >
                ⬇ Exportar Excel
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-pdf-diario"
                (click)="exportarPdf('libro-diario')"
              >
                🖨 Exportar PDF
              </button>
            }
          </div>

          <div class="tabla-base overflow-auto max-h-[500px]" data-testid="tabla-diario-container">
            <table class="tabla-datos w-full text-xs" data-testid="tabla-diario">
              <thead>
                <tr>
                  <th class="w-24">Fecha</th>
                  <th class="w-16">Tipo</th>
                  <th class="w-20">Consec.</th>
                  <th class="w-36">Concepto</th>
                  <th class="w-24">Cuenta</th>
                  <th>Nombre Cuenta</th>
                  <th>Tercero</th>
                  <th class="w-28 text-right">Débito</th>
                  <th class="w-28 text-right">Crédito</th>
                </tr>
              </thead>
              <tbody>
                @for (row of libroDiario(); track $index) {
                  <tr class="border-b hover:bg-gray-50/50">
                    <td class="font-mono">{{ row.fecha }}</td>
                    <td><span class="badge-gray font-mono">{{ row.tipo }}</span></td>
                    <td class="font-mono">{{ row.consecutivo }}</td>
                    <td class="truncate max-w-[150px]" [title]="row.concepto">{{ row.concepto }}</td>
                    <td class="font-mono">{{ row.codigoCuenta }}</td>
                    <td>{{ row.nombreCuenta }}</td>
                    <td class="truncate max-w-[130px]" [title]="row.terceroNombre || ''">{{ row.terceroNombre || '—' }}</td>
                    <td class="text-right font-mono">{{ row.debito | number:'1.2-2' }}</td>
                    <td class="text-right font-mono">{{ row.credito | number:'1.2-2' }}</td>
                  </tr>
                }
                @if (libroDiario().length === 0 && !cargando()) {
                  <tr class="empty-row">
                    <td colspan="9" class="text-center py-6 text-gray-400">
                      Sin registros en el periodo seleccionado.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="flex justify-end gap-6 mt-2 text-xs font-semibold font-mono" data-testid="totales-diario">
            <span>Total Débitos: <strong>{{ totalDiarioDB() | number:'1.2-2' }}</strong></span>
            <span>Total Créditos: <strong>{{ totalDiarioCR() | number:'1.2-2' }}</strong></span>
          </div>
        </div>
      }

      <!-- ─── 4. LIBRO MAYOR Y BALANCES ──────────────────────────────────── -->
      @if (reporteActivo() === 'mayor') {
        <div data-testid="seccion-libro-mayor">
          <div class="flex gap-3 mb-4 items-end flex-wrap">
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Desde *</label>
              <input
                class="input-base text-xs"
                data-testid="input-mayor-desde"
                type="date"
                [(ngModel)]="desdeFiltro"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Hasta *</label>
              <input
                class="input-base text-xs"
                data-testid="input-mayor-hasta"
                type="date"
                [(ngModel)]="hastaFiltro"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Prefijo Cuenta</label>
              <input
                class="input-base w-32 text-xs font-mono"
                data-testid="input-mayor-cuenta"
                [(ngModel)]="mayorCuenta"
                placeholder="ej: 130"
              />
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              data-testid="btn-generar-mayor"
              (click)="generarMayor()"
              [disabled]="cargando()"
            >
              {{ cargando() ? 'Cargando...' : '📒 Consultar' }}
            </button>
            @if (libroMayor().length > 0) {
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-excel-mayor"
                (click)="exportarExcel('libro-mayor')"
              >
                ⬇ Exportar Excel
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-pdf-mayor"
                (click)="exportarPdf('libro-mayor')"
              >
                🖨 Exportar PDF
              </button>
            }
          </div>

          @for (cuenta of libroMayor(); track cuenta.codigoCuenta) {
            <div class="mb-4 border rounded-lg overflow-hidden bg-white shadow-sm" [attr.data-testid]="'card-mayor-' + cuenta.codigoCuenta">
              <div class="bg-gray-50 px-4 py-2 flex items-center justify-between border-b text-xs">
                <div>
                  <span class="font-mono font-bold text-gray-900">{{ cuenta.codigoCuenta }}</span>
                  <span class="ml-2 font-medium text-gray-800">{{ cuenta.nombreCuenta }}</span>
                  <span class="ml-3 text-gray-500 font-mono">Saldo inicial: {{ cuenta.saldoInicial | number:'1.2-2' }}</span>
                </div>
                <div
                  class="font-semibold font-mono"
                  [class.text-green-600]="cuenta.saldoFinal >= 0"
                  [class.text-red-500]="cuenta.saldoFinal < 0"
                >
                  Saldo Final: {{ cuenta.saldoFinal | number:'1.2-2' }}
                </div>
              </div>
              <div class="overflow-auto max-h-48">
                <table class="tabla-datos w-full text-xs">
                  <thead>
                    <tr>
                      <th class="w-24">Fecha</th>
                      <th class="w-16">Tipo</th>
                      <th>Concepto</th>
                      <th class="w-28 text-right">Débito</th>
                      <th class="w-28 text-right">Crédito</th>
                      <th class="w-28 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of cuenta.movimientos; track $index) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="font-mono">{{ m.fecha }}</td>
                        <td class="font-mono">{{ m.tipo }}</td>
                        <td class="truncate max-w-[200px]" [title]="m.concepto">{{ m.concepto }}</td>
                        <td class="text-right font-mono">{{ m.debito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono">{{ m.credito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono font-semibold">{{ m.saldoAcumulado | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="font-bold bg-gray-50">
                      <td colspan="3" class="text-right py-2 px-3">TOTALES:</td>
                      <td class="text-right font-mono py-2 px-3">{{ cuenta.totalDebitos | number:'1.2-2' }}</td>
                      <td class="text-right font-mono py-2 px-3">{{ cuenta.totalCreditos | number:'1.2-2' }}</td>
                      <td class="text-right font-mono py-2 px-3">{{ cuenta.saldoFinal | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          }
          @if (libroMayor().length === 0 && !cargando()) {
            <div class="text-center py-10 text-gray-400">Consulte un periodo para ver el Mayor.</div>
          }
        </div>
      }

      <!-- ─── 5. AUXILIAR POR TERCERO ────────────────────────────────────── -->
      @if (reporteActivo() === 'auxiliar') {
        <div data-testid="seccion-auxiliar-tercero">
          <div class="flex gap-3 mb-4 items-end flex-wrap">
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Desde *</label>
              <input
                class="input-base text-xs"
                data-testid="input-auxiliar-desde"
                type="date"
                [(ngModel)]="desdeFiltro"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Hasta *</label>
              <input
                class="input-base text-xs"
                data-testid="input-auxiliar-hasta"
                type="date"
                [(ngModel)]="hastaFiltro"
              />
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Tercero (Opcional)</label>
              <select
                class="input-base text-xs"
                data-testid="select-auxiliar-tercero"
                [(ngModel)]="terceroFiltroId"
              >
                <option value="">Todos los terceros</option>
                @for (t of terceros(); track t.id) {
                  <option [value]="t.id">{{ t.numeroIdentificacion }} — {{ t.nombreCompleto || t.razonSocial }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label text-xs font-semibold">Cuenta PUC (Opcional)</label>
              <input
                class="input-base w-32 text-xs font-mono"
                data-testid="input-auxiliar-cuenta"
                [(ngModel)]="auxiliarCuentaCodigo"
                placeholder="ej: 130505"
              />
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              data-testid="btn-generar-auxiliar"
              (click)="generarAuxiliar()"
              [disabled]="cargando()"
            >
              {{ cargando() ? 'Cargando...' : '👤 Consultar' }}
            </button>
            @if (auxiliarTercero()) {
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-excel-auxiliar"
                (click)="exportarExcel('auxiliar-tercero')"
              >
                ⬇ Exportar Excel
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                data-testid="btn-exportar-pdf-auxiliar"
                (click)="exportarPdf('auxiliar-tercero')"
              >
                🖨 Exportar PDF
              </button>
            }
          </div>

          @if (cargando()) {
            <div class="flex justify-center py-8"><div class="spinner"></div></div>
          } @else if (auxiliarTercero()) {
            <div class="border rounded-lg bg-white overflow-hidden shadow-sm" data-testid="card-auxiliar-resultado">
              <div class="bg-gray-50 px-4 py-3 border-b flex justify-between items-center text-xs">
                <div>
                  <strong class="text-gray-900">{{ auxiliarTercero()!.terceroNombre }}</strong>
                  <span class="ml-2 font-mono text-gray-600">NIT: {{ auxiliarTercero()!.numeroIdentificacion }}</span>
                </div>
                <div class="font-mono font-bold text-blue-700">
                  Saldo Final: {{ auxiliarTercero()!.saldoFinal | number:'1.2-2' }}
                </div>
              </div>
              <div class="overflow-auto max-h-[450px]">
                <table class="tabla-datos w-full text-xs">
                  <thead>
                    <tr>
                      <th class="w-24">Fecha</th>
                      <th class="w-28">Comprobante</th>
                      <th class="w-24">Cuenta</th>
                      <th>Nombre Cuenta</th>
                      <th>Concepto</th>
                      <th class="w-28 text-right">Débito</th>
                      <th class="w-28 text-right">Crédito</th>
                      <th class="w-28 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of auxiliarTercero()!.movimientos; track $index) {
                      <tr class="border-b hover:bg-gray-50/50">
                        <td class="font-mono">{{ m.fecha }}</td>
                        <td class="font-mono">{{ m.comprobante }}</td>
                        <td class="font-mono">{{ m.cuentaCodigo }}</td>
                        <td>{{ m.cuentaNombre }}</td>
                        <td class="truncate max-w-[180px]" [title]="m.concepto">{{ m.concepto }}</td>
                        <td class="text-right font-mono">{{ m.debito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono">{{ m.credito | number:'1.2-2' }}</td>
                        <td class="text-right font-mono font-semibold">{{ m.saldoAcumulado | number:'1.2-2' }}</td>
                      </tr>
                    }
                    @if (auxiliarTercero()!.movimientos.length === 0) {
                      <tr>
                        <td colspan="8" class="text-center py-6 text-gray-400">
                          Sin movimientos para este tercero en el periodo seleccionado.
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="font-bold bg-gray-50">
                      <td colspan="5" class="text-right py-2 px-3">TOTALES:</td>
                      <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.totalDebito | number:'1.2-2' }}</td>
                      <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.totalCredito | number:'1.2-2' }}</td>
                      <td class="text-right font-mono py-2 px-3">{{ auxiliarTercero()!.saldoFinal | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- Template reutilizable para tablas jerárquicas de balance/PyG -->
      <ng-template #tablaBalance let-cuentas let-total="total">
        <table class="tabla-datos w-full text-xs mb-1">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-28 text-left py-1.5 px-2">Código</th>
              <th class="text-left py-1.5 px-2">Cuenta</th>
              <th class="w-32 text-right py-1.5 px-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            @for (c of cuentas; track c.codigo) {
              <tr class="border-b hover:bg-gray-50/50" [class.font-semibold]="c.nivel <= 2">
                <td class="font-mono py-1.5 px-2" [style.padding-left.px]="(c.nivel - 1) * 10">
                  {{ c.codigo }}
                </td>
                <td class="py-1.5 px-2" [style.padding-left.px]="(c.nivel - 1) * 10">
                  {{ c.nombre }}
                </td>
                <td class="text-right font-mono py-1.5 px-2">
                  {{ c.saldo | number:'1.2-2' }}
                </td>
              </tr>
            }
            @if (!cuentas || cuentas.length === 0) {
              <tr>
                <td colspan="3" class="text-center py-4 text-gray-400 italic">Sin movimientos</td>
              </tr>
            }
          </tbody>
          <tfoot class="border-t font-bold bg-gray-50">
            <tr>
              <td colspan="2" class="text-right py-2 px-2">TOTAL</td>
              <td class="text-right font-mono py-2 px-2 text-blue-700">
                {{ total | number:'1.2-2' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </ng-template>
    </div>
  `,
})
export class ContabilidadReportesComponent implements OnInit {
  private readonly svc = inject(ContabilidadService);

  readonly cargando = signal<boolean>(false);
  readonly reporteActivo = signal<ReporteActivo>('balance');
  readonly balance = signal<BalanceGeneral | null>(null);
  readonly pyg = signal<EstadoResultados | null>(null);
  readonly libroDiario = signal<LibroDiarioItem[]>([]);
  readonly libroMayor = signal<LibroMayorCuenta[]>([]);
  readonly auxiliarTercero = signal<AuxiliarTerceroReporte | null>(null);
  readonly terceros = signal<Tercero[]>([]);

  readonly reportes: { key: ReporteActivo; label: string; icono: string }[] = [
    { key: 'balance', label: 'Balance General', icono: '🏛' },
    { key: 'pyg', label: 'Estado Resultados', icono: '📈' },
    { key: 'diario', label: 'Libro Diario', icono: '📋' },
    { key: 'mayor', label: 'Libro Mayor', icono: '📒' },
    { key: 'auxiliar', label: 'Auxiliar Tercero', icono: '👤' },
  ];

  balanceFechaCorte = new Date().toISOString().split('T')[0];
  pygDesde = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  pygHasta = new Date().toISOString().split('T')[0];
  desdeFiltro = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  hastaFiltro = new Date().toISOString().split('T')[0];
  mayorCuenta = '';
  terceroFiltroId = '';
  auxiliarCuentaCodigo = '';

  readonly totalDiarioDB = computed(() => {
    return Math.round(this.libroDiario().reduce((s, r) => s + (Number(r.debito) || 0), 0) * 100) / 100;
  });

  readonly totalDiarioCR = computed(() => {
    return Math.round(this.libroDiario().reduce((s, r) => s + (Number(r.credito) || 0), 0) * 100) / 100;
  });

  ngOnInit(): void {
    this.cargarTerceros();
  }

  cargarTerceros(): void {
    this.svc.getTerceros().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => {},
    });
  }

  seleccionarReporte(key: ReporteActivo): void {
    this.reporteActivo.set(key);
  }

  generarBalance(): void {
    this.cargando.set(true);
    this.svc.getBalanceGeneral(this.balanceFechaCorte).subscribe({
      next: (data) => {
        this.balance.set(data);
        this.cargando.set(false);
      },
      error: () => {
        // En caso de error o sin datos, proveer objeto balance default con cuadra=true para no romper UI
        this.balance.set({
          fechaCorte: this.balanceFechaCorte,
          activos: [],
          pasivos: [],
          patrimonio: [],
          totalActivos: 0,
          totalPasivos: 0,
          totalPatrimonio: 0,
          cuadra: true,
        });
        this.cargando.set(false);
      },
    });
  }

  generarPyg(): void {
    this.cargando.set(true);
    this.svc.getEstadoResultados(this.pygDesde, this.pygHasta).subscribe({
      next: (data) => {
        this.pyg.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.pyg.set({
          desde: this.pygDesde,
          hasta: this.pygHasta,
          ingresos: [],
          gastos: [],
          totalIngresos: 0,
          totalGastos: 0,
          excedente: 0,
        });
        this.cargando.set(false);
      },
    });
  }

  generarDiario(): void {
    this.cargando.set(true);
    this.svc.getLibroDiario(this.desdeFiltro, this.hastaFiltro).subscribe({
      next: (data) => {
        this.libroDiario.set(Array.isArray(data) ? data : []);
        this.cargando.set(false);
      },
      error: () => {
        this.libroDiario.set([]);
        this.cargando.set(false);
      },
    });
  }

  generarMayor(): void {
    this.cargando.set(true);
    this.svc.getLibroMayor(this.desdeFiltro, this.hastaFiltro, this.mayorCuenta || undefined).subscribe({
      next: (data) => {
        this.libroMayor.set(Array.isArray(data) ? data : []);
        this.cargando.set(false);
      },
      error: () => {
        this.libroMayor.set([]);
        this.cargando.set(false);
      },
    });
  }

  generarAuxiliar(): void {
    this.cargando.set(true);
    this.svc
      .getAuxiliarTercero(
        this.desdeFiltro,
        this.hastaFiltro,
        this.terceroFiltroId || undefined,
        this.auxiliarCuentaCodigo || undefined,
      )
      .subscribe({
        next: (data) => {
          this.auxiliarTercero.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.auxiliarTercero.set(null);
          this.cargando.set(false);
        },
      });
  }

  exportarExcel(reporte: string): void {
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: this.reporteActivo() === 'pyg' ? this.pygDesde : this.desdeFiltro,
      fechaFin: this.reporteActivo() === 'pyg' ? this.pygHasta : this.hastaFiltro,
      codigoCuenta: this.mayorCuenta || this.auxiliarCuentaCodigo,
      terceroId: this.terceroFiltroId,
    };
    this.svc.descargarReporteExcel(reporte, params);
  }

  exportarPdf(reporte: string): void {
    const params: Record<string, string> = {
      fechaCorte: this.balanceFechaCorte,
      fechaInicio: this.reporteActivo() === 'pyg' ? this.pygDesde : this.desdeFiltro,
      fechaFin: this.reporteActivo() === 'pyg' ? this.pygHasta : this.hastaFiltro,
      codigoCuenta: this.mayorCuenta || this.auxiliarCuentaCodigo,
      terceroId: this.terceroFiltroId,
    };
    this.svc.descargarReportePdf(reporte, params);
  }
}
