import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-21: Contabilidad Escolar — Suite de Cierre Fiscal Anual y Apertura APE
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-21: Cierre Fiscal Anual y Apertura APE — E2E Suite Exhaustiva', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('21.CI.1 Navegación a la pestaña Cierre Anual y renderizado de Stepper, KPIs y Mecánica', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabCierre = page.locator('[data-testid="tab-cierre"]');
    await expect(tabCierre).toBeVisible();
    await tabCierre.click();
    await page.waitForTimeout(400);

    const container = page.locator('[data-testid="tab-content-cierre"]');
    await expect(container).toBeVisible();

    // Validar cabecera y botones principales
    await expect(page.locator('[data-testid="cierre-title"]')).toContainText('Cierre Fiscal Anual y Balance de Apertura');
    await expect(page.locator('[data-testid="select-anio-cierre"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-simular-cierre"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-ejecutar-cierre"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-ejecutar-apertura"]')).toBeVisible();

    // Validar Stepper
    await expect(page.locator('[data-testid="cierre-stepper"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-3"]')).toBeVisible();

    // Validar KPIs
    await expect(page.locator('[data-testid="kpi-ingresos"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-gastos-costos"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-excedente"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-cuadre"]')).toBeVisible();

    // Validar tarjeta de mecánica de cierre
    await expect(page.locator('[data-testid="card-detalle-cierre"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('21.CI.2 Simular balance previo al cambiar de año fiscal', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-cierre"]').click();
    await page.waitForTimeout(300);

    const selectAnio = page.locator('[data-testid="select-anio-cierre"]');
    await selectAnio.selectOption('2025');

    const btnSimular = page.locator('[data-testid="btn-simular-cierre"]');
    await btnSimular.click();
    await page.waitForTimeout(400);

    await expect(page.locator('[data-testid="kpi-excedente"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('21.CI.3 Ciclo de vida completo del modal de Cierre Fiscal (CIER Periodo 13)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-cierre"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnEjecutarCierre = page.locator('[data-testid="btn-ejecutar-cierre"]');
    await expect(btnEjecutarCierre).toBeEnabled();
    await btnEjecutarCierre.click();

    const modalCierre = page.locator('[data-testid="modal-confirmar-cierre"]');
    await expect(modalCierre).toBeVisible();
    await expect(page.locator('[data-testid="modal-cierre-title"]')).toContainText('Confirmar Ejecución de Cierre Anual');

    // 2. Cancelar modal
    await page.locator('[data-testid="btn-cancelar-modal-cierre"]').click();
    await expect(modalCierre).not.toBeVisible();

    // 3. Reabrir e ingresar observación
    await btnEjecutarCierre.click();
    await expect(modalCierre).toBeVisible();

    await page.locator('[data-testid="textarea-cierre-obs"]').fill('Cierre fiscal oficial aprobado por Consejo Directivo E2E');

    // 4. Confirmar ejecución de cierre
    await page.locator('[data-testid="btn-confirmar-modal-cierre"]').click();
    await expect(modalCierre).not.toBeVisible({ timeout: 5000 });

    // Validar mensaje de éxito institucional
    await expect(page.locator('[data-testid="cierre-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="cierre-success-banner"]')).toContainText('Cierre contable ejecutado con éxito');

    sniffer.assertZeroErrors();
  });

  test('21.CI.4 Ciclo de vida completo del modal de Apertura Fiscal (APE)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-cierre"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal apertura
    const btnApertura = page.locator('[data-testid="btn-ejecutar-apertura"]');
    await btnApertura.click();

    const modalApertura = page.locator('[data-testid="modal-confirmar-apertura"]');
    await expect(modalApertura).toBeVisible();
    await expect(page.locator('[data-testid="modal-apertura-title"]')).toContainText('Generar Comprobante de Apertura Fiscal');

    // 2. Cancelar modal
    await page.locator('[data-testid="btn-cancelar-modal-apertura"]').click();
    await expect(modalApertura).not.toBeVisible();

    // 3. Reabrir y confirmar
    await btnApertura.click();
    await expect(modalApertura).toBeVisible();

    await page.locator('[data-testid="btn-confirmar-modal-apertura"]').click();
    await expect(modalApertura).not.toBeVisible({ timeout: 5000 });

    // Validar mensaje de éxito
    await expect(page.locator('[data-testid="cierre-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="cierre-success-banner"]')).toContainText('Apertura fiscal');

    sniffer.assertZeroErrors();
  });

  test('21.CI.5 Verificación directa en base de datos PostgreSQL de comprobantes y periodos', async () => {
    const periodos = await queryDb(
      "SELECT id, anio, mes, estado FROM cont_periodos_contables ORDER BY anio DESC, mes DESC LIMIT 5;"
    );

    console.log('Periodos contables en BD:', periodos.length);
    expect(periodos.length).toBeGreaterThanOrEqual(1);
    expect(periodos[0].estado).toBeTruthy();
  });
});
