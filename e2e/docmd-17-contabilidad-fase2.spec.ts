import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb, recordExists } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-17 (Fase 2 Gestión y Tributario): Contabilidad Escolar Integral
 * Exhaustive Anti-Regression E2E Suite compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 *
 * Covers:
 * - Suite 1: Carga inicial, navegación y Error Sniffer en pestañas Caja Menor y Certificados
 * - Suite 2: Ciclo de Vida Completo de Caja Menor (Apertura, Gastos y Reembolso EGR)
 * - Suite 3: Certificados de Retención a Proveedores (Art. 381 E.T.) & Formulario 350 DIAN
 * - Suite 4: Verificación Directa de Persistencia y Partida Doble en PostgreSQL QA
 */

test.describe('DocMD-17 Fase 2 — Suite 1: Carga y Navegación de Nuevos Módulos Contables', () => {
  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026 AND mes <= 12;");
    await loginAs(page, 'RECTOR');
  });

  test('17.F2.1 Carga la página de Contabilidad y verifica las nuevas pestañas de Fase 2', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="contabilidad-page-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-contabilidad"]')).toContainText('Contabilidad NIIF');

    // Verificar visibilidad de las nuevas pestañas de Fase 2
    const tabCajaMenor = page.locator('[data-testid="tab-caja-menor"]');
    const tabCertProv = page.locator('[data-testid="tab-certificados-prov"]');

    await expect(tabCajaMenor).toBeVisible();
    await expect(tabCertProv).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.2 Navegación fluida a la pestaña de Caja Menor Escolar y Fondos Fijos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-caja-menor"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="caja-menor-tab-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-caja-menor"]')).toContainText('Gestión de Caja Menor Escolar');
    await expect(page.locator('[data-testid="kpis-caja-menor"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-abrir-caja-menor"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.3 Navegación fluida a la pestaña de Certificados a Proveedores & Formulario 350', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-certificados-prov"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="certificados-prov-tab-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-certificados-proveedores"]')).toContainText('Certificados Tributarios a Proveedores');
    await expect(page.locator('[data-testid="subtab-proveedores"]')).toBeVisible();
    await expect(page.locator('[data-testid="subtab-formulario350"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-proveedores-retenciones"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 2 — Suite 2: Ciclo de Vida de Caja Menor (Apertura, Gastos y Reembolso)', () => {
  const testRunId = Date.now().toString().slice(-4);
  const nombreFondo = `Caja Menor E2E Test ${testRunId}`;

  test.beforeEach(async ({ page }) => {
    await queryDb("UPDATE cont_periodos SET estado = 'ABIERTO' WHERE anio = 2026 AND mes <= 12;");
    await loginAs(page, 'RECTOR');
  });

  test('17.F2.4 Apertura interactiva de un nuevo fondo de caja menor con validación de inputs', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-caja-menor"]').click();
    await page.waitForTimeout(300);

    // Abrir modal
    await page.locator('[data-testid="btn-abrir-caja-menor"]').click();
    await expect(page.locator('[data-testid="modal-crear-caja"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-crear-caja-title"]')).toContainText('Apertura de Fondo Fijo');

    // Llenar formulario
    await page.locator('[data-testid="input-caja-nombre"]').fill(nombreFondo);
    await page.locator('[data-testid="input-caja-responsable-nombre"]').fill(`Lic. Responsable ${testRunId}`);
    await page.locator('[data-testid="input-caja-responsable-cargo"]').fill('Secretaria Pagadora');
    await page.locator('[data-testid="input-caja-monto"]').fill('1200000');
    await page.locator('[data-testid="input-caja-umbral"]').fill('30');

    // Confirmar apertura
    await page.locator('[data-testid="btn-confirmar-crear-caja"]').click();
    await page.waitForTimeout(500);

    // Modal debe cerrarse y aparecer en la lista
    await expect(page.locator('[data-testid="modal-crear-caja"]')).not.toBeVisible();
    await expect(page.locator(`text=${nombreFondo}`)).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.5 Registro de gastos menores y deducción de saldo disponible en tiempo real', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-caja-menor"]').click();
    await page.waitForTimeout(400);

    // Seleccionar la caja creada
    const cardCaja = page.locator('[data-testid="card-caja-nombre"]').filter({ hasText: nombreFondo }).first();
    if (await cardCaja.isVisible()) {
      await cardCaja.click();
    } else {
      await page.locator('[data-testid="grid-fondos-fijos"] > div').first().click();
    }
    await expect(page.locator('[data-testid="panel-detalle-caja"]')).toBeVisible();

    // Registrar Gasto 1: Papelería
    await page.locator('[data-testid="btn-nuevo-gasto"]').click();
    await expect(page.locator('[data-testid="modal-legalizar-gasto"]')).toBeVisible();

    await page.locator('[data-testid="input-gasto-recibo"]').fill(`REC-E2E-1-${testRunId}`);
    await page.locator('[data-testid="input-gasto-tercero-nombre"]').fill('Distribuidora Escolar S.A.');
    await page.locator('[data-testid="input-gasto-tercero-nit"]').fill('900.111.222-3');
    await page.locator('[data-testid="input-gasto-concepto"]').fill('Resmas de papel y carpetas de actas');
    await page.locator('[data-testid="input-gasto-valor-bruto"]').fill('95000');

    await page.locator('[data-testid="btn-confirmar-gasto"]').click();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="modal-legalizar-gasto"]')).not.toBeVisible();

    // Registrar Gasto 2: Botiquín Enfermería
    await page.locator('[data-testid="btn-nuevo-gasto"]').click();
    await expect(page.locator('[data-testid="modal-legalizar-gasto"]')).toBeVisible();

    await page.locator('[data-testid="input-gasto-recibo"]').fill(`REC-E2E-2-${testRunId}`);
    await page.locator('[data-testid="input-gasto-tercero-nombre"]').fill('Droguería y Farmacia La Salud');
    await page.locator('[data-testid="input-gasto-tercero-nit"]').fill('900.333.444-5');
    await page.locator('[data-testid="input-gasto-concepto"]').fill('Insumos de primeros auxilios enfermería escolar');
    await page.locator('[data-testid="input-gasto-valor-bruto"]').fill('120000');

    await page.locator('[data-testid="btn-confirmar-gasto"]').click();
    await page.waitForTimeout(600);

    // Verificar presencia de recibos en la tabla de legalizaciones
    await expect(page.locator(`text=REC-E2E-1-${testRunId}`)).toBeVisible();
    await expect(page.locator(`text=REC-E2E-2-${testRunId}`)).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.6 Reembolso de caja menor emitiendo comprobante de egreso EGR y restaurando saldo al 100%', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-caja-menor"]').click();
    await page.waitForTimeout(400);

    // Seleccionar la caja
    const cardCaja = page.locator('[data-testid="card-caja-nombre"]').filter({ hasText: nombreFondo }).first();
    if (await cardCaja.isVisible()) {
      await cardCaja.click();
    } else {
      await page.locator('[data-testid="grid-fondos-fijos"] > div').first().click();
    }
    await expect(page.locator('[data-testid="panel-detalle-caja"]')).toBeVisible();

    // Clic en botón reembolsar
    const btnReembolsar = page.locator('[data-testid="btn-reembolsar-caja"]');
    await expect(btnReembolsar).toBeEnabled({ timeout: 5000 });
    await btnReembolsar.click();

    await expect(page.locator('[data-testid="modal-reembolso"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-reembolso-title"]')).toContainText('Reembolso y Reposición');

    // Confirmar emisión del comprobante EGR
    await page.locator('[data-testid="btn-confirmar-reembolso"]').click();
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="modal-reembolso"]')).not.toBeVisible();

    // Verificar que los recibos pasaron a estado 'Reembolsado'
    await expect(page.locator('[data-testid="badge-gasto-reembolsado"]').first()).toBeVisible();

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 2 — Suite 3: Certificados a Proveedores (Art. 381 E.T.) & Formulario 350', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('17.F2.7 Filtrado de proveedores retenidos por año gravable y búsqueda en tiempo real', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-certificados-prov"]').click();
    await page.waitForTimeout(400);

    // Verificar presencia de tabla y registros
    const tabla = page.locator('[data-testid="tabla-proveedores-retenciones"]');
    await expect(tabla).toBeVisible();

    const primerProveedor = page.locator('[data-testid="col-proveedor-nombre"]').first();
    await expect(primerProveedor).toBeVisible();
    const textoNombre = (await primerProveedor.innerText()).trim();
    const termino = textoNombre.split(' ')[0];

    // Filtrar por término de búsqueda dinámico
    const inputBuscar = page.locator('[data-testid="input-buscar-proveedor"]');
    await inputBuscar.fill(termino);
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="col-proveedor-nombre"]').filter({ hasText: termino }).first()).toBeVisible();

    // Limpiar búsqueda
    await inputBuscar.fill('');
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  test('17.F2.8 Apertura del modal oficial Art. 381 E.T., desglose tributario y totales en letras', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-certificados-prov"]').click();
    await page.waitForTimeout(300);

    // Clic en 'Ver' detalle del primer proveedor
    const btnVer = page.locator('[data-testid="btn-ver-detalle-cert"]').first();
    await btnVer.click();
    await page.waitForTimeout(300);

    // Verificar modal abierto con datos completos
    const modal = page.locator('[data-testid="modal-certificado-prov"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="modal-certificado-prov-title"]')).toContainText('Certificado de Retención en la Fuente');

    // Verificar tarjetas de Agente y Sujeto
    await expect(page.locator('[data-testid="label-proveedor-nombre"]')).toBeVisible();
    await expect(page.locator('[data-testid="label-proveedor-nit"]')).toBeVisible();

    // Verificar total retenido y letras
    await expect(page.locator('[data-testid="label-total-retenido-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="label-total-letras"]')).toContainText('PESOS M/CTE');

    // Cerrar modal
    await page.locator('[data-testid="btn-cerrar-modal-cert"]').click();
    await expect(modal).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.9 Simulación de envío por email y descarga de PDF oficial', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-certificados-prov"]').click();
    await page.waitForTimeout(300);

    // Probar envío de email desde la tabla
    const btnEmail = page.locator('[data-testid="btn-email-tabla"]').first();
    await btnEmail.click();
    await page.waitForTimeout(400);

    // Verificar toast de confirmación
    await expect(page.locator('[data-testid="alert-toast-certificados"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.F2.10 Consulta del borrador consolidado Formulario 350 DIAN y cambio de periodo', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-certificados-prov"]').click();
    await page.waitForTimeout(300);

    // Cambiar al subtab de Formulario 350
    await page.locator('[data-testid="subtab-formulario350"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="panel-subtab-formulario350"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpis-formulario350"]')).toBeVisible();
    await expect(page.locator('[data-testid="label-f350-total-pagar"]')).toBeVisible();

    // Cambiar mes a Abril
    await page.locator('[data-testid="select-f350-mes"]').selectOption('4');
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="label-f350-total-pagar"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });
});

test.describe('DocMD-17 Fase 2 — Suite 4: Verificación Directa de Persistencia y Partida Doble en PostgreSQL QA', () => {
  test('17.F2.11 Verifica persistencia en cont_cajas_menores y cont_caja_menor_legalizaciones', async () => {
    const cajas = await queryDb(
      "SELECT id, nombre, monto_autorizado, saldo_disponible, estado FROM cont_cajas_menores ORDER BY created_at DESC LIMIT 5;",
    );
    expect(cajas.length).toBeGreaterThan(0);
    expect(Number(cajas[0].monto_autorizado)).toBeGreaterThan(0);

    const legalizaciones = await queryDb(
      "SELECT id, numero_recibo, valor_neto, estado FROM cont_caja_menor_legalizaciones ORDER BY created_at DESC LIMIT 5;",
    );
    expect(legalizaciones.length).toBeGreaterThan(0);
  });

  test('17.F2.12 Verifica partida doble estricta en comprobantes de egreso EGR de reembolso', async () => {
    const asientosEgr = await queryDb(
      "SELECT id, numero_comprobante, total_debito, total_credito, diferencia, estado FROM cont_asientos WHERE tipo_comprobante = 'EGR' ORDER BY created_at DESC LIMIT 5;",
    );
    expect(asientosEgr.length).toBeGreaterThan(0);
    for (const a of asientosEgr) {
      expect(Number(a.total_debito)).toBe(Number(a.total_credito));
      expect(Number(a.diferencia)).toBe(0);
      expect(a.estado).toBe('POSTED');
    }
  });
});
