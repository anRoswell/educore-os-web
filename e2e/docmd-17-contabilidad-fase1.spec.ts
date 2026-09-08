import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-17 (Fase 1 Core): Contabilidad Escolar Integral — Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 *
 * Covers:
 * - Suite 1: Carga inicial, navegación exhaustiva y Error Sniffer estricto en las nuevas pestañas
 * - Suite 2: Ingresos Diferidos NIIF 15 (Cronograma de 10 cuotas, amortización mensual y comprobante CAU)
 * - Suite 3: Causación de Nómina Docente NIC 19 (Devengados, retenciones 4%, provisiones y dispersión EGR)
 * - Suite 4: Asistente de Cierre Anual Periodo 13 (Simulación, comprobante CIER y apertura fiscal APE)
 * - Suite 5: Verificación Directa de Persistencia y Partida Doble en PostgreSQL QA
 */

test.describe('DocMD-17 Fase 1 — Suite 1: Carga y Navegación de Nuevos Módulos Contables', () => {
  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026 AND mes <= 12;");
    await loginAs(page, 'RECTOR');
  });

  test('17.1 Carga la página de Contabilidad y verifica las nuevas pestañas NIIF 15 y NIC 19', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="contabilidad-page-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-contabilidad"]')).toContainText('Contabilidad NIIF');

    // Verificar visibilidad de las nuevas pestañas
    const tabDiferidos = page.locator('[data-testid="tab-diferidos"]');
    const tabNomina = page.locator('[data-testid="tab-nomina"]');
    const tabPeriodos = page.locator('[data-testid="tab-periodos"]');

    await expect(tabDiferidos).toBeVisible();
    await expect(tabNomina).toBeVisible();
    await expect(tabPeriodos).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.2 Navegación fluida a la pestaña de Ingresos Diferidos NIIF 15', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-diferidos"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="tab-content-diferidos"]')).toBeVisible();
    await expect(page.locator('[data-testid="diferidos-titulo"]')).toContainText('Ingresos Diferidos');
    await expect(page.locator('[data-testid="diferidos-kpis"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-diferidos"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.3 Navegación fluida a la pestaña de Nómina Contable NIC 19', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-nomina"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="tab-content-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="nomina-titulo"]')).toContainText('Causación Contable de Nómina');
    await expect(page.locator('[data-testid="nomina-kpis"]')).toBeVisible();
    await expect(page.locator('[data-testid="nomina-tablas-detalle"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 1 — Suite 2: Ingresos Diferidos NIIF 15 y Amortización Mensual', () => {
  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026 AND mes <= 12;");
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-diferidos"]').click();
    await page.waitForTimeout(300);
  });

  test('17.4 KPIs cuantitativos y barra de avance de amortización NIIF 15', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="kpi-total-diferido"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-amortizado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-pendiente"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-porcentaje-avance"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.5 Selector de año lectivo y mes interactivo con actualización de tabla', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const selectAnio = page.locator('[data-testid="select-anio-diferidos"]');
    await selectAnio.selectOption('2026');
    await page.waitForTimeout(300);

    const selectMes = page.locator('[data-testid="select-mes-amortizar"]');
    await selectMes.selectOption('3'); // Marzo
    await page.waitForTimeout(200);

    await expect(selectMes).toHaveValue('3');
    sniffer.assertZeroErrors();
  });

  test('17.6 Ciclo de vida completo del modal de Cronograma de Cuotas (apertura y cierre)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const btnVerCuotas = page.locator('[data-testid^="btn-ver-cuotas-"]').first();
    if (await btnVerCuotas.isVisible()) {
      await btnVerCuotas.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[data-testid="modal-cuotas"]');
      await expect(modal).toBeVisible();
      await expect(page.locator('[data-testid="modal-cuotas-title"]')).toContainText('Cronograma');
      await expect(page.locator('[data-testid="tabla-cuotas-detalle"]')).toBeVisible();

      // Cerrar modal
      await page.locator('[data-testid="btn-cerrar-modal-cuotas"]').click();
      await page.waitForTimeout(300);
      await expect(modal).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  test('17.7 Ciclo de vida del modal de Nuevo Contrato Diferido (apertura, inputs y cancelación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-nuevo-diferido"]').click();
    await page.waitForTimeout(300);

    const modal = page.locator('[data-testid="modal-nuevo-diferido"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="modal-nuevo-title"]')).toContainText('Nuevo Contrato');

    // Interactuar con los inputs
    const inputConcepto = page.locator('[data-testid="input-nuevo-concepto"]');
    await inputConcepto.fill('Contrato Educativo Año 2026 - Grado 9°');

    const inputValor = page.locator('[data-testid="input-nuevo-valor"]');
    await inputValor.fill('11500000');

    // Cancelar modal
    await page.locator('[data-testid="btn-cancelar-nuevo-diferido"]').click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.8 Ejecución de Amortización Mensual con generación de comprobante de diario', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const btnAmortizar = page.locator('[data-testid="btn-amortizar-mes"]');
    await expect(btnAmortizar).toBeVisible();
    await btnAmortizar.click();
    await page.waitForTimeout(1000);

    // Verificar alerta de éxito con comprobante
    const alerta = page.locator('[data-testid="alerta-exito-diferidos"]');
    await expect(alerta).toBeVisible({ timeout: 10000 });
    await expect(alerta).toContainText('Amortización');

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 1 — Suite 3: Nómina Contable Docente NIC 19 & Provisiones', () => {
  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026 AND mes <= 12;");
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-nomina"]').click();
    await page.waitForTimeout(300);
  });

  test('17.9 Renderizado de KPIs cuantitativos de Nómina y Provisiones Sociales', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="kpi-total-devengado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-deducciones"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-neto-pagar"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-provisiones"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.10 Verificación de Partida Doble en tabla de Causación Mensual (5105 / 2370 / 2380 / 2505)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="titulo-tabla-causacion"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-lineas-causacion"]')).toBeVisible();

    // Validar sumas iguales en el pie de tabla
    const debito = page.locator('[data-testid="total-debito-causacion"]');
    const credito = page.locator('[data-testid="total-credito-causacion"]');
    await expect(debito).toBeVisible();
    await expect(credito).toBeVisible();

    // El total debito debe ser idéntico al credito
    const debitoTexto = await debito.innerText();
    const creditoTexto = await credito.innerText();
    expect(debitoTexto).toEqual(creditoTexto);

    sniffer.assertZeroErrors();
  });

  test('17.11 Verificación de tabla de Provisiones de Prestaciones Sociales NIC 19', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="titulo-tabla-provisiones"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-lineas-provisiones"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-provisiones-nic19"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.12 Ejecución de acciones de Nómina: Cargar, Causar, Provisionar y Dispersar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    // 1. Cargar / Actualizar
    await page.locator('[data-testid="btn-cargar-nomina"]').click();
    await page.waitForTimeout(500);

    // 2. Calcular Provisiones NIC 19
    const btnProv = page.locator('[data-testid="btn-provisionar-nomina"]');
    await expect(btnProv).toBeVisible();
    await btnProv.click();
    await page.waitForTimeout(1000);

    const alertaProv = page.locator('[data-testid="alerta-exito-nomina"]');
    await expect(alertaProv).toBeVisible({ timeout: 10000 });
    await expect(alertaProv).toContainText('Provisiones NIC 19');

    // Cerrar alerta antes del siguiente clic
    const btnCerrarAlerta = alertaProv.locator('button');
    if (await btnCerrarAlerta.isVisible()) {
      await btnCerrarAlerta.click();
      await page.waitForTimeout(300);
    }

    // 3. Dispersar Pagos (EGR)
    const btnDisp = page.locator('[data-testid="btn-dispersar-nomina"]');
    await expect(btnDisp).toBeVisible();
    await btnDisp.click();
    await page.waitForTimeout(1000);

    const alertaDisp = page.locator('[data-testid="alerta-exito-nomina"]');
    await expect(alertaDisp).toBeVisible({ timeout: 10000 });
    await expect(alertaDisp).toContainText('Dispersión bancaria');

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 1 — Suite 4: Asistente de Cierre Anual Periodo 13 y Apertura APE', () => {
  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026;");
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-periodos"]').click();
    await page.waitForTimeout(300);
  });

  test('17.13 Botón de Cierre Periodo 13 es visible y abre el modal wizard', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const btnCierre = page.locator('[data-testid="btn-cierre-periodo13"]');
    await expect(btnCierre).toBeVisible();
    await btnCierre.click();
    await page.waitForTimeout(300);

    const modal = page.locator('[data-testid="modal-cierre-anual"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="modal-cierre-title"]')).toContainText('Cierre Anual');
    await expect(page.locator('[data-testid="wizard-steps"]')).toBeVisible();

    // Cancelar modal
    await page.locator('[data-testid="btn-cancelar-modal-cierre"]').click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.14 Ciclo guiado del Wizard: Simulación -> Asiento CIER -> Apertura APE -> Finalizar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-cierre-periodo13"]').click();
    await page.waitForTimeout(300);

    // Paso 1: Simulación y Balance Previo
    await expect(page.locator('[data-testid="paso-1-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="sim-clase4"]')).toBeVisible();
    await expect(page.locator('[data-testid="sim-clase5"]')).toBeVisible();
    await expect(page.locator('[data-testid="sim-excedente"]')).toBeVisible();
    await expect(page.locator('[data-testid="sim-cuenta-destino"]')).toHaveText(/370505|371005/);

    // Avanzar a Paso 2
    await page.locator('[data-testid="btn-paso2-cierre"]').click();
    await page.waitForTimeout(300);

    // Paso 2: Ejecutar Asiento de Cierre CIER
    await expect(page.locator('[data-testid="paso-2-container"]')).toBeVisible();
    const btnEjecutarCier = page.locator('[data-testid="btn-ejecutar-cierre-oficial"]');
    await expect(btnEjecutarCier).toBeVisible();
    await btnEjecutarCier.click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-testid="cierre-exito-box"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="cierre-exito-box"]')).toContainText('CIER');

    // Avanzar a Paso 3
    const btnPaso3 = page.locator('[data-testid="btn-paso3-apertura"]');
    await expect(btnPaso3).toBeEnabled();
    await btnPaso3.click();
    await page.waitForTimeout(300);

    // Paso 3: Generar Comprobante APE
    await expect(page.locator('[data-testid="paso-3-container"]')).toBeVisible();
    const btnEjecutarApe = page.locator('[data-testid="btn-ejecutar-apertura"]');
    await expect(btnEjecutarApe).toBeVisible();
    await btnEjecutarApe.click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-testid="apertura-exito-box"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="apertura-exito-box"]')).toContainText('APE');

    // Finalizar Asistente
    await page.locator('[data-testid="btn-finalizar-cierre"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="modal-cierre-anual"]')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 1 — Suite 5: Persistencia e Integridad en PostgreSQL QA', () => {
  test('17.15 Asientos contables persistidos cumplen constraint chk_asiento_cuadrado sin registros huérfanos', async () => {
    // 1. Verificar que no haya ningún asiento con diferencia distinta de 0
    const descuadrados = await queryDb(
      `SELECT id, tipo_comprobante, consecutivo, total_debito, total_credito, diferencia
       FROM cont_asientos
       WHERE ROUND(diferencia, 2) != 0.00
          OR ROUND(total_debito, 2) != ROUND(total_credito, 2);`
    );
    expect(descuadrados.length, 'No deben existir asientos descuadrados en PostgreSQL').toBe(0);

    // 2. Verificar existencia de los tipos de comprobante de la Fase 1
    const tipos = await queryDb(
      `SELECT DISTINCT tipo_comprobante
       FROM cont_asientos
       WHERE tipo_comprobante IN ('CAU', 'CIER', 'APE');`
    );
    expect(tipos.length).toBeGreaterThanOrEqual(1);

    // 3. Verificar que las líneas de comprobantes tengan cuenta_id válido
    const lineasSinCuenta = await queryDb(
      `SELECT id, asiento_id
       FROM cont_asiento_lineas
       WHERE cuenta_id IS NULL;`
    );
    expect(lineasSinCuenta.length, 'Todas las líneas contables deben referenciar una cuenta PUC válida').toBe(0);
  });
});
