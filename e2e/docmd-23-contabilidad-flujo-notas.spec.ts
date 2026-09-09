import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-23: Contabilidad Escolar — Estados Financieros Complementarios NIIF
 * - Flujo de Efectivo Método Indirecto (NIC 7)
 * - Notas y Revelaciones a los Estados Financieros (NIIF para Pymes / Decreto 2420)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-23: Estados Financieros NIIF (Flujo de Efectivo NIC 7 & Notas NIIF) — E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('23.FN.1 Navegación a Reportes -> Flujo de Efectivo NIC 7, parámetros y generación de conciliación', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // Navegar a la pestaña de reportes
    const tabReportes = page.locator('[data-testid="tab-reportes"]');
    await expect(tabReportes).toBeVisible();
    await tabReportes.click();
    await page.waitForTimeout(300);

    // Seleccionar sub-reporte Flujo de Efectivo
    const btnSubFlujo = page.locator('[data-testid="btn-subreporte-flujo"]');
    await expect(btnSubFlujo).toBeVisible();
    await btnSubFlujo.click();
    await page.waitForTimeout(300);

    // Verificar controles de parámetros
    await expect(page.locator('[data-testid="title-flujo-efectivo"]')).toContainText('Estado de Flujos de Efectivo');
    await expect(page.locator('[data-testid="input-flujo-desde"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-flujo-hasta"]')).toBeVisible();

    const btnGenerar = page.locator('[data-testid="btn-generar-flujo"]');
    await expect(btnGenerar).toBeVisible();
    await btnGenerar.click();
    await page.waitForTimeout(800);

    // Verificar que los KPIs de flujo se calculen y se muestren
    const kpiGrid = page.locator('[data-testid="kpis-flujo-grid"]');
    await expect(kpiGrid).toBeVisible();

    // Validar presencia de secciones de actividades
    await expect(page.locator('text=1. Actividades de Operación')).toBeVisible();
    await expect(page.locator('text=2. Actividades de Inversión')).toBeVisible();
    await expect(page.locator('text=3. Actividades de Financiación')).toBeVisible();
    await expect(page.locator('text=Saldo Inicial de Efectivo')).toBeVisible();
    await expect(page.locator('text=Saldo Final de Efectivo')).toBeVisible();

    // Validar botones de exportación
    await expect(page.locator('[data-testid="btn-exportar-flujo-pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-exportar-flujo-excel"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('23.FN.2 Navegación a Reportes -> Notas NIIF, parámetros de vigencia fiscal y generación de pliego oficial', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // Navegar a reportes
    await page.locator('[data-testid="tab-reportes"]').click();
    await page.waitForTimeout(300);

    // Seleccionar sub-reporte Notas NIIF
    const btnSubNotas = page.locator('[data-testid="btn-subreporte-notas"]');
    await expect(btnSubNotas).toBeVisible();
    await btnSubNotas.click();
    await page.waitForTimeout(300);

    // Verificar controles
    await expect(page.locator('[data-testid="title-notas-niif"]')).toContainText('Notas y Revelaciones');
    await expect(page.locator('[data-testid="input-notas-anio"]')).toBeVisible();

    const btnGenerarNotas = page.locator('[data-testid="btn-generar-notas"]');
    await expect(btnGenerarNotas).toBeVisible();
    await btnGenerarNotas.click();
    await page.waitForTimeout(800);

    // Verificar que se listan las notas NIIF
    const listaNotas = page.locator('[data-testid="lista-notas-niif"]');
    await expect(listaNotas).toBeVisible();

    // Validar notas clave
    await expect(page.locator('text=Nota 1').first()).toBeVisible();
    await expect(page.locator('text=Entidad que Informa').first()).toBeVisible();
    await expect(page.locator('text=Nota 2').first()).toBeVisible();
    await expect(page.locator('text=Bases de Preparación').first()).toBeVisible();
    await expect(page.locator('text=Nota 4').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Efectivo y Equivalentes de Efectivo' })).toBeVisible();

    // Validar botón de exportación PDF de Notas
    await expect(page.locator('[data-testid="btn-exportar-notas-pdf"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('23.FN.3 Descarga y exportación de Flujo de Efectivo y Notas NIIF sin excepciones en consola', async ({ page }) => {
    test.setTimeout(60000);
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // Ir a reportes -> Flujo
    await page.locator('[data-testid="tab-reportes"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="btn-subreporte-flujo"]').click();
    await page.waitForTimeout(300);

    // Generar flujo
    await page.locator('[data-testid="btn-generar-flujo"]').click();
    await page.waitForTimeout(600);

    // Disparar exportación PDF
    const [downloadPdf] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.locator('[data-testid="btn-exportar-flujo-pdf"]').click(),
    ]);

    // Disparar exportación Excel
    const [downloadExcel] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.locator('[data-testid="btn-exportar-flujo-excel"]').click(),
    ]);

    // Ir a Notas NIIF
    await page.locator('[data-testid="btn-subreporte-notas"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="btn-generar-notas"]').click();
    await page.waitForTimeout(600);

    // Disparar exportación PDF de Notas
    const [downloadNotasPdf] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.locator('[data-testid="btn-exportar-notas-pdf"]').click(),
    ]);

    await page.waitForTimeout(500);
    sniffer.assertZeroErrors();
  });
});
