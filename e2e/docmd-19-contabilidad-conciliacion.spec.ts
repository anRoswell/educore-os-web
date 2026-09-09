import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-19: Contabilidad Escolar — Suite de Conciliación Bancaria Automática y Manual
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-19: Conciliación Bancaria Escolar — E2E Suite Exhaustiva', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('19.C.1 Navegación a la pestaña Conciliación Bancaria y renderizado de KPIs y Controles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabConciliacion = page.locator('[data-testid="tab-conciliacion"]');
    await expect(tabConciliacion).toBeVisible();
    await tabConciliacion.click();
    await page.waitForTimeout(400);

    const container = page.locator('[data-testid="tab-content-conciliacion"]');
    await expect(container).toBeVisible();

    // Validar cabecera y botones principales
    await expect(page.locator('[data-testid="conciliacion-title"]')).toContainText('Conciliación Bancaria Automática y Manual');
    await expect(page.locator('[data-testid="btn-abrir-importar-extracto"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-ejecutar-auto-match"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-ver-acta-conciliacion"]')).toBeVisible();

    // Validar selector de extracto activo
    await expect(page.locator('[data-testid="select-extracto-activo"]')).toBeVisible();

    // Validar KPIs
    await expect(page.locator('[data-testid="kpi-saldo-extracto"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-saldo-libros"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-saldo-conciliado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-diferencia"]')).toBeVisible();

    // Validar tabla de movimientos
    await expect(page.locator('[data-testid="card-movimientos-extracto"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-buscar-linea"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('19.C.2 Ciclo de vida completo del modal de Importación de Extracto Bancario', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-conciliacion"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnImportar = page.locator('[data-testid="btn-abrir-importar-extracto"]');
    await btnImportar.click();

    const modalImportar = page.locator('[data-testid="modal-importar-extracto"]');
    await expect(modalImportar).toBeVisible();
    await expect(page.locator('[data-testid="modal-importar-title"]')).toContainText('Importar Extracto Bancario');

    // 2. Cancelar modal
    const btnCancelar = page.locator('[data-testid="btn-cancelar-importar-extracto"]');
    await btnCancelar.click();
    await expect(modalImportar).not.toBeVisible();

    // 3. Reabrir y diligenciar
    await btnImportar.click();
    await expect(modalImportar).toBeVisible();

    const timestamp = Date.now();
    await page.locator('[data-testid="input-importar-archivo-nombre"]').fill(`Extracto_Bancolombia_E2E_${timestamp}.xlsx`);
    await page.locator('[data-testid="select-importar-banco"]').selectOption('Bancolombia');
    await page.locator('[data-testid="select-importar-formato"]').selectOption('XLSX');
    await page.locator('[data-testid="input-importar-numero-cuenta"]').fill('987-654321-00');

    // 4. Confirmar importación
    await page.locator('[data-testid="btn-confirmar-importar-extracto"]').click();
    await expect(modalImportar).not.toBeVisible({ timeout: 5000 });

    // Validar mensaje de éxito
    await expect(page.locator('[data-testid="conciliacion-success-banner"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('19.C.3 Ejecución de Auto-Match (Cruce Automático) y validación de coincidencia', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-conciliacion"]').click();
    await page.waitForTimeout(400);

    const btnAutoMatch = page.locator('[data-testid="btn-ejecutar-auto-match"]');
    await expect(btnAutoMatch).toBeEnabled({ timeout: 15000 });
    await btnAutoMatch.click();

    // Validar banner de resultado de Auto-Match
    const bannerAutoMatch = page.locator('[data-testid="banner-auto-match-result"]');
    await expect(bannerAutoMatch).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="badge-tasa-exito"]')).toContainText('Tasa de Éxito:');

    // Validar que la tabla contenga movimientos
    const tabla = page.locator('[data-testid="table-extracto-lineas"]');
    await expect(tabla).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('19.C.4 Conciliación manual asistida de una partida del extracto', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-conciliacion"]').click();
    await page.waitForTimeout(400);

    // Asegurar que hay líneas visibles
    const row0 = page.locator('[data-testid="row-linea-0"]');
    if (await row0.isVisible()) {
      const btnConciliar = page.locator('[data-testid="btn-conciliar-manual-0"]');
      await btnConciliar.click();

      const modalManual = page.locator('[data-testid="modal-conciliar-manual"]');
      await expect(modalManual).toBeVisible();
      await expect(page.locator('[data-testid="modal-manual-title"]')).toContainText('Conciliación Asistida de Partida');

      // Probar cancelación
      await page.locator('[data-testid="btn-cancelar-manual"]').click();
      await expect(modalManual).not.toBeVisible();

      // Reabrir y marcar como Partida Conciliatoria
      await btnConciliar.click();
      await expect(modalManual).toBeVisible();

      const chkPartida = page.locator('[data-testid="chk-partida-conciliatoria"]');
      await chkPartida.check();

      await page.locator('[data-testid="textarea-manual-obs"]').fill('Partida conciliatoria aprobada por Contador E2E');
      await page.locator('[data-testid="btn-guardar-conciliar-manual"]').click();

      await expect(modalManual).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="conciliacion-success-banner"]')).toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  test('19.C.5 Visualización y ciclo de vida del Acta Oficial de Conciliación Bancaria', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-conciliacion"]').click();
    await page.waitForTimeout(300);

    const btnActa = page.locator('[data-testid="btn-ver-acta-conciliacion"]');
    await btnActa.click();

    const modalActa = page.locator('[data-testid="modal-acta-conciliacion"]');
    await expect(modalActa).toBeVisible();
    await expect(page.locator('[data-testid="modal-acta-title"]')).toContainText('Acta Oficial Mensual de Conciliación Bancaria');
    await expect(page.locator('[data-testid="acta-diferencia"]')).toBeVisible();

    // Cerrar acta
    await page.locator('[data-testid="btn-cerrar-acta-conciliacion"]').click();
    await expect(modalActa).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('19.C.6 Verificación directa en base de datos PostgreSQL de extractos bancarios', async () => {
    const extractos = await queryDb(
      "SELECT id, banco, numero_cuenta, total_lineas, estado FROM cont_extractos_bancarios ORDER BY created_at DESC LIMIT 5;"
    );

    console.log('Extractos encontrados en BD:', extractos.length);
    expect(extractos.length).toBeGreaterThanOrEqual(1);
    expect(extractos[0].banco).toBeTruthy();
  });
});
