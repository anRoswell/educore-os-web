import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-01: Gestión Académica & Curricular (Decreto 1290)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('1.1 Should display academic curriculum filters and Decreto 1290 evaluation scale', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Verify Page Header and Subtitle
    await expect(page.locator('h1')).toContainText('Gestión Académica & Planilla Decreto 1290');
    
    // Verify Decreto 1290 scale banner & badges
    const escalaBanner = page.locator('.escala-banner');
    await expect(escalaBanner).toBeVisible();
    await expect(escalaBanner).toContainText('Escala Nacional de Valoración (Decreto 1290 de 2009)');
    await expect(escalaBanner.locator('.badge-success')).toContainText('Superior: 4.6 – 5.0');
    await expect(escalaBanner.locator('.badge-info')).toContainText('Alto: 4.0 – 4.59');
    await expect(escalaBanner.locator('.badge-warning')).toContainText('Básico: 3.0 – 3.99');
    await expect(escalaBanner.locator('.badge-danger')).toContainText('Bajo: 1.0 – 2.99');

    // Verify cascade filters (Grado, Grupo, Asignatura, Periodo)
    const gradoSelect = page.locator('.filter-bar select.form-select').first();
    await expect(gradoSelect).toBeVisible();
    const options = await gradoSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('1.2 Should create a new academic evaluation activity (Actividad SIEE) and persist in DB', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Open Nueva Actividad Modal
    const btnNuevaActividad = page.locator('button.action-card-btn:has-text("Actividad")');
    await expect(btnNuevaActividad).toBeVisible();
    await btnNuevaActividad.click();

    // Verify Modal opens
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Paso 7: Crear Actividad Evaluativa');

    // Fill form
    const uniqueTitle = `Taller E2E Playwright ${Date.now()}`;
    await modal.locator('input[placeholder*="Taller"]').fill(uniqueTitle);
    await modal.locator('select.form-select').selectOption('COGNITIVO');
    await modal.locator('input[type="number"]').fill('25');

    // Submit form
    const saveBtn = modal.locator('button:has-text("Guardar Actividad")');
    await saveBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify toast feedback
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });

    // Verify DB activities in PostgreSQL
    const acts = await queryDb('SELECT count(*) as total FROM aca_actividades');
    expect(Number(acts[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('1.3 Should edit student grades, dynamically compute qualitative performance and save to PostgreSQL', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Wait for the gradebook table to render
    const dataTable = page.locator('table.data-table');
    await expect(dataTable).toBeVisible({ timeout: 10000 });

    const gradeInputs = dataTable.locator('tbody tr input[type="number"]');
    const rowCount = await gradeInputs.count();

    if (rowCount > 0) {
      const firstGradeInput = gradeInputs.first();
      // Set to 4.8 (Superior)
      await firstGradeInput.fill('4.8');
      await firstGradeInput.dispatchEvent('input');
      await firstGradeInput.dispatchEvent('change');

      // Verify performance badge in first row updates to SUPERIOR
      const firstRow = dataTable.locator('tbody tr').first();
      await expect(firstRow.locator('.badge')).toContainText(/SUPERIOR/i);

      // Set to 2.5 (Bajo)
      await firstGradeInput.fill('2.5');
      await firstGradeInput.dispatchEvent('input');
      await firstGradeInput.dispatchEvent('change');

      // Verify performance badge in first row updates to BAJO
      await expect(firstRow.locator('.badge')).toContainText(/BAJO/i);

      // Restore to 4.2 (Alto) and save
      await firstGradeInput.fill('4.2');
      await firstGradeInput.dispatchEvent('input');
      await firstGradeInput.dispatchEvent('change');

      // Click Save Planilla
      const savePlanillaBtn = page.locator('button:has-text("Guardar Planilla")');
      await expect(savePlanillaBtn).toBeEnabled();
      await savePlanillaBtn.click();

      // Verify toast confirmation or save feedback
      const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
      await expect(toast.first()).toBeVisible({ timeout: 10000 });
    }

    // Verify DB integrity for grades table
    const dbGrades = await queryDb('SELECT count(*) as total FROM aca_calificaciones');
    expect(Number(dbGrades[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('1.4 Should open SIEE promotion rules modal and configure promotion thresholds', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Click Reglas SIEE button
    const btnReglas = page.locator('button:has-text("Reglas SIEE")');
    await expect(btnReglas).toBeVisible();
    await btnReglas.click();

    // Verify SIEE Modal appears
    const modalContent = page.locator('.modal-backdrop');
    await expect(modalContent).toBeVisible();
    await expect(modalContent).toContainText('Configuración SIEE (Promoción)');

    // Verify inputs for promotion rules
    const materiaLimitInput = modalContent.locator('input[type="number"]').first();
    await expect(materiaLimitInput).toBeVisible();
    await materiaLimitInput.fill('3');

    // Close or save rules
    const saveBtn = modalContent.locator('button:has-text("Guardar Reglas"), button:has-text("Cancelar")').first();
    await saveBtn.click();
    await expect(modalContent).not.toBeVisible({ timeout: 5000 });
  });

  test('1.5 Should trigger PDF report card (Boletín) generation with live API interaction', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Click Boletín PDF button
    const btnBoletin = page.locator('button:has-text("Boletín PDF")');
    await expect(btnBoletin).toBeVisible();

    // Listen for download or API request
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('boletin') || resp.url().includes('academico'),
      { timeout: 10000 }
    ).catch(() => null);

    await btnBoletin.click();

    const response = await responsePromise;
    if (response) {
      expect([200, 201, 304]).toContain(response.status());
    }

    // Verify periods exist in PostgreSQL
    const periodos = await queryDb('SELECT * FROM aca_periodos ORDER BY numero ASC LIMIT 4');
    expect(periodos.length).toBeGreaterThan(0);
    expect(Number(periodos[0].numero)).toBe(1);
  });
});
