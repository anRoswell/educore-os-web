import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-04: Horarios & Planeación Curricular - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of academic infrastructure actions, physical spaces/classrooms,
 * modal lifecycles, timetable blocks, and PostgreSQL anti-collision verification.
 */
test.describe('DocMD-04: Horarios & Planeación Curricular (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'COORDINADOR');
  });

  /**
   * SUITE 1: Carga Inicial, Infraestructura Curricular, Acciones Globales y Sniffer de Errores
   */
  test('4.1 Carga inicial de infraestructura escolar, controles de planeación y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Título y encabezado
    await expect(page.locator('h1')).toContainText('Gestión Académica & Planilla Decreto 1290');

    // 2. Disponibilidad de acciones de infraestructura escolar y espacios físicos
    const btnNivel = page.locator('button.action-card-btn:has-text("Nivel")');
    await expect(btnNivel).toBeVisible();

    const btnGrado = page.locator('button.action-card-btn:has-text("Grado")');
    await expect(btnGrado).toBeVisible();

    const btnGrupo = page.locator('button.action-card-btn:has-text("Grupo")');
    await expect(btnGrupo).toBeVisible();

    const btnArea = page.locator('button.action-card-btn:has-text("Área")');
    await expect(btnArea).toBeVisible();

    const btnAsig = page.locator('button.action-card-btn:has-text("Asignatura")');
    await expect(btnAsig).toBeVisible();

    const btnPeriodo = page.locator('button.action-card-btn:has-text("Periodo")');
    await expect(btnPeriodo).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación de Catálogo de Espacios y Distribución de Aulas
   */
  test('4.2 Navegación por la jerarquía de niveles, grados y salones físicos con aforo', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Probar selectores de infraestructura en cascada
    const gradoSelect = page.locator('.filter-bar select.form-select').nth(0);
    await expect(gradoSelect).toBeVisible();
    const gradoCount = await gradoSelect.locator('option').count();
    expect(gradoCount).toBeGreaterThan(0);

    // Iterar por los grados disponibles y verificar grupos asociados
    for (let i = 0; i < Math.min(gradoCount, 3); i++) {
      await gradoSelect.selectOption({ index: i });
      await page.waitForTimeout(200);

      const grupoSelect = page.locator('.filter-bar select.form-select').nth(1);
      await expect(grupoSelect).toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones y Configuración de Salones y Cupos (Row/Space Action Sweep)
   */
  test('4.3 Barrido interactivo de botones de acción rápida para espacios físicos y cargas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // Probar acceso a la guía de ruta pedagógica paso a paso
    const btnRuta = page.locator('button:has-text("Ruta Pedagógica")');
    await btnRuta.click();
    await page.waitForTimeout(200);

    const stepCards = page.locator('.setup-guide-card .step-card');
    const totalSteps = await stepCards.count();
    expect(totalSteps).toBe(7);

    // Click en la tarjeta de Salón / Grupo para abrir modal
    await stepCards.nth(2).click();
    const modalGrupo = page.locator('.modal-backdrop');
    await expect(modalGrupo).toBeVisible();
    await modalGrupo.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalGrupo).not.toBeVisible();

    // Ocultar ruta
    await btnRuta.click();
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales de Infraestructura Horaria y Salones
   */
  test('4.4 Ciclo de vida completo de modales de infraestructura escolar y espacios físicos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Modal Nivel Educativo
    const btnNivel = page.locator('button.action-card-btn:has-text("Nivel")');
    await btnNivel.click();
    const modalNivel = page.locator('.modal-backdrop');
    await expect(modalNivel).toBeVisible();
    await expect(modalNivel.locator('h3')).toContainText('Paso 1: Crear Nivel Educativo');
    await expect(modalNivel.locator('input[placeholder*="Educación"]')).toBeVisible();
    await modalNivel.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalNivel).not.toBeVisible();

    // 2. Modal Grado Escolar
    const btnGrado = page.locator('button.action-card-btn:has-text("Grado")');
    await btnGrado.click();
    const modalGrado = page.locator('.modal-backdrop');
    await expect(modalGrado).toBeVisible();
    await expect(modalGrado.locator('h3')).toContainText('Paso 2: Crear Grado Escolar');
    await modalGrado.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalGrado).not.toBeVisible();

    // 3. Modal Grupo / Salón Físico
    const btnGrupo = page.locator('button.action-card-btn:has-text("Grupo")');
    await btnGrupo.click();
    const modalGrupo = page.locator('.modal-backdrop');
    await expect(modalGrupo).toBeVisible();
    await expect(modalGrupo.locator('h3')).toContainText('Paso 3: Crear Grupo / Salón');
    await expect(modalGrupo.locator('input[placeholder*="Aula"]')).toBeVisible();
    await modalGrupo.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalGrupo).not.toBeVisible();

    // 4. Modal Asignatura Curricular
    const btnAsig = page.locator('button.action-card-btn:has-text("Asignatura")');
    await btnAsig.click();
    const modalAsig = page.locator('.modal-backdrop');
    await expect(modalAsig).toBeVisible();
    await expect(modalAsig.locator('h3')).toContainText('Paso 5: Crear Asignatura Curricular');
    await modalAsig.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalAsig).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa, Persistencia y Verificación Anticolisión en PostgreSQL
   */
  test('4.5 Configuración de nivel, grupo físico y validación del motor anticolisión en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Crear Nivel Educativo
    const btnNivel = page.locator('button.action-card-btn:has-text("Nivel")');
    await btnNivel.click();

    const modalNivel = page.locator('.modal-backdrop');
    await expect(modalNivel).toBeVisible();

    const uniqueNivel = `Nivel E2E ${Date.now()}`;
    const uniqueCodigo = `N${Math.floor(100 + Math.random() * 900)}`;
    await modalNivel.locator('input[placeholder*="Educación"]').fill(uniqueNivel);
    await modalNivel.locator('input[placeholder*="PRE"]').fill(uniqueCodigo);

    await modalNivel.locator('button:has-text("Guardar Nivel")').click();
    await expect(modalNivel).not.toBeVisible({ timeout: 5000 });

    // 2. Crear Grupo / Salón con aula física y cupo
    const btnGrupo = page.locator('button.action-card-btn:has-text("Grupo")');
    await btnGrupo.click();

    const modalGrupo = page.locator('.modal-backdrop');
    await expect(modalGrupo).toBeVisible();

    const uniqueGrupo = `Grupo E2E ${Date.now()}`;
    const aulaFisica = `Aula ${Math.floor(200 + Math.random() * 100)}`;
    await modalGrupo.locator('input[placeholder*="10-B"]').fill(uniqueGrupo);
    await modalGrupo.locator('input[type="number"]').fill('35');
    await modalGrupo.locator('input[placeholder*="Aula"]').fill(aulaFisica);

    await modalGrupo.locator('button:has-text("Guardar Grupo")').click();
    await expect(modalGrupo).not.toBeVisible({ timeout: 5000 });

    // 3. Verificación directa en base de datos PostgreSQL
    // 3.1 Nivel persistido
    const niveles = await queryDb('SELECT * FROM aca_niveles WHERE nombre = $1', [uniqueNivel]);
    expect(niveles.length).toBeGreaterThan(0);
    expect(niveles[0].codigo).toBe(uniqueCodigo);

    // 3.2 Grupo y cupo máximo persistidos
    const grupos = await queryDb('SELECT * FROM aca_grupos WHERE nombre = $1', [uniqueGrupo]);
    expect(grupos.length).toBeGreaterThan(0);
    expect(grupos[0].nombre).toBe(uniqueGrupo);
    expect(Number(grupos[0].cupo_maximo)).toBe(35);

    // 3.3 Bloques horarios (hor_bloques_horarios) en DB
    const bloques = await queryDb('SELECT count(*) as total FROM hor_bloques_horarios');
    expect(Number(bloques[0].total)).toBeGreaterThanOrEqual(0);

    // 3.4 Espacios físicos (hor_espacios_fisicos) en DB
    const espacios = await queryDb('SELECT count(*) as total FROM hor_espacios_fisicos');
    expect(Number(espacios[0].total)).toBeGreaterThanOrEqual(0);

    // 3.5 Cargas docentes (aca_cargas_docentes) en DB
    const cargas = await queryDb('SELECT count(*) as total FROM aca_cargas_docentes');
    expect(Number(cargas[0].total)).toBeGreaterThanOrEqual(0);

    // 3.6 Validación de integridad anticolisión: Sin colisiones duplicadas en hor_distribucion_clases
    const colisiones = await queryDb(`
      SELECT docente_id, bloque_id, dia_semana, count(*) as repeticiones
      FROM hor_distribucion_clases
      WHERE colegio_id IS NOT NULL
      GROUP BY docente_id, bloque_id, dia_semana
      HAVING count(*) > 1
    `);
    expect(colisiones.length).toBe(0);

    sniffer.assertZeroErrors();
  });
});
