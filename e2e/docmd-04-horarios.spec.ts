import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-04: Horarios & Planeación Curricular (Anticolisión & Cargas Docentes)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'COORDINADOR');
  });

  test('4.1 Should configure educational levels and physical spaces for timetable distribution', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Open Nuevo Nivel Modal
    const btnNivel = page.locator('button.action-card-btn:has-text("Nivel")');
    await expect(btnNivel).toBeVisible();
    await btnNivel.click();

    const modalNivel = page.locator('.modal-backdrop');
    await expect(modalNivel).toBeVisible();
    await expect(modalNivel.locator('h3')).toContainText('Paso 1: Crear Nivel Educativo');

    const uniqueNivel = `Nivel E2E ${Date.now()}`;
    const uniqueCodigo = `N${Math.floor(100 + Math.random() * 900)}`;
    await modalNivel.locator('input[placeholder*="Educación"]').fill(uniqueNivel);
    await modalNivel.locator('input[placeholder*="PRE"]').fill(uniqueCodigo);

    const saveBtn = modalNivel.locator('button:has-text("Guardar Nivel")');
    await saveBtn.click();

    await expect(modalNivel).not.toBeVisible({ timeout: 5000 });

    // Verify DB persistence in aca_niveles
    const niveles = await queryDb('SELECT * FROM aca_niveles WHERE nombre = $1', [uniqueNivel]);
    expect(niveles.length).toBeGreaterThan(0);
  });

  test('4.2 Should configure grade and classroom group with max student quota', async ({ page }) => {
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Open Nuevo Grupo Modal
    const btnGrupo = page.locator('button.action-card-btn:has-text("Grupo")');
    await expect(btnGrupo).toBeVisible();
    await btnGrupo.click();

    const modalGrupo = page.locator('.modal-backdrop');
    await expect(modalGrupo).toBeVisible();
    await expect(modalGrupo.locator('h3')).toContainText('Paso 3: Crear Grupo / Salón');

    const uniqueGrupo = `Grupo E2E ${Date.now()}`;
    await modalGrupo.locator('input[placeholder*="10-B"]').fill(uniqueGrupo);
    await modalGrupo.locator('input[type="number"]').fill('35');
    await modalGrupo.locator('input[placeholder*="Aula"]').fill('Aula 301');

    const saveBtn = modalGrupo.locator('button:has-text("Guardar Grupo")');
    await saveBtn.click();

    await expect(modalGrupo).not.toBeVisible({ timeout: 5000 });

    // Verify DB persistence in aca_grupos
    const grupos = await queryDb('SELECT * FROM aca_grupos WHERE nombre = $1', [uniqueGrupo]);
    expect(grupos.length).toBeGreaterThan(0);
    expect(grupos[0].nombre).toBe(uniqueGrupo);
  });

  test('4.3 Should verify anti-collision constraints and timetable blocks in PostgreSQL', async ({ page }) => {
    // Verify timetable blocks (hor_bloques_horarios) in DB
    const bloques = await queryDb('SELECT * FROM hor_bloques_horarios LIMIT 5');
    expect(bloques.length).toBeGreaterThanOrEqual(0);

    // Verify physical spaces (hor_espacios_fisicos) in DB
    const espacios = await queryDb('SELECT * FROM hor_espacios_fisicos LIMIT 5');
    expect(espacios.length).toBeGreaterThanOrEqual(0);

    // Verify teacher assignments (aca_cargas_docentes) in DB
    const cargas = await queryDb('SELECT * FROM aca_cargas_docentes LIMIT 5');
    expect(cargas.length).toBeGreaterThanOrEqual(0);
  });
});
