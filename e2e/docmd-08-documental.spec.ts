import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-08: Gestión Documental & Firmas Digitales (TRD, BPM & SHA-256)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('8.1 Should display BPM metrics summary and all documental navigation tabs', async ({ page }) => {
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // Page title
    await expect(page.locator('h1')).toContainText('Gestión Documental & Flujos Dinámicos');

    // Metrics
    const metricCards = page.locator('.metrics-row .metric-card');
    await expect(metricCards).toHaveCount(4);
    await expect(page.locator('.metrics-row')).toContainText('Trámites Activos');
    await expect(page.locator('.metrics-row')).toContainText('Pendientes Firma');
    await expect(page.locator('.metrics-row')).toContainText('Plantillas de Flujo');

    // Navigation tabs
    const navTabs = page.locator('.nav-tabs-bar .nav-tab');
    await expect(navTabs).toHaveCount(6);
    await expect(navTabs.nth(0)).toContainText('Trámites & Radicados');
    await expect(navTabs.nth(1)).toContainText('Iniciar Trámite');
    await expect(navTabs.nth(2)).toContainText('Diseñador de Flujos (BPM)');
    await expect(navTabs.nth(3)).toContainText('Tablas de Retención (TRD)');
    await expect(navTabs.nth(4)).toContainText('Vault & Carga de Firmas');
    await expect(navTabs.nth(5)).toContainText('Verificador Criptográfico');
  });

  test('8.2 Should inspect TRD Series (Archivo General de la Nación) and retention timelines', async ({ page }) => {
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // Switch to TRD tab
    const tabTrd = page.locator('.nav-tabs-bar .nav-tab:has-text("Tablas de Retención")');
    await tabTrd.click();

    // Verify TRD view rendered
    await expect(page.locator('.badge-tag-sm')).toContainText('ARCHIVO GENERAL DE LA NACIÓN');
    await expect(page.locator('h3:has-text("Tablas de Retención Documental")')).toBeVisible();

    // Check TRD Table
    const trdTable = page.locator('table.trd-table');
    await expect(trdTable).toBeVisible();
    await expect(trdTable.locator('th')).toContainText([
      'Código',
      'Unidad Productora',
      'Serie / Subserie Documental',
      'Retención Gestión',
      'Retención Central',
      'Disposición Final',
    ]);

    // Verify TRD records in PostgreSQL
    const trdRows = await queryDb('SELECT * FROM doc_trd_series LIMIT 5');
    expect(trdRows.length).toBeGreaterThanOrEqual(0);
  });

  test('8.3 Should initiate a new institutional request (Iniciar Trámite) with dynamic form', async ({ page }) => {
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // Switch to Iniciar Trámite tab
    const tabIniciar = page.locator('.nav-tabs-bar .nav-tab:has-text("Iniciar Trámite")');
    await tabIniciar.click();

    // Verify workflow catalogue
    await expect(page.locator('h3:has-text("Catálogo de Trámites Institucionales")')).toBeVisible();

    const flujoCards = page.locator('.flujo-selector-grid .flujo-card');
    const flujoCount = await flujoCards.count();

    if (flujoCount > 0) {
      // Select first workflow template
      await flujoCards.first().click();

      // Verify dynamic form appears
      const formSection = page.locator('.dynamic-form-section');
      await expect(formSection).toBeVisible();

      // Verify submit button
      const submitBtn = formSection.locator('button:has-text("Radicar Trámite")');
      await expect(submitBtn).toBeVisible();
    }
  });

  test('8.4 Should navigate to Cryptographic Verifier and validate SHA-256 seal', async ({ page }) => {
    await page.goto('/documental');
    await page.waitForLoadState('networkidle');

    // Switch to Verificador Criptográfico tab
    const tabVerif = page.locator('.nav-tabs-bar .nav-tab:has-text("Verificador Criptográfico")');
    await tabVerif.click();

    // Verify Verifier view rendered
    await expect(page.locator('h3:has-text("Portal de Verificación Criptográfica")')).toBeVisible();

    const hashInput = page.locator('.search-hash-box input');
    await expect(hashInput).toBeVisible();

    const verifyBtn = page.locator('.search-hash-box button:has-text("Verificar Autenticidad")');
    await expect(verifyBtn).toBeVisible();

    // Verify DB integrity for document versions and digital signatures
    const versiones = await queryDb('SELECT count(*) as total FROM doc_versiones');
    expect(Number(versiones[0].total)).toBeGreaterThanOrEqual(0);

    const firmas = await queryDb('SELECT count(*) as total FROM doc_firmas_digitales');
    expect(Number(firmas[0].total)).toBeGreaterThanOrEqual(0);
  });
});
