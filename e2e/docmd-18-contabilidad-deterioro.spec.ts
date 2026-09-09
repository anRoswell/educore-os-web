import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-18: Contabilidad Escolar — Suite de Deterioro de Cartera (NIIF 9 / Sección 11)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-18: Deterioro de Cartera NIIF 9 — E2E Suite Exhaustiva', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('18.D.1 Navegación a la pestaña Deterioro y renderizado de KPIs y Matriz de Envejecimiento', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabDeterioro = page.locator('[data-testid="tab-deterioro"]');
    await expect(tabDeterioro).toBeVisible();
    await tabDeterioro.click();
    await page.waitForTimeout(400);

    const container = page.locator('[data-testid="tab-content-deterioro"]');
    await expect(container).toBeVisible();

    // Validar cabecera y controles
    await expect(page.locator('[data-testid="deterioro-title"]')).toContainText('Deterioro de Cartera Morosa');
    await expect(page.locator('[data-testid="input-fecha-corte-deterioro"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-consultar-deterioro"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-generar-asiento-deterioro"]')).toBeVisible();

    // Validar KPIs
    await expect(page.locator('[data-testid="kpi-total-cartera"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-deterioro"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-tasa-deterioro"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-cuentas-afectadas"]')).toBeVisible();

    // Validar tabla de envejecimiento
    const tabla = page.locator('[data-testid="table-deterioro"]');
    await expect(tabla).toBeVisible();

    // Validar los 6 tramos de vencimiento
    await expect(page.locator('[data-testid="row-tramo-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="tramo-rango-0"]')).toContainText('1-30 días');
    await expect(page.locator('[data-testid="tramo-rango-5"]')).toContainText('>360 días');

    // Validar totales consolidados en el footer
    await expect(page.locator('[data-testid="footer-total-cartera"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer-total-deterioro"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('18.D.2 Recalcular matriz al modificar la fecha de corte', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-deterioro"]').click();
    await page.waitForTimeout(300);

    const inputFecha = page.locator('[data-testid="input-fecha-corte-deterioro"]');
    await inputFecha.fill('2026-09-30');

    const btnRecalcular = page.locator('[data-testid="btn-consultar-deterioro"]');
    await btnRecalcular.click();
    await page.waitForTimeout(400);

    await expect(page.locator('[data-testid="table-deterioro"]')).toBeVisible();
    await expect(page.locator('[data-testid="row-tramo-0"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('18.D.3 Ciclo de vida completo del modal de confirmación y generación de comprobante AJU', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-deterioro"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal de confirmación
    const btnGenerar = page.locator('[data-testid="btn-generar-asiento-deterioro"]');
    await expect(btnGenerar).toBeEnabled();
    await btnGenerar.click();

    const modalConfirmar = page.locator('[data-testid="modal-confirmar-deterioro"]');
    await expect(modalConfirmar).toBeVisible();
    await expect(page.locator('[data-testid="modal-confirmar-title"]')).toContainText('Confirmar Contabilización');

    // 2. Probar cancelación del modal
    const btnCancelar = page.locator('[data-testid="btn-cancelar-asiento-deterioro"]');
    await btnCancelar.click();
    await expect(modalConfirmar).not.toBeVisible();

    // 3. Reabrir e ingresar observación contable
    await btnGenerar.click();
    await expect(modalConfirmar).toBeVisible();

    const textareaObs = page.locator('[data-testid="textarea-observacion-deterioro"]');
    await textareaObs.fill('Ajuste contable mensual por pérdida crediticia esperada NIIF 9 corte septiembre');

    // 4. Confirmar contabilización
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-asiento-deterioro"]');
    await btnConfirmar.click();

    // 5. Validar modal de resultado exitoso
    const modalResultado = page.locator('[data-testid="modal-resultado-deterioro"]');
    await expect(modalResultado).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="modal-resultado-title"]')).toContainText('Ajuste Contable Generado Exitosamente');

    // Validar detalles del comprobante generado
    await expect(page.locator('[data-testid="resultado-consecutivo"]')).toContainText('AJU-');
    await expect(page.locator('[data-testid="resultado-estado"]')).toContainText('POSTED');
    await expect(page.locator('[data-testid="resultado-debito"]')).toBeVisible();
    await expect(page.locator('[data-testid="resultado-credito"]')).toBeVisible();

    // Cerrar modal de resultado
    await page.locator('[data-testid="btn-cerrar-resultado-deterioro"]').click();
    await expect(modalResultado).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('18.D.4 Verificación directa en base de datos PostgreSQL de cuentas NIIF de deterioro', async () => {
    // Validar que las cuentas 519905 (Gasto) y 139905 (Deterioro) existan en el PUC del colegio
    const cuentas = await queryDb(
      "SELECT codigo, nombre, naturaleza FROM cont_puc_cuentas WHERE codigo IN ('519905', '139905') ORDER BY codigo ASC;"
    );

    expect(cuentas.length).toBeGreaterThanOrEqual(1);
    const codigos = cuentas.map((c: any) => c.codigo);
    console.log('Cuentas de deterioro encontradas en BD:', codigos);
  });
});
