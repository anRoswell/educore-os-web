import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-22: Contabilidad Escolar — Suite de Activos Fijos, Depreciación y Desvalorización NIIF (NIC 16 / NIC 36)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-22: Activos Fijos & Desvalorización NIIF — E2E Suite Exhaustiva', () => {
  const testPlaca = `ACT-E2E-${Date.now().toString().slice(-4)}`;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'RECTOR');
  });

  test('22.AF.1 Navegación a la pestaña Activos Fijos & Desvalorización, verificación de Banner, KPIs y Controles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabBtn = page.locator('[data-testid="tab-activos-fijos"]');
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
    await page.waitForTimeout(300);

    // Validar cabecera y títulos
    await expect(page.locator('[data-testid="title-activos-fijos"]')).toContainText('Activos Fijos & Desvalorización NIIF');
    await expect(page.locator('[data-testid="btn-recargar-activos"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-depreciar-mes"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-nuevo-activo"]')).toBeVisible();

    // Validar 4 Tarjetas KPI
    await expect(page.locator('[data-testid="kpi-costo-historico"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-depreciacion-acumulada"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-deterioro-acumulado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-valor-neto-libros"]')).toBeVisible();

    // Validar barra de filtros
    await expect(page.locator('[data-testid="input-buscar-activo"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-filtro-categoria"]')).toBeVisible();
    await expect(page.locator('[data-testid="activos-table"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('22.AF.2 Ciclo de vida de creación de un Activo Fijo escolar y persistencia en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-activos-fijos"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnNuevo = page.locator('[data-testid="btn-nuevo-activo"]');
    await btnNuevo.click();
    const modalCrear = page.locator('[data-testid="modal-nuevo-activo"]');
    await expect(modalCrear).toBeVisible();

    // 2. Probar cancelación
    await page.locator('[data-testid="btn-cancelar-crear"]').click();
    await expect(modalCrear).not.toBeVisible();

    // 3. Reabrir y diligenciar formulario
    await btnNuevo.click();
    await expect(modalCrear).toBeVisible();

    await page.locator('[data-testid="input-activo-placa"]').fill(testPlaca);
    await page.locator('[data-testid="select-activo-categoria"]').selectOption('MAQUINARIA_EQUIPO');
    await page.locator('[data-testid="input-activo-nombre"]').fill('Microscopio Binocular Trinocular Laboratorio Biología');
    await page.locator('[data-testid="input-activo-costo"]').fill('12000000');
    await page.locator('[data-testid="input-activo-residual"]').fill('1200000');
    await page.locator('[data-testid="input-activo-ubicacion"]').fill('Laboratorio Integrado 2');
    await page.locator('[data-testid="input-activo-responsable"]').fill('Lic. Roberto Gómez');

    // 4. Enviar formulario
    await page.locator('[data-testid="btn-confirmar-crear"]').click();
    await page.waitForTimeout(600);

    // 5. Validar modal de resultado exitoso
    const modalResultado = page.locator('[data-testid="modal-resultado-operacion"]');
    await expect(modalResultado).toBeVisible();
    await page.locator('[data-testid="btn-cerrar-resultado"]').click();
    await expect(modalResultado).not.toBeVisible();

    // 6. Verificar que aparece en la tabla
    const fila = page.locator(`[data-testid="row-activo-${testPlaca}"]`);
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('Microscopio Binocular');

    // 7. Verificación directa contra PostgreSQL
    const rows = await queryDb(
      'SELECT id, placa, nombre, costo_adquisicion, valor_en_libros, estado FROM cont_activos_fijos WHERE placa = $1',
      [testPlaca],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].placa).toBe(testPlaca);
    expect(Number(rows[0].costo_adquisicion)).toBe(12000000);
    expect(rows[0].estado).toBe('ACTIVO');

    sniffer.assertZeroErrors();
  });

  test('22.AF.3 Ciclo de vida de ejecución de Depreciación Mensual Masiva (Línea Recta NIC 16)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-activos-fijos"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnDepreciar = page.locator('[data-testid="btn-depreciar-mes"]');
    await btnDepreciar.click();
    const modalDep = page.locator('[data-testid="modal-depreciar-mes"]');
    await expect(modalDep).toBeVisible();

    // 2. Probar cancelación
    await page.locator('[data-testid="btn-cancelar-depreciacion"]').click();
    await expect(modalDep).not.toBeVisible();

    // 3. Reabrir y ejecutar para mes 3 / 2026
    await btnDepreciar.click();
    await expect(modalDep).toBeVisible();

    await page.locator('[data-testid="input-depreciar-anio"]').fill('2026');
    await page.locator('[data-testid="select-depreciar-mes"]').selectOption('3');

    await page.locator('[data-testid="btn-confirmar-depreciacion"]').click();
    await page.waitForTimeout(600);

    // 4. Validar modal de resultado
    const modalResultado = page.locator('[data-testid="modal-resultado-operacion"]');
    await expect(modalResultado).toBeVisible();
    await page.locator('[data-testid="btn-cerrar-resultado"]').click();
    await expect(modalResultado).not.toBeVisible();

    // 5. Verificación directa contra PostgreSQL en cont_activos_fijos_depreciaciones
    const depRows = await queryDb(
      'SELECT id, cuota_depreciacion, periodo_anio, periodo_mes FROM cont_activos_fijos_depreciaciones WHERE periodo_anio = 2026 ORDER BY created_at DESC LIMIT 5',
    );
    expect(depRows.length).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });

  test('22.AF.4 Ciclo de vida de Prueba de Deterioro / Desvalorización (NIC 36) con Asiento Contable', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-activos-fijos"]').click();
    await page.waitForTimeout(300);

    // 1. Buscar el activo creado
    const inputBuscar = page.locator('[data-testid="input-buscar-activo"]');
    await inputBuscar.fill(testPlaca);
    await page.waitForTimeout(200);

    const btnDeterioro = page.locator(`[data-testid="btn-deterioro-${testPlaca}"]`);
    await expect(btnDeterioro).toBeVisible();
    await btnDeterioro.click();

    // 2. Validar modal de deterioro
    const modalDet = page.locator('[data-testid="modal-deterioro"]');
    await expect(modalDet).toBeVisible();

    // 3. Cancelar modal
    await page.locator('[data-testid="btn-cancelar-deterioro"]').click();
    await expect(modalDet).not.toBeVisible();

    // 4. Reabrir e ingresar importe recuperable menor (pérdida por deterioro)
    await btnDeterioro.click();
    await expect(modalDet).toBeVisible();

    await page.locator('[data-testid="input-deterioro-recuperable"]').fill('8000000');
    await page.locator('[data-testid="textarea-deterioro-motivo"]').fill(
      'Obsolescencia óptica y descalibración irreversible según peritaje de laboratorio biológico E2E',
    );

    // Validar banner de pérdida calculada en tiempo real
    const bannerPerdida = page.locator('[data-testid="banner-perdida-calculada"]');
    await expect(bannerPerdida).toBeVisible();

    // 5. Confirmar deterioro
    await page.locator('[data-testid="btn-confirmar-deterioro"]').click();
    await page.waitForTimeout(600);

    // 6. Validar modal de resultado
    const modalResultado = page.locator('[data-testid="modal-resultado-operacion"]');
    await expect(modalResultado).toBeVisible();
    await page.locator('[data-testid="btn-cerrar-resultado"]').click();

    // 7. Verificar en la tabla que el estado es DESVALORIZADO
    const fila = page.locator(`[data-testid="row-activo-${testPlaca}"]`);
    await expect(fila).toContainText('DESVALORIZADO');

    // 8. Verificación directa contra PostgreSQL
    const detRows = await queryDb(
      'SELECT d.id, d.importe_recuperable, d.perdida_deterioro, a.estado FROM cont_activos_fijos_deterioros d JOIN cont_activos_fijos a ON a.id = d.activo_id WHERE a.placa = $1',
      [testPlaca],
    );
    expect(detRows.length).toBeGreaterThan(0);
    expect(Number(detRows[0].importe_recuperable)).toBe(8000000);
    expect(detRows[0].estado).toBe('DESVALORIZADO');

    sniffer.assertZeroErrors();
  });

  test('22.AF.5 Visualización de Ficha Patrimonial e Historial del Activo', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-activos-fijos"]').click();
    await page.waitForTimeout(300);

    const inputBuscar = page.locator('[data-testid="input-buscar-activo"]');
    await inputBuscar.fill(testPlaca);
    await page.waitForTimeout(200);

    const btnFicha = page.locator(`[data-testid="btn-ficha-${testPlaca}"]`);
    await expect(btnFicha).toBeVisible();
    await btnFicha.click();

    // Validar modal de ficha
    const modalFicha = page.locator('[data-testid="modal-detalle-activo"]');
    await expect(modalFicha).toBeVisible();
    await expect(modalFicha).toContainText(testPlaca);
    await expect(modalFicha).toContainText('Historial de Cuotas de Depreciación');
    await expect(modalFicha).toContainText('Historial de Pruebas de Desvalorización (NIC 36)');

    // Cerrar modal
    await page.locator('[data-testid="btn-cerrar-detalle"]').click();
    await expect(modalFicha).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('22.AF.6 Ciclo de vida para Dar de Baja un activo escolar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-activos-fijos"]').click();
    await page.waitForTimeout(500);

    const filaActivo = page.locator(`[data-testid="row-activo-${testPlaca}"]`);
    await expect(filaActivo).toBeVisible({ timeout: 15000 });

    const btnBaja = page.locator(`[data-testid="btn-baja-${testPlaca}"]`);
    await expect(btnBaja).toBeVisible();
    await btnBaja.click();

    // Validar modal de baja
    const modalBaja = page.locator('[data-testid="modal-dar-de-baja"]');
    await expect(modalBaja).toBeVisible();

    // Cancelar
    await page.locator('[data-testid="btn-cancelar-baja"]').click();
    await expect(modalBaja).not.toBeVisible();

    // Reabrir y confirmar baja
    await btnBaja.click();
    await expect(modalBaja).toBeVisible();

    await page.locator('[data-testid="input-baja-motivo"]').fill('Retiro definitivo y donación de partes para prácticas');
    await page.locator('[data-testid="btn-confirmar-baja"]').click();
    await page.waitForTimeout(500);

    // Cerrar modal de resultado
    const modalResultado = page.locator('[data-testid="modal-resultado-operacion"]');
    await expect(modalResultado).toBeVisible();
    await page.locator('[data-testid="btn-cerrar-resultado"]').click();

    // Verificar estado DADO_DE_BAJA en PostgreSQL
    const res = await queryDb('SELECT estado FROM cont_activos_fijos WHERE placa = $1', [testPlaca]);
    expect(res[0].estado).toBe('DADO_DE_BAJA');

    sniffer.assertZeroErrors();
  });
});
