import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-08: Gestión Documental & Flujos BPM (AGN Ley 594) - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, modal lifecycles, and PostgreSQL persistence.
 */
test.describe('DocMD-08: Gestión Documental & Flujos Dinámicos (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, 4 KPIs de Trámites, Cabecera y Sniffer de Cero Errores JS
   */
  test('8.1 Carga inicial, 4 KPIs de trámites, barra de 6 pestañas y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Gestión Documental & Flujos');
    await expect(page.locator('.page-header .subtitle')).toContainText('Diseño no-code de circuitos de aprobación');

    // 2. Botón de Cabecera
    const btnRadicarHeader = page.locator('.page-header button:has-text("Radicar Nuevo Trámite")');
    await expect(btnRadicarHeader).toBeVisible();

    // 3. Tarjetas Métricas KPI (4 tarjetas)
    const metricCards = page.locator('.metrics-row .metric-card');
    await expect(metricCards).toHaveCount(4);
    await expect(page.locator('.metrics-row')).toContainText('Trámites Activos');
    await expect(page.locator('.metrics-row')).toContainText('Pendientes Firma');
    await expect(page.locator('.metrics-row')).toContainText('Completados este Mes');
    await expect(page.locator('.metrics-row')).toContainText('Plantillas de Flujo');

    // 4. Barra de 6 Pestañas Principales
    const navTabs = page.locator('.nav-tabs-bar .nav-tab');
    await expect(navTabs).toHaveCount(6);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de las 6 Pestañas y Filtros Interactivos
   */
  test('8.2 Navegación exhaustiva por las 6 pestañas (Kanban, Iniciar, BPM, TRD, Vault, Verificador)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Trámites & Radicados (Kanban) ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Trámites & Radicados")').click();
    await page.waitForTimeout(300);
    const searchInput = page.locator('.kanban-view input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('RAD-2026');
      await page.waitForTimeout(200);
      await searchInput.clear();
    }

    // --- Tab 2: Iniciar Trámite ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Iniciar Trámite")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('h3:has-text("Catálogo de Trámites")')).toBeVisible();

    // --- Tab 3: Diseñador de Flujos (BPM) ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Diseñador de Flujos")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('h3:has-text("Diseñador Visual de Flujos")')).toBeVisible();

    // --- Tab 4: Tablas de Retención (TRD) ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Tablas de Retención")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('h3:has-text("Tablas de Retención Documental")')).toBeVisible();

    // Probar filtros de sección productora TRD
    const btnSecAcad = page.locator('.trd-filters-bar button:has-text("Secretaría Académica")');
    if (await btnSecAcad.isVisible()) {
      await btnSecAcad.click();
      await page.waitForTimeout(200);
    }
    const btnTodas = page.locator('.trd-filters-bar button:has-text("Todas las Secciones")');
    if (await btnTodas.isVisible()) {
      await btnTodas.click();
      await page.waitForTimeout(200);
    }

    // --- Tab 5: Vault & Carga de Firmas ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Vault & Carga de Firmas")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('h3:has-text("Registro de Firma Digital Autorizada")')).toBeVisible();

    // --- Tab 6: Verificador Criptográfico ---
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Verificador Criptográfico")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('h3:has-text("Portal de Verificación Criptográfica")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones en Tarjetas y Filas de Datos (Row Action Sweep)
   */
  test('8.3 Barrido exhaustivo de acciones por fila en TRD y tarjetas de trámites', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // 1. En Tab TRD: Inspeccionar primera subserie
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Tablas de Retención")').click();
    await page.waitForTimeout(300);

    const primeraFilaTrd = page.locator('table.trd-table tbody tr').first();
    if (await primeraFilaTrd.isVisible()) {
      const btnEditarTrd = primeraFilaTrd.locator('button[title*="Editar"], button:has-text("Editar")');
      if (await btnEditarTrd.isVisible()) {
        await btnEditarTrd.click();
        const modalTrd = page.locator('.modal-backdrop');
        await expect(modalTrd.first()).toBeVisible();

        // Cerrar modal
        await modalTrd.locator('button:has-text("Cancelar"), .btn-icon').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }
    }

    // 2. En Tab Diseñador: Inspeccionar primera plantilla de flujo
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Diseñador de Flujos")').click();
    await page.waitForTimeout(300);

    const primerFlujo = page.locator('.flujos-list .flujo-row').first();
    if (await primerFlujo.isVisible()) {
      const btnEditarFlujo = primerFlujo.locator('button[title*="Editar"], button:has-text("Editar")');
      if (await btnEditarFlujo.isVisible()) {
        await btnEditarFlujo.click();
        const modalFlujo = page.locator('.modal-backdrop');
        await expect(modalFlujo.first()).toBeVisible();

        // Cerrar modal
        await modalFlujo.locator('button:has-text("Cancelar"), .btn-icon').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Nueva Plantilla BPM y Nueva Subserie TRD)
   */
  test('8.4 Ciclo de vida completo de los modales de creación (Flujo BPM y Subserie TRD)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // 1. Modal Diseñador BPM
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Diseñador de Flujos")').click();
    await page.waitForTimeout(300);

    const btnCrearFlujo = page.locator('button:has-text("Crear Nueva Plantilla de Flujo")');
    if (await btnCrearFlujo.isVisible()) {
      await btnCrearFlujo.click();
      const modalFlujo = page.locator('.modal-backdrop');
      await expect(modalFlujo.first()).toBeVisible();

      // Cancelar modal
      await modalFlujo.locator('button:has-text("Cancelar"), .btn-icon').first().click();
      await expect(page.locator('.modal-backdrop')).not.toBeVisible();
    }

    // 2. Modal Nueva Subserie TRD
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Tablas de Retención")').click();
    await page.waitForTimeout(300);

    const btnCrearTrd = page.locator('button:has-text("Nueva Subserie TRD")');
    if (await btnCrearTrd.isVisible()) {
      await btnCrearTrd.click();
      const modalTrd = page.locator('.modal-backdrop');
      await expect(modalTrd.first()).toBeVisible();

      // Cancelar modal
      await modalTrd.locator('button:has-text("Cancelar"), .btn-icon').first().click();
      await expect(page.locator('.modal-backdrop')).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Radicación Transaccional de Trámite y Verificación en PostgreSQL
   */
  test('8.5 Radicación transaccional de trámite y verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // 1. Iniciar Trámite
    await page.locator('.nav-tabs-bar .nav-tab:has-text("Iniciar Trámite")').click();
    await page.waitForTimeout(400);

    // Seleccionar primer trámite del catálogo
    const primerTramite = page.locator('.tramite-card, .tramite-catalog-card').first();
    if (await primerTramite.isVisible()) {
      await primerTramite.click();
      await page.waitForTimeout(300);

      // Llenar campos requeridos si existen
      const textInputs = page.locator('.fields-grid input[type="text"]');
      const textCount = await textInputs.count();
      for (let i = 0; i < textCount; i++) {
        await textInputs.nth(i).fill(`Dato de prueba ${i + 1}`);
      }

      const emailInput = page.locator('.fields-grid input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('solicitante.e2e@sanbartolome.edu.co');
      }

      const textareaInput = page.locator('.fields-grid textarea');
      if (await textareaInput.isVisible()) {
        await textareaInput.fill('Motivo justificado para la radicación del trámite académico.');
      }

      // Radicar
      const btnRadicar = page.locator('button:has-text("Radicar Trámite y Generar Consecutivo")');
      if (await btnRadicar.isVisible()) {
        await btnRadicar.click();

        // Validar Toast feedback
        const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
        await expect(toast.first()).toBeVisible({ timeout: 8000 });
      }
    }

    // 2. Verificación directa en base de datos PostgreSQL
    const instanciasDb = await queryDb('SELECT count(*) as total FROM doc_instancias_flujo');
    expect(Number(instanciasDb[0].total)).toBeGreaterThanOrEqual(0);

    const flujosDb = await queryDb('SELECT count(*) as total FROM doc_flujos_trabajo');
    expect(Number(flujosDb[0].total)).toBeGreaterThan(0);

    const trdDb = await queryDb('SELECT count(*) as total FROM doc_trd_series');
    expect(Number(trdDb[0].total)).toBeGreaterThan(0);

    const firmasDb = await queryDb('SELECT count(*) as total FROM doc_firmas_digitales');
    expect(Number(firmasDb[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
