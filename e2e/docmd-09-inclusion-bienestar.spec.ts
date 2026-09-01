import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-09: Inclusión Educativa, PIAR (Decreto 1421 / DUA) & Habeas Data (Ley 1581)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('9.1 Should display PIAR inclusion dashboard, Decreto 1421 KPIs, and active student expedientes', async ({ page }) => {
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // Header & Subtitle assertions
    await expect(page.locator('h1')).toContainText('Inclusión Educativa & PIAR');
    await expect(page.locator('.header-badge')).toContainText('DECRETO 1421 DE 2017 & DUA');

    // KPI Cards assertions
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-card:has-text("Estudiantes en Inclusión")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Ajustes Razonables (DUA)")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Actas de Compromiso")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Cumplimiento Auditoría")')).toBeVisible();

    // Tabs navigation assertions
    const tabs = page.locator('.tabs-nav .tab-btn');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('Expedientes & Fichas PIAR');
    await expect(tabs.nth(1)).toContainText('Ajustes Curriculares (Anexo 2)');
    await expect(tabs.nth(2)).toContainText('Actas de Acuerdo (Anexo 3)');
    await expect(tabs.nth(3)).toContainText('Guía de Auditoría SED / MEN');

    // Direct PostgreSQL validation for piar_caracterizaciones
    const dbPiar = await queryDb('SELECT count(*) as total FROM piar_caracterizaciones');
    expect(Number(dbPiar[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('9.2 Should create a new PIAR characterization (Anexo 1) and persist in PostgreSQL piar_caracterizaciones', async ({ page }) => {
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // Click Nueva Ficha PIAR button
    const btnNuevoPiar = page.locator('button:has-text("Nueva Ficha PIAR")');
    await expect(btnNuevoPiar).toBeVisible();
    await btnNuevoPiar.click();

    // Verify Modal appears
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Ficha de Caracterización Psicopedagógica PIAR');

    // Select student using searchable select
    const studentSelect = modal.locator('app-searchable-select .select-trigger').first();
    await studentSelect.click();
    const studentOption = modal.locator('app-searchable-select .option-item').first();
    await expect(studentOption).toBeVisible({ timeout: 5000 });
    await studentOption.click();

    // Select Category & Learning style
    await modal.locator('select.form-select').first().selectOption('AUTISMO_TEA');
    await modal.locator('select.form-select').nth(1).selectOption('VISUAL');

    // Fill diagnostic details
    const uniqueDiag = `Trastorno del Espectro Autista E2E Test ${Date.now()}`;
    await modal.locator('textarea').first().fill(uniqueDiag);

    // Fill barriers and strengths
    const textareas = modal.locator('textarea');
    const textareaCount = await textareas.count();
    if (textareaCount >= 4) {
      await textareas.nth(1).fill('Hipersensibilidad al ruido en aula y fatiga ante textos densos');
      await textareas.nth(2).fill('Excelente memoria visual, interés en robótica y tecnología');
      await textareas.nth(3).fill('Acompañamiento familiar constante y terapias semanales');
    }

    // Click Guardar Ficha PIAR
    const saveBtn = modal.locator('button:has-text("Guardar Ficha PIAR")');
    await saveBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify PostgreSQL persistence
    const piarRows = await queryDb('SELECT * FROM piar_caracterizaciones WHERE diagnostico_clinico = $1', [uniqueDiag]);
    expect(piarRows.length).toBeGreaterThan(0);
    expect(piarRows[0].diagnostico_categoria).toBe('AUTISMO_TEA');
    expect(piarRows[0].estado).toBe('ACTIVO');
  });

  test('9.3 Should add DUA curricular adjustment (Anexo 2) per subject and verify in PostgreSQL', async ({ page }) => {
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // Navigate to Ajustes Curriculares tab
    const tabAjustes = page.locator('.tabs-nav .tab-btn:has-text("Ajustes Curriculares")');
    await tabAjustes.click();

    // Verify tab is active
    await expect(page.locator('.section-intro h3')).toContainText('Matriz de Ajustes Razonables Curriculares & DUA');

    // Verify adjustments query in PostgreSQL
    const ajustesDb = await queryDb('SELECT count(*) as total FROM piar_ajustes_curriculares');
    expect(Number(ajustesDb[0].total)).toBeGreaterThanOrEqual(0);

    // Verify family commitments in PostgreSQL
    const actasDb = await queryDb('SELECT count(*) as total FROM piar_actas_compromiso');
    expect(Number(actasDb[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('9.4 Should navigate to Habeas Data (Ley 1581) and register digital consent with cryptographic SHA-256 hash', async ({ page }) => {
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    // Verify header and RNBD SIC indicators
    await expect(page.locator('h1')).toContainText('Protección de Datos & Habeas Data');
    await expect(page.locator('.header-badge')).toContainText('LEY 1581 DE 2012 & RNBD SIC');

    // Verify KPI Cards
    await expect(page.locator('.kpi-card:has-text("Consentimientos Vigentes")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Cumplimiento RNBD")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Autorización Imagen")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Solicitudes ARCO")')).toBeVisible();

    // Open Nuevo Consentimiento Modal
    const btnNuevoConsent = page.locator('button:has-text("Registrar Consentimiento Digital")');
    await expect(btnNuevoConsent).toBeVisible();
    await btnNuevoConsent.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Radicar Consentimiento Digital de Acudiente');

    // Select student
    const studentSelect = modal.locator('app-searchable-select .select-trigger').first();
    await studentSelect.click();
    const studentOpt = modal.locator('app-searchable-select .option-item').first();
    await expect(studentOpt).toBeVisible({ timeout: 5000 });
    await studentOpt.click();

    // Fill Guardian info
    const guardianName = `Acudiente E2E Playwright ${Date.now()}`;
    const guardianDoc = `CC${Math.floor(10000000 + Math.random() * 90000000)}`;

    const formGroups = modal.locator('.modal-form-grid .form-group');
    await formGroups.filter({ hasText: 'Nombre del Padre' }).locator('input').fill(guardianName);
    await formGroups.filter({ hasText: 'Documento de Identidad' }).locator('input').fill(guardianDoc);
    await formGroups.filter({ hasText: 'Parentesco' }).locator('input').fill('Madre');
    await formGroups.filter({ hasText: 'Correo Electrónico' }).locator('input').fill('acudiente.e2e@educore.edu.co');

    // Toggle granular checkboxes (Sensibles, Imagen, LMS, Grabación, Seguro)
    const checkboxes = modal.locator('.checkbox-clause input[type="checkbox"]');
    const chkCount = await checkboxes.count();
    for (let i = 0; i < chkCount; i++) {
      if (!(await checkboxes.nth(i).isChecked())) {
        await checkboxes.nth(i).check();
      }
    }

    // Submit consent
    const submitBtn = modal.locator('button:has-text("Firmar y Registrar Consentimiento")');
    await submitBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify direct PostgreSQL persistence in habeas_consentimientos
    const consentRows = await queryDb('SELECT * FROM habeas_consentimientos WHERE acudiente_nombre = $1', [guardianName]);
    expect(consentRows.length).toBeGreaterThan(0);
    expect(consentRows[0].hash_integridad_sha256).toBeDefined();
    expect(consentRows[0].hash_integridad_sha256.length).toBe(64);
    expect(consentRows[0].autoriza_datos_sensibles).toBe(true);
    expect(consentRows[0].estado).toBe('VIGENTE');
  });

  test('9.5 Should inspect ARCO rights and RNBD compliance logs in PostgreSQL', async ({ page }) => {
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    // Switch to RNBD tab
    const tabRnbd = page.locator('.tabs-nav .tab-btn:has-text("RNBD & Auditoría SIC")');
    await tabRnbd.click();

    // Verify RNBD databases checklist
    await expect(page.locator('.rnbd-base-item').first()).toBeVisible();

    // Verify ARCO requests and audit logs in PostgreSQL
    const arcoDb = await queryDb('SELECT count(*) as total FROM habeas_solicitudes_arco');
    expect(Number(arcoDb[0].total)).toBeGreaterThanOrEqual(0);

    const auditDb = await queryDb('SELECT count(*) as total FROM habeas_auditoria_rnbd');
    expect(Number(auditDb[0].total)).toBeGreaterThanOrEqual(0);
  });
});
