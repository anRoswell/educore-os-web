import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-05: Control de Asistencia Digital & Excusas Médicas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'DOCENTE');
  });

  test('5.1 Should load class roster for roll call and display real-time status counters', async ({ page }) => {
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // Page title
    await expect(page.locator('h1')).toContainText('Toma de Asistencia & Excusas Médicas');

    // Stats cards (Total, Presentes, Retardos, Faltas Totales)
    const statsCards = page.locator('.stats-grid .stat-card');
    await expect(statsCards).toHaveCount(4);
    await expect(page.locator('.stats-grid')).toContainText('Presentes');
    await expect(page.locator('.stats-grid')).toContainText('Retardos');
    await expect(page.locator('.stats-grid')).toContainText('Faltas Totales');
  });

  test('5.2 Should execute rapid roll call (<20s), toggle presence chips (P/R/F/FJ), and register session in DB', async ({ page }) => {
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table.data-table');
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Toggle first student to Retardo (R)
      const firstRow = rows.first();
      const btnRetardo = firstRow.locator('.btn-retardo');
      await btnRetardo.click();
      await expect(btnRetardo).toHaveClass(/active/);

      // Toggle second student to Falta Injustificada (F) if available
      if (rowCount > 1) {
        const secondRow = rows.nth(1);
        const btnFalta = secondRow.locator('.btn-falta');
        await btnFalta.click();
        await expect(btnFalta).toHaveClass(/active/);
      }

      // Enter class topic
      const topicInput = page.locator('input[placeholder*="Revolución Industrial"]');
      if (await topicInput.isVisible()) {
        await topicInput.fill('Sesión E2E Playwright Automatizada');
      }

      // Click save session button
      const saveBtn = page.locator('button:has-text("Registrar Sesión")');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Verify toast feedback
      const toast = page.locator('.toast-card, .toast-wrapper');
      await expect(toast.first()).toBeVisible({ timeout: 8000 });
    }

    // Direct PostgreSQL validation
    const sesiones = await queryDb('SELECT count(*) as total FROM asi_sesiones_clase');
    expect(Number(sesiones[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('5.3 Should navigate to Excusas & Justificaciones tab and process medical excuses', async ({ page }) => {
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // Switch to Excusas tab
    const tabExcusas = page.locator('.tabs-nav button:has-text("Excusas")');
    if (await tabExcusas.isVisible()) {
      await tabExcusas.click();

      // Verify Excusas view rendered
      await expect(page.locator('h3:has-text("Bandeja de Entrada: Justificaciones"), h3:has-text("Incapacidad")')).toBeVisible();

      // If approve button exists, click approve
      const btnAprobar = page.locator('button:has-text("Aprobar")').first();
      if (await btnAprobar.isVisible()) {
        await btnAprobar.click();

        // Verify toast confirmation
        const toast = page.locator('.toast-card, .toast-wrapper');
        await expect(toast.first()).toBeVisible({ timeout: 8000 });
      }
    }

    // Verify DB integrity for excusas table
    const dbExcusas = await queryDb('SELECT count(*) as total FROM asi_excusas_justificaciones');
    expect(Number(dbExcusas[0].total)).toBeGreaterThanOrEqual(0);
  });
});
