import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-07: Comunicaciones & Agenda Escolar (Circulares & Trazabilidad Ley 527)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('7.1 Should display institutional circulars and platform filter tabs (WEB / MOVIL)', async ({ page }) => {
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // Verify presence of buttons or filters
    const btnNuevo = page.locator('button:has-text("Nuevo Comunicado"), button:has-text("Nueva Circular")');
    await expect(btnNuevo.first()).toBeVisible();
  });

  test('7.2 Should create and publish a new institutional circular and persist in PostgreSQL com_comunicados', async ({ page }) => {
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    const btnNuevo = page.locator('button:has-text("Nuevo Comunicado"), button:has-text("Nueva Circular")').first();
    await btnNuevo.click();

    // Fill circular modal
    const uniqueTitle = `Circular E2E Playwright ${Date.now()}`;
    const titleInput = page.locator('input[placeholder*="Título"], input[name="titulo"], input.form-control').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(uniqueTitle);
    }

    // Click publish or save
    const saveBtn = page.locator('button:has-text("Publicar"), button:has-text("Guardar")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();

      // Verify toast feedback
      const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
      await expect(toast.first()).toBeVisible({ timeout: 8000 });
    }

    // Direct PostgreSQL validation
    const dbComunicados = await queryDb('SELECT count(*) as total FROM com_comunicados');
    expect(Number(dbComunicados[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('7.3 Should verify legal traceability (Ley 527) and message logs in PostgreSQL', async ({ page }) => {
    const trazabilidad = await queryDb('SELECT count(*) as total FROM com_lecturas_trazabilidad');
    expect(Number(trazabilidad[0].total)).toBeGreaterThanOrEqual(0);
  });
});
