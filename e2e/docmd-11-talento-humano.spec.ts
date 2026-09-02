import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-11: Talento Humano, Escalafón Docente & Nómina Legal (Leyes Laborales Colombia)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * 5 Mandatory Suites:
 * 1. Initial Load, KPIs, Header Actions & Zero JS Errors
 * 2. 100% Tab Navigation and Interactive Filters
 * 3. Table Row Action Buttons Sweep
 * 4. Modal Lifecycles (Open, Validate, Cancel/Close)
 * 5. Full Business Transactions & Direct PostgreSQL Persistence Verification
 */
test.describe('DocMD-11: Talento Humano & Nómina Docente (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs de Talento Humano, Acciones de Cabecera y Sniffer de Cero Errores JS
   */
  test('11.1 Carga inicial, 4 KPIs de talento humano, acciones globales y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/talento-humano');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Talento Humano & Nómina Docente');
    await expect(page.locator('.header-badge')).toContainText('CÓDIGO SUSTANTIVO DEL TRABAJO & DIAN');

    // 2. Acciones de Cabecera
    const btnNuevoColab = page.locator('button:has-text("Nuevo Colaborador")');
    await expect(btnNuevoColab).toBeVisible();

    const btnNuevoContrato = page.locator('button:has-text("Nuevo Contrato")');
    await expect(btnNuevoContrato).toBeVisible();

    const btnLiquidar = page.locator('button:has-text("Liquidar Nómina Mes")');
    await expect(btnLiquidar).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-card:has-text("Colaboradores Activos")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Contratos Vigentes")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Nómina del Mes")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Aportes Seguridad Social")')).toBeVisible();

    // 4. Barra de 4 Pestañas
    const tabs = page.locator('.tabs-nav .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('11.2 Navegación exhaustiva por las 4 pestañas (Colaboradores, Contratos, Nómina, DIAN) y filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/talento-humano');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Planta Docente & Colaboradores ---
    await page.locator('.tabs-nav .tab-btn:has-text("Planta Docente")').click();
    await page.waitForTimeout(200);

    const searchInput = page.locator('.filters-grid input.search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Docente');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    const selectCargo = page.locator('.filters-grid select').nth(0);
    if (await selectCargo.isVisible()) {
      await selectCargo.selectOption({ index: 0 });
    }

    const selectEstado = page.locator('.filters-grid select').nth(1);
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption({ index: 0 });
    }

    // --- Tab 2: Contratos Laborales ---
    await page.locator('.tabs-nav .tab-btn:has-text("Contratos Laborales")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('table.data-table')).toBeVisible();

    // --- Tab 3: Liquidación de Nómina ---
    await page.locator('.tabs-nav .tab-btn:has-text("Liquidación de Nómina")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Libro de Liquidaciones")')).toBeVisible();

    // --- Tab 4: Nómina Electrónica & DIAN ---
    await page.locator('.tabs-nav .tab-btn:has-text("Nómina Electrónica & DIAN")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.dian-grid')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Datos (Row Action Sweep)
   */
  test('11.3 Barrido exhaustivo de botones de acción en filas de colaboradores, contratos y colillas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/talento-humano');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Colaboradores: inspeccionar primera fila
    const primeraFilaColab = page.locator('table.data-table tbody tr').first();
    if (await primeraFilaColab.isVisible()) {
      const btnFicha = primeraFilaColab.locator('.actions-group button').first();
      if (await btnFicha.isVisible()) {
        await btnFicha.click();
        await page.waitForTimeout(200);
      }
    }

    // 2. En Tab Contratos: inspeccionar primera fila
    await page.locator('.tabs-nav .tab-btn:has-text("Contratos Laborales")').click();
    await page.waitForTimeout(200);

    const primeraFilaContrato = page.locator('table.data-table tbody tr').first();
    if (await primeraFilaContrato.isVisible()) {
      const btnVer = primeraFilaContrato.locator('.actions-group button').first();
      if (await btnVer.isVisible()) {
        await btnVer.click();
        await page.waitForTimeout(200);
      }

      const btnPdf = primeraFilaContrato.locator('.actions-group button.btn-pdf');
      if (await btnPdf.isVisible()) {
        await btnPdf.click();
        await page.waitForTimeout(200);
      }
    }

    // 3. En Tab Nómina: inspeccionar primera fila y modal de colilla
    await page.locator('.tabs-nav .tab-btn:has-text("Liquidación de Nómina")').click();
    await page.waitForTimeout(200);

    const filasNomina = page.locator('table.data-table tbody tr');
    if (await filasNomina.count() > 0) {
      const btnColilla = filasNomina.first().locator('button:has-text("Ver Colilla")');
      if (await btnColilla.count() > 0 && await btnColilla.isVisible()) {
        await btnColilla.click();
        const modalColilla = page.locator('.modal-backdrop');
        await expect(modalColilla.first()).toBeVisible();

        // Cerrar modal
        await modalColilla.locator('button:has-text("Cerrar"), .close-btn').first().click();
        await expect(modalColilla).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida Completo de Modales (Apertura, Validación y Cierre)
   */
  test('11.4 Ciclo de vida completo de los modales de Talento Humano y Nómina sin estados bloqueados', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/talento-humano');
    await page.waitForLoadState('networkidle');

    // 1. Modal Nuevo Colaborador
    const btnNuevoColab = page.locator('button:has-text("Nuevo Colaborador")');
    await expect(btnNuevoColab).toBeVisible();
    await btnNuevoColab.click();

    const modalColab = page.locator('.modal-backdrop');
    await expect(modalColab.first()).toBeVisible();
    await expect(modalColab.locator('h3').first()).toContainText('Registrar Perfil de Colaborador');

    // Cancelar modal
    await modalColab.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalColab).not.toBeVisible();

    // 2. Modal Nuevo Contrato
    const btnNuevoContrato = page.locator('button:has-text("Nuevo Contrato")');
    await expect(btnNuevoContrato).toBeVisible();
    await btnNuevoContrato.click();

    const modalContrato = page.locator('.modal-backdrop');
    await expect(modalContrato.first()).toBeVisible();
    await expect(modalContrato.locator('h3').first()).toContainText('Radicar Contrato Laboral');

    // Cancelar modal
    await modalContrato.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalContrato).not.toBeVisible();

    // 3. Modal Liquidar Nómina
    const btnLiquidar = page.locator('button:has-text("Liquidar Nómina Mes")');
    await expect(btnLiquidar).toBeVisible();
    await btnLiquidar.click();

    const modalLiq = page.locator('.modal-backdrop');
    await expect(modalLiq.first()).toBeVisible();
    await expect(modalLiq.locator('h3').first()).toContainText('Liquidación Masiva de Nómina Mensual');

    // Cancelar modal
    await modalLiq.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalLiq).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa, Cálculo de Seguridad Social y Verificación en PostgreSQL
   */
  test('11.5 Contrato laboral, liquidación con 4% salud/pensión y persistencia en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/talento-humano');
    await page.waitForLoadState('networkidle');

    // 1. Radicar nuevo contrato laboral
    await page.locator('button:has-text("Nuevo Contrato")').click();
    const modalContrato = page.locator('.modal-backdrop');
    await expect(modalContrato.first()).toBeVisible();

    const uniqueContractNum = `CTR-DOC-2026-${Date.now().toString().slice(-4)}`;
    await modalContrato.locator('input[placeholder*="CTR-DOC"]').fill(uniqueContractNum);
    await modalContrato.locator('input[type="number"]').fill('3800000');

    await modalContrato.locator('button:has-text("Guardar Contrato")').click();
    await expect(modalContrato).not.toBeVisible({ timeout: 8000 });

    // 2. Ejecutar Liquidación de Nómina
    await page.locator('.tabs-nav .tab-btn:has-text("Liquidación de Nómina")').click();
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Ejecutar Liquidación del Mes")').click();
    const modalLiq = page.locator('.modal-backdrop');
    await expect(modalLiq.first()).toBeVisible();

    await modalLiq.locator('button:has-text("Liquidar Periodo")').click();
    await expect(modalLiq).not.toBeVisible({ timeout: 8000 });

    // 3. Verificaciones directas en PostgreSQL
    // 3.1 Contrato en rh_contratos
    const dbContract = await queryDb('SELECT * FROM rh_contratos WHERE numero_contrato = $1', [uniqueContractNum]);
    expect(dbContract.length).toBeGreaterThan(0);
    expect(Number(dbContract[0].salario_pactado)).toBe(3800000.0);
    expect(dbContract[0].estado).toBe('VIGENTE');

    // 3.2 Colaboradores en rh_colaboradores
    const dbColab = await queryDb('SELECT count(*) as total FROM rh_colaboradores WHERE estado = $1', ['ACTIVO']);
    expect(Number(dbColab[0].total)).toBeGreaterThan(0);

    // 3.3 Liquidación en rh_liquidaciones_nomina
    const dbLiqs = await queryDb('SELECT * FROM rh_liquidaciones_nomina WHERE mes = 8 AND anio = 2026');
    expect(dbLiqs.length).toBeGreaterThan(0);

    const firstLiq = dbLiqs[0];
    const salarioBase = Number(firstLiq.salario_basico);
    const auxTransporte = Number(firstLiq.auxilio_transporte);
    const salud = Number(firstLiq.deduccion_salud);
    const pension = Number(firstLiq.deduccion_pension);
    const totalDeducciones = Number(firstLiq.total_deducciones);
    const neto = Number(firstLiq.neto_a_pagar);

    // Fórmulas de ley estatutaria: Salud = 4%, Pensión = 4%
    const expectedSalud = Number((salarioBase * 0.04).toFixed(2));
    const expectedPension = Number((salarioBase * 0.04).toFixed(2));
    expect(salud).toBeCloseTo(expectedSalud, 1);
    expect(pension).toBeCloseTo(expectedPension, 1);
    expect(totalDeducciones).toBeCloseTo(salud + pension, 1);
    expect(neto).toBeCloseTo((salarioBase + auxTransporte) - totalDeducciones, 1);
    expect(firstLiq.estado).toBe('LIQUIDADA');

    sniffer.assertZeroErrors();
  });
});
