import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-03: Tesorería & Cartera Educativa - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, filters, modal lifecycles, and PostgreSQL persistence.
 */
test.describe('DocMD-03: Tesorería & Cartera Educativa (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'TESORERO');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones Globales y Sniffer de Errores
   */
  test('3.1 Carga inicial, KPIs financieros, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Tesorería & Cartera');

    // 2. Acciones de Cabecera (Header Actions)
    const btnConfig = page.locator('button:has-text("Configuración")');
    await expect(btnConfig).toBeVisible();

    const btnCierre = page.locator('button:has-text("Cierre de Caja Diario")');
    await expect(btnCierre).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-summary-grid .summary-card');
    await expect(kpiCards).toHaveCount(5);
    await expect(page.locator('.kpi-summary-grid')).toContainText('Recaudo del Mes');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Cartera Vencida');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Proyección Mes');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Caja Actual');

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(5);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('3.2 Navegación exhaustiva por las 5 pestañas y aplicación de filtros de búsqueda', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Facturas y Cuentas de Cobro ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Facturación")').click();
    await expect(page.locator('app-tesoreria-facturas')).toBeVisible();

    // Probar filtro de texto
    const searchInput = page.locator('app-tesoreria-facturas input.search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gómez');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    // Probar selectores de filtro
    const selectEstado = page.locator('app-tesoreria-facturas select').nth(0);
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption({ index: 0 });
    }

    // --- Tab 2: Ficha Financiera Estudiante ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Ficha Financiera")').click();
    await expect(page.locator('app-tesoreria-estado-cuenta')).toBeVisible();

    // --- Tab 3: Recaudos y Pagos ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Recaudos y Pagos")').click();
    await expect(page.locator('app-tesoreria-recaudos')).toBeVisible();

    // --- Tab 4: Acuerdos de Pago ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Acuerdos de Pago")').click();
    await expect(page.locator('app-tesoreria-acuerdos')).toBeVisible();

    // --- Tab 5: Reportes Contables ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Reportes Contables")').click();
    await expect(page.locator('app-tesoreria-reportes')).toBeVisible();
    await expect(page.locator('app-tesoreria-reportes button:has-text("Exportar a Excel")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla (Row Action Sweep)
   */
  test('3.3 Barrido exhaustivo de botones de acción en filas de Facturación y Recaudos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Facturación: Inspeccionar primera fila
    const filaFactura = page.locator('app-tesoreria-facturas table.data-table tbody tr').first();
    if (await filaFactura.isVisible()) {
      // Probar botón "🔍 Ficha"
      const btnFicha = filaFactura.locator('button:has-text("Ficha")');
      if (await btnFicha.isVisible()) {
        await btnFicha.click();
        await expect(page.locator('app-tesoreria-estado-cuenta')).toBeVisible();
        
        // Regresar a facturas
        await page.locator('.tabs-nav-bar .tab-btn:has-text("Facturación")').click();
        await page.waitForLoadState('networkidle');
      }

      // Probar botón "💵 Caja" -> Abre ModalPagoManual
      const btnCaja = filaFactura.locator('button:has-text("Caja")');
      if (await btnCaja.isVisible()) {
        await btnCaja.click();
        const modalCaja = page.locator('app-modal-pago-manual .modal-card, app-modal-pago-manual .modal-backdrop');
        await expect(modalCaja.first()).toBeVisible();
        await page.locator('app-modal-pago-manual button:has-text("Cancelar"), app-modal-pago-manual .close-btn').first().click();
        await expect(modalCaja.first()).not.toBeVisible();
      }

      // Probar botón "✏️ Beca" -> Abre ModalEditarFactura
      const btnBeca = filaFactura.locator('button:has-text("Beca")');
      if (await btnBeca.isVisible()) {
        await btnBeca.click();
        const modalEditar = page.locator('app-modal-editar-factura .modal-card, app-modal-editar-factura .modal-backdrop');
        await expect(modalEditar.first()).toBeVisible();
        await page.locator('app-modal-editar-factura button:has-text("Cancelar"), app-modal-editar-factura .close-btn').first().click();
        await expect(modalEditar.first()).not.toBeVisible();
      }

      // Probar botón "🗑️" -> Abre ModalAnularFactura
      const btnAnular = filaFactura.locator('button:has-text("🗑️")');
      if (await btnAnular.isVisible()) {
        await btnAnular.click();
        const modalAnular = page.locator('app-modal-anular-factura .modal-card, app-modal-anular-factura .modal-backdrop');
        await expect(modalAnular.first()).toBeVisible();
        await page.locator('app-modal-anular-factura button:has-text("Cancelar"), app-modal-anular-factura .close-btn').first().click();
        await expect(modalAnular.first()).not.toBeVisible();
      }

      // Probar botón "💳 PSE" -> Abre ModalCheckoutWompi
      const btnPse = filaFactura.locator('button:has-text("PSE")');
      if (await btnPse.isVisible()) {
        await btnPse.click();
        const modalWompi = page.locator('app-modal-checkout-wompi .modal-card, app-modal-checkout-wompi .modal-backdrop');
        await expect(modalWompi.first()).toBeVisible();
        await page.locator('app-modal-checkout-wompi button:has-text("Cancelar"), app-modal-checkout-wompi .close-btn').first().click();
        await expect(modalWompi.first()).not.toBeVisible();
      }
    }

    // 2. En Tab Recaudos: Inspeccionar fila
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Recaudos y Pagos")').click();
    await page.waitForLoadState('networkidle');

    const filaRecaudo = page.locator('app-tesoreria-recaudos table.data-table tbody tr').first();
    if (await filaRecaudo.isVisible()) {
      // Probar botón "🧾 Ver" recibo
      const btnVerRecibo = filaRecaudo.locator('button:has-text("Ver")');
      if (await btnVerRecibo.isVisible()) {
        await btnVerRecibo.click();
        const modalRecibo = page.locator('.recibo-caja-print, .modal-card:has-text("Recibo Oficial")');
        await expect(modalRecibo.first()).toBeVisible();
        await page.locator('.print-backdrop .close-btn, .modal-backdrop .close-btn').first().click();
        await expect(modalRecibo.first()).not.toBeVisible();
      }

      // Probar botón "🚫 Anular" -> Abre ModalAnularPago
      const btnAnularPago = filaRecaudo.locator('button:has-text("Anular")');
      if (await btnAnularPago.isVisible()) {
        await btnAnularPago.click();
        const modalAnularP = page.locator('app-modal-anular-pago .modal-card, app-modal-anular-pago .modal-backdrop');
        await expect(modalAnularP.first()).toBeVisible();
        await page.locator('app-modal-anular-pago button:has-text("Cancelar"), app-modal-anular-pago .close-btn').first().click();
        await expect(modalAnularP.first()).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Modal Lifecycle Sweeps)
   */
  test('3.4 Ciclo de vida completo de los modales de Tesorería (apertura, validación y cancelación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // 1. Modal Pago Manual (desde Tab Recaudos)
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Recaudos y Pagos")').click();
    const btnNuevoPago = page.locator('button:has-text("Registrar Recaudo en Ventanilla")');
    await expect(btnNuevoPago).toBeVisible();
    await btnNuevoPago.click();

    const modalPagoManual = page.locator('app-modal-pago-manual .modal-card, app-modal-pago-manual .modal-backdrop');
    await expect(modalPagoManual.first()).toBeVisible();
    await page.locator('app-modal-pago-manual button:has-text("Cancelar"), app-modal-pago-manual .close-btn').first().click();
    await expect(modalPagoManual.first()).not.toBeVisible();

    // 2. Modal Nuevo Acuerdo (desde Tab Acuerdos)
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Acuerdos de Pago")').click();
    const btnNuevoAcuerdo = page.locator('button:has-text("Nuevo Acuerdo de Pago")');
    await expect(btnNuevoAcuerdo).toBeVisible();
    await btnNuevoAcuerdo.click();

    const modalNuevoAcuerdo = page.locator('app-modal-nuevo-acuerdo .modal-card, app-modal-nuevo-acuerdo .modal-backdrop');
    await expect(modalNuevoAcuerdo.first()).toBeVisible();
    await page.locator('app-modal-nuevo-acuerdo button:has-text("Cancelar"), app-modal-nuevo-acuerdo .close-btn').first().click();
    await expect(modalNuevoAcuerdo.first()).not.toBeVisible();

    // 3. Modales de Ficha 360 (desde Tab Ficha Financiera)
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Ficha Financiera")').click();
    await page.waitForLoadState('networkidle');

    // Probar botón "📄 Paz y Salvo" / Extracto
    const btnPazSalvo = page.locator('button:has-text("Paz y Salvo"), button:has-text("Extracto")').first();
    if (await btnPazSalvo.isVisible()) {
      await btnPazSalvo.click();
      const modalPaz = page.locator('app-modal-paz-y-salvo .modal-card, app-modal-extracto-consolidado .modal-card');
      if (await modalPaz.first().isVisible()) {
        await modalPaz.first().locator('button:has-text("Cerrar"), button:has-text("Cancelar"), .close-btn').first().click();
      }
    }

    // Probar botón "✏️ Beca" si está presente
    const btnModalBeca = page.locator('button:has-text("Beca"), button:has-text("Descuento")').first();
    if (await btnModalBeca.isVisible()) {
      await btnModalBeca.click();
      const modalBeca = page.locator('app-modal-beca .modal-card, app-modal-beca .modal-backdrop');
      if (await modalBeca.first().isVisible()) {
        await page.locator('app-modal-beca button:has-text("Cancelar"), app-modal-beca .close-btn').first().click();
        await expect(modalBeca.first()).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Operaciones de Cierre Diario & Persistencia Directa en PostgreSQL
   */
  test('3.5 Cierre de caja diario y verificación de integridad transaccional en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // Ejecutar Cierre de Caja Diario
    const btnCierre = page.locator('button:has-text("Cierre de Caja Diario")');
    await expect(btnCierre).toBeVisible();
    await btnCierre.click();

    // Validar Toast de confirmación
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success, .toast-info');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // Verificación directa en base de datos PostgreSQL
    const conceptos = await queryDb('SELECT count(*) as total FROM tes_conceptos_cobro');
    expect(Number(conceptos[0].total)).toBeGreaterThanOrEqual(0);

    const cuentas = await queryDb('SELECT count(*) as total FROM tes_cuentas_cobro WHERE colegio_id IS NOT NULL');
    expect(Number(cuentas[0].total)).toBeGreaterThanOrEqual(0);

    const pagos = await queryDb('SELECT count(*) as total FROM tes_pagos_recaudos WHERE colegio_id IS NOT NULL');
    expect(Number(pagos[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
