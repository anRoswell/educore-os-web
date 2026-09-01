import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-02: Matrículas & Directorio Escolar 360° (SIMAT & Carnet Digital)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('2.1 Should display student directory, search filter, and SIMAT action controls', async ({ page }) => {
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // Page Header
    await expect(page.locator('h1')).toContainText('Matrículas & Ficha Integral del Estudiante');

    // Search bar
    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible();

    // Data table
    const dataTable = page.locator('table.data-table');
    await expect(dataTable).toBeVisible();
    await expect(dataTable.locator('th')).toContainText(['Código', 'Estudiante', 'Documento', 'Grado / Grupo', 'Estado']);

    // Check action buttons
    await expect(page.locator('button:has-text("Exportar SIMAT")')).toBeVisible();
    await expect(page.locator('button:has-text("Formalizar Nueva Matrícula")')).toBeVisible();
  });

  test('2.2 Should formalize a new student enrollment and persist in PostgreSQL mat_estudiantes', async ({ page }) => {
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // Open Formalizar Matrícula modal
    const btnNueva = page.locator('button:has-text("Formalizar Nueva Matrícula")');
    await btnNueva.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('Formalizar Nueva Matrícula');

    // Fill new student form
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const docNumber = `102030${randomSuffix}`;
    const firstName = `JuanE2E${randomSuffix}`;
    const lastName = `PérezE2E${randomSuffix}`;

    await modal.locator('input[placeholder*="Santiago"]').fill(firstName);
    await modal.locator('input[placeholder*="Gómez"]').first().fill(lastName);
    await modal.locator('input[placeholder*="1025896321"]').fill(docNumber);
    await modal.locator('input[placeholder*="Carlos Gómez"]').fill(`Acudiente ${lastName}`);

    // Submit form
    const submitBtn = modal.locator('button:has-text("Formalizar Matrícula")').first();
    await submitBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Toast notification check
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // PostgreSQL verification
    const dbStudents = await queryDb('SELECT * FROM mat_estudiantes WHERE primer_nombre = $1', [firstName]);
    expect(dbStudents.length).toBeGreaterThan(0);
    expect(dbStudents[0].primer_nombre).toBe(firstName);
    expect(dbStudents[0].numero_documento).toBe(docNumber);
  });

  test('2.3 Should open Ficha Integral 360° and display active digital ID with rotating HMAC QR', async ({ page }) => {
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // Click Ficha 360 on first available student
    const btnFicha = page.locator('button:has-text("👁️ Ficha")').first();
    await expect(btnFicha).toBeVisible();
    await btnFicha.click();

    // Verify Ficha 360 Modal opens
    const modal360 = page.locator('.modal-backdrop');
    await expect(modal360).toBeVisible();
    await expect(modal360.locator('h3')).toContainText('Ficha Integral 360° del Estudiante');

    // Verify Digital ID Carnet Card section
    const carnetCard = modal360.locator('.carnet-card-sim');
    await expect(carnetCard).toBeVisible();
    await expect(carnetCard).toContainText('QR ACTIVO');

    // Close modal
    const closeBtn = modal360.locator('button:has-text("Cerrar"), .close-btn').first();
    await closeBtn.click();
    await expect(modal360).not.toBeVisible({ timeout: 5000 });
  });

  test('2.4 Should trigger official SIMAT MEN (Resolución 166) data export', async ({ page }) => {
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    const btnSimat = page.locator('button:has-text("Exportar SIMAT")');
    await expect(btnSimat).toBeVisible();

    // Trigger export
    await btnSimat.click();

    // Verify toast feedback for export
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // Verify student count in DB
    const studentCount = await queryDb('SELECT count(*) as total FROM mat_estudiantes');
    expect(Number(studentCount[0].total)).toBeGreaterThan(0);
  });
});
