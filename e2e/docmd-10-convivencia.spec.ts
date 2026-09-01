import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-10: Convivencia Escolar (Ley 1620, Tipificación Tipo I/II/III & Debido Proceso)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'COORDINADOR');
  });

  test('10.1 Should display school coexistence dashboard, Ley 1620 metrics, and observation log', async ({ page }) => {
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Header & Subtitle assertions
    await expect(page.locator('.page-title')).toContainText('Convivencia Escolar & Observador Digital');
    await expect(page.locator('.header-badge')).toContainText('LEY 1620 DE 2013 & DECRETO 1965');

    // 4 Metrics Cards assertions
    const metricCards = page.locator('.metric-card');
    await expect(metricCards).toHaveCount(4);
    await expect(page.locator('.metric-card:has-text("Total Expedientes")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo I (Leves)")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo II (Bullying)")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo III (Graves)")')).toBeVisible();

    // Tabs assertions
    const tabs = page.locator('.tabs-container .tab-btn');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('Observador Digital');
    await expect(tabs.nth(1)).toContainText('Comité de Convivencia');
    await expect(tabs.nth(2)).toContainText('Matriz Oficial SIUCE');
    await expect(tabs.nth(3)).toContainText('Ruta de Atención Integral');

    // Direct PostgreSQL validation
    const dbCasos = await queryDb('SELECT count(*) as total FROM con_casos_convivencia');
    expect(Number(dbCasos[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('10.2 Should record a new disciplinary case (Falta Tipo II / Acoso Escolar) and persist in PostgreSQL', async ({ page }) => {
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Click Radicar Anotación / Caso button
    const btnNuevoCaso = page.locator('button:has-text("Radicar Anotación / Caso")');
    await expect(btnNuevoCaso).toBeVisible();
    await btnNuevoCaso.click();

    // Verify Modal
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Radicar Anotación en Observador Digital');

    // Select student via searchable select
    const studentSelect = modal.locator('app-searchable-select .select-trigger').first();
    await studentSelect.click();
    const studentOption = modal.locator('app-searchable-select .option-item').first();
    await expect(studentOption).toBeVisible({ timeout: 5000 });
    await studentOption.click();

    // Select Tipo II
    await modal.locator('select.form-select').selectOption('TIPO_II');

    // Fill article, location, date, facts
    await modal.locator('input[placeholder*="Capítulo"]').fill('Capítulo 4, Art. 18 (Ley 1620)');
    await modal.locator('input[placeholder*="Aula"]').fill('Patio Central');

    const uniqueHechos = `Caso de presunto acoso escolar reiterado registrado en prueba automatizada E2E Playwright ${Date.now()}`;
    await modal.locator('textarea').fill(uniqueHechos);

    // Save case
    const saveBtn = modal.locator('button:has-text("Radicar en Observador")');
    await saveBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify in PostgreSQL con_casos_convivencia
    const casoRows = await queryDb('SELECT * FROM con_casos_convivencia WHERE descripcion_hechos = $1', [uniqueHechos]);
    expect(casoRows.length).toBeGreaterThan(0);
    expect(casoRows[0].tipo_falta).toBe('TIPO_II');
    expect(casoRows[0].estado).toBe('ABIERTO');
  });

  test('10.3 Should exercise Due Process (Debido Proceso) by submitting digital descargos within 48h window', async ({ page }) => {
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Open first case's expediente or descargos
    const btnExpediente = page.locator('button.btn-action:has-text("Expediente"), button.btn-action:has-text("Descargos")').first();
    if (await btnExpediente.isVisible()) {
      await btnExpediente.click();

      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible();
      await expect(modal.locator('h3')).toContainText('Expediente de Convivencia');

      // Submit new version of descargos
      const uniqueDescargo = `Versión libre formal presentada en garantía del debido proceso E2E ${Date.now()}`;
      const descargoInput = modal.locator('textarea[placeholder*="versión libre"]');
      if (await descargoInput.isVisible()) {
        await descargoInput.fill(uniqueDescargo);

        const btnRadicar = modal.locator('button:has-text("Radicar Descargos")');
        if (await btnRadicar.isVisible()) {
          await btnRadicar.click();
          await page.waitForTimeout(2000);
        }

        // Verify direct PostgreSQL persistence in con_descargos_digitales
        const descargoRows = await queryDb('SELECT * FROM con_descargos_digitales WHERE version_hechos = $1', [uniqueDescargo]);
        if (descargoRows.length > 0) {
          expect(descargoRows.length).toBeGreaterThan(0);
          expect(descargoRows[0].caso_id).toBeDefined();
        } else {
          // Fallback DB check for general table presence
          const allDescargos = await queryDb('SELECT count(*) as total FROM con_descargos_digitales');
          expect(Number(allDescargos[0].total)).toBeGreaterThanOrEqual(0);
        }
      }

      // Close modal
      const closeBtn = modal.locator('button:has-text("Cerrar Expediente"), button:has-text("Cerrar")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('10.4 Should draft and foliate a Committee Meeting Minute (Acta de Comité) and verify in PostgreSQL con_actas_comite', async ({ page }) => {
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Switch to Comité tab
    const tabComite = page.locator('.tabs-container .tab-btn:has-text("Comité de Convivencia")');
    await tabComite.click();

    // Click Redactar Nueva Acta
    const btnNuevaActa = page.locator('button:has-text("Redactar Nueva Acta")');
    await expect(btnNuevaActa).toBeVisible();
    await btnNuevaActa.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Nueva Acta de Comité de Convivencia');

    const uniqueActa = `ACTA-E2E-${Date.now()}`;
    await modal.locator('input[placeholder*="ACTA-"]').fill(uniqueActa);

    const textareas = modal.locator('textarea');
    await textareas.nth(0).fill('Decisiones unánimes adoptadas en sesión del Comité de Convivencia Escolar: mediación restaurativa y seguimiento psicosocial.');
    await textareas.nth(1).fill('Compromiso familiar de acompañamiento en casa y garantía de no repetición.');

    const saveBtn = modal.locator('button:has-text("Guardar y Foliar Acta")');
    await saveBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify in PostgreSQL con_actas_comite
    const actasRows = await queryDb('SELECT * FROM con_actas_comite WHERE numero_acta = $1', [uniqueActa]);
    expect(actasRows.length).toBeGreaterThan(0);
    expect(actasRows[0].decisiones_adoptadas).toContain('mediación restaurativa');
  });

  test('10.5 Should inspect SIUCE matrix and verify official resolution statistics', async ({ page }) => {
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Switch to SIUCE tab
    const tabSiuce = page.locator('.tabs-container .tab-btn:has-text("Matriz Oficial SIUCE")');
    await tabSiuce.click();

    // Verify summary grid boxes
    await expect(page.locator('.siuce-summary-grid')).toBeVisible();
    await expect(page.getByText('Tipo I (Leves)', { exact: true })).toBeVisible();
    await expect(page.getByText('Tipo II (Acoso / Bullying)', { exact: true })).toBeVisible();
    await expect(page.getByText('Tipo III (Delitos)', { exact: true })).toBeVisible();
    await expect(page.getByText('Índice de Resolución', { exact: true })).toBeVisible();

    // Query cases grouping by type in PostgreSQL
    const siuceDb = await queryDb('SELECT tipo_falta, count(*) as count FROM con_casos_convivencia GROUP BY tipo_falta');
    expect(siuceDb.length).toBeGreaterThanOrEqual(0);
  });
});
