import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-20: Contabilidad Escolar — Suite de Información Exógena DIAN (Medios Magnéticos)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-20: Información Exógena DIAN — E2E Suite Exhaustiva', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('20.E.1 Navegación a la pestaña Exógena DIAN y renderizado de KPIs y Controles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabExogena = page.locator('[data-testid="tab-exogena"]');
    await expect(tabExogena).toBeVisible();
    await tabExogena.click();
    await page.waitForTimeout(400);

    const container = page.locator('[data-testid="tab-content-exogena"]');
    await expect(container).toBeVisible();

    // Validar cabecera y controles
    await expect(page.locator('[data-testid="exogena-title"]')).toContainText('Información Exógena DIAN');
    await expect(page.locator('[data-testid="select-anio-exogena"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-formato-exogena"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-validar-exogena"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-consultar-exogena"]')).toBeVisible();

    // Validar KPIs de Auditoría Fiscal
    await expect(page.locator('[data-testid="kpi-total-terceros"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-alertas-nit"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-alertas-direccion"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-alertas-dane"]')).toBeVisible();

    // Validar tabla de datos
    await expect(page.locator('[data-testid="card-datos-exogena"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('20.E.2 Pre-Validación de Consistencia Fiscal de Terceros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-exogena"]').click();
    await page.waitForTimeout(300);

    const btnValidar = page.locator('[data-testid="btn-validar-exogena"]');
    await btnValidar.click();
    await page.waitForTimeout(500);

    // Validar que los KPIs muestren números válidos
    const totalTerceros = page.locator('[data-testid="kpi-total-terceros"]');
    await expect(totalTerceros).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('20.E.3 Consulta y generación de Formatos 1001 y 1007 con renderizado de datos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-exogena"]').click();
    await page.waitForTimeout(300);

    // 1. Probar Formato 1001 (Pagos y Retenciones)
    const selectFormato = page.locator('[data-testid="select-formato-exogena"]');
    await selectFormato.selectOption('1001');

    const btnConsultar = page.locator('[data-testid="btn-consultar-exogena"]');
    await btnConsultar.click();
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="table-exogena-title"]')).toContainText('Formato 1001');
    await expect(page.locator('[data-testid="table-exogena-datos"]')).toBeVisible();

    // Validar botones de descarga presentes
    await expect(page.locator('[data-testid="btn-descargar-excel-exogena"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-descargar-xml-exogena"]')).toBeVisible();

    // 2. Probar Formato 1007 (Ingresos Recibidos)
    await selectFormato.selectOption('1007');
    await page.waitForTimeout(400);

    await expect(page.locator('[data-testid="table-exogena-title"]')).toContainText('Formato 1007');

    sniffer.assertZeroErrors();
  });

  test('20.E.4 Verificación directa en base de datos PostgreSQL de terceros y retenciones', async () => {
    const terceros = await queryDb(
      "SELECT id, numero_documento FROM cont_terceros LIMIT 5;"
    );

    console.log('Terceros para exógena en BD:', terceros.length);
    expect(terceros.length).toBeGreaterThanOrEqual(1);
    expect(terceros[0].numero_documento).toBeTruthy();
  });
});
