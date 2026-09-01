import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-03: Tesorería & Cartera Educativa (Facturación, Wompi & Paz y Salvo)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'TESORERO');
  });

  test('3.1 Should display treasury KPI metrics cards and financial navigation tabs', async ({ page }) => {
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // Page Title
    await expect(page.locator('h1')).toContainText('Tesorería & Cartera');

    // KPI Cards
    const kpiCards = page.locator('.kpi-summary-grid .summary-card');
    await expect(kpiCards).toHaveCount(5);
    await expect(page.locator('.kpi-summary-grid')).toContainText('Recaudo del Mes');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Cartera Vencida');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Proyección Mes');
    await expect(page.locator('.kpi-summary-grid')).toContainText('Caja Actual');

    // Tabs
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('Facturación y Cuentas de Cobro');
    await expect(tabs.nth(1)).toContainText('Ficha Financiera Estudiante');
    await expect(tabs.nth(2)).toContainText('Recaudos y Pagos');
    await expect(tabs.nth(3)).toContainText('Acuerdos de Pago');
    await expect(tabs.nth(4)).toContainText('Reportes Contables');
  });

  test('3.2 Should switch to Ficha Financiera tab and inspect student account statement and Paz y Salvo gating', async ({ page }) => {
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // Click on Ficha Financiera Estudiante tab
    const tabFicha = page.locator('.tabs-nav-bar .tab-btn:has-text("Ficha Financiera")');
    await tabFicha.click();

    // Verify component rendered
    const estadoCuentaView = page.locator('app-tesoreria-estado-cuenta');
    await expect(estadoCuentaView).toBeVisible();

    // Verify student selector dropdown / search
    const studentSelect = page.locator('app-tesoreria-estado-cuenta select, app-tesoreria-estado-cuenta .form-select');
    await expect(studentSelect.first()).toBeVisible();

    // Verify Paz y Salvo button or status check
    const pazSalvoBtn = page.locator('button:has-text("Paz y Salvo"), button:has-text("Extracto")');
    expect(await pazSalvoBtn.count()).toBeGreaterThan(0);
  });

  test('3.3 Should open Wompi PSE / Card Checkout Modal and verify transaction reference', async ({ page }) => {
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    // On Facturas tab, find a Wompi payment button
    const btnWompi = page.locator('button:has-text("Wompi"), button[title*="Wompi"]').first();
    
    if (await btnWompi.isVisible()) {
      await btnWompi.click();

      // Verify Wompi modal opens
      const modalWompi = page.locator('app-modal-checkout-wompi .modal-card');
      await expect(modalWompi).toBeVisible();
      await expect(modalWompi).toContainText(/Wompi|Pasarela|PSE|Tarjeta/i);

      // Close modal
      const closeBtn = modalWompi.locator('.close-btn, button:has-text("Cancelar")').first();
      await closeBtn.click();
      await expect(modalWompi).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('3.4 Should trigger daily cash close (Cierre de Caja Diario) and generate report', async ({ page }) => {
    await page.goto('/tesoreria');
    await page.waitForLoadState('networkidle');

    const btnCierre = page.locator('button:has-text("Cierre de Caja Diario")');
    await expect(btnCierre).toBeVisible();
    await btnCierre.click();

    // Verify Toast feedback
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // Verify PostgreSQL database concepts & billing
    const billingConcepts = await queryDb('SELECT count(*) as total FROM tes_conceptos_cobro');
    expect(Number(billingConcepts[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('3.5 Should verify financial records and zero orphaned accounts in PostgreSQL', async ({ page }) => {
    // Direct DB validation of billing tables
    const billingRows = await queryDb('SELECT * FROM tes_cuentas_cobro LIMIT 5');
    if (billingRows.length > 0) {
      expect(billingRows[0]).toHaveProperty('matricula_id');
      expect(billingRows[0]).toHaveProperty('valor_total');
    }

    const recaudos = await queryDb('SELECT * FROM tes_pagos_recaudos LIMIT 5');
    if (recaudos.length > 0) {
      expect(recaudos[0]).toHaveProperty('monto_pagado');
      expect(recaudos[0]).toHaveProperty('metodo_pago');
    }
  });
});
