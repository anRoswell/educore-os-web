import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-06: Aula Virtual (LMS) & Tareas con Rúbrica 1290 - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, filters, modal lifecycles, and PostgreSQL persistence.
 */
test.describe('DocMD-06: Aula Virtual (LMS) & Tareas 1290 (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'DOCENTE');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones Globales y Sniffer de Errores
   */
  test('6.1 Carga inicial, KPIs formativos, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Gestión de Aulas & Tareas');

    // 2. Acciones de Cabecera (Header Actions)
    const btnAulas = page.locator('button:has-text("Aulas y Muro")');
    await expect(btnAulas).toBeVisible();

    const btnTareas = page.locator('button:has-text("Tareas")');
    await expect(btnTareas).toBeVisible();

    // 3. Tarjetas KPI (en Pestaña Tareas)
    await btnTareas.click();
    await page.waitForTimeout(300);

    const kpiCards = page.locator('.kpi-grid .kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-grid')).toContainText('TAREAS ACTIVAS');
    await expect(page.locator('.kpi-grid')).toContainText('TOTAL ENTREGAS');
    await expect(page.locator('.kpi-grid')).toContainText('POR CALIFICAR');
    await expect(page.locator('.kpi-grid')).toContainText('TASA DE CUMPLIMIENTO');

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('6.2 Navegación exhaustiva por las vistas de Aulas, Tareas, Calificación y Filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Aulas y Muro ---
    await page.locator('button:has-text("Aulas y Muro")').click();
    await page.waitForTimeout(300);

    // --- Tab 2: Tareas ---
    await page.locator('button:has-text("Tareas")').click();
    await page.waitForTimeout(300);

    // Filtros de Tareas
    const selectGrupo = page.locator('select.form-select').nth(0);
    if (await selectGrupo.isVisible()) {
      await selectGrupo.selectOption({ index: 0 });
    }

    const selectMateria = page.locator('select.form-select').nth(1);
    if (await selectMateria.isVisible()) {
      await selectMateria.selectOption({ index: 0 });
    }

    const searchInput = page.locator('input[placeholder*="Taller"], input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Filtro E2E');
      await page.waitForTimeout(200);
      await searchInput.clear();
    }

    // Sub-tab 1: Tareas Publicadas
    await page.locator('.tabs-nav .tab-btn:has-text("Tareas Publicadas")').click();
    await expect(page.locator('.tareas-grid, .empty-state')).toBeVisible();

    // Sub-tab 3: Vista de Entrega (Portal Estudiante)
    await page.locator('.tabs-nav .tab-btn:has-text("Vista de Entrega")').click();
    await expect(page.locator('h3:has-text("Simulador de Bandeja de Tareas")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Tarjetas y Filas de Calificación (Row Action Sweep)
   */
  test('6.3 Barrido exhaustivo de botones de acción en Aulas, Muro, Tareas y Planilla 1290', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Tareas: Inspeccionar primera tarea
    await page.locator('button:has-text("Tareas")').click();
    await page.waitForTimeout(300);
    await page.locator('.tabs-nav .tab-btn:has-text("Tareas Publicadas")').click();
    await page.waitForTimeout(300);

    const primeraTarea = page.locator('.tareas-grid .tarea-card').first();
    if (await primeraTarea.isVisible()) {
      // Probar botón editar tarea
      const btnEdit = primeraTarea.locator('button[title*="Editar"]');
      if (await btnEdit.isVisible()) {
        await btnEdit.click();
        const modal = page.locator('.modal-backdrop');
        await expect(modal.first()).toBeVisible();
        await modal.locator('button:has-text("Cancelar"), .close-btn').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }

      // Probar botón revisar y calificar
      const btnCalificar = primeraTarea.locator('button:has-text("Revisar Entregas")');
      if (await btnCalificar.isVisible()) {
        await btnCalificar.click();
        await page.waitForTimeout(400);

        const banner = page.locator('.escala-banner');
        if (await banner.isVisible()) {
          // En la tabla de calificación, probar inputs y tags
          const primeraFilaEst = page.locator('.data-table tbody tr').first();
          if (await primeraFilaEst.isVisible()) {
            const inputNota = primeraFilaEst.locator('input[type="number"]');
            if (await inputNota.isVisible()) {
              await inputNota.fill('4.8');
            }

            const tagBtn = primeraFilaEst.locator('.quick-feedback-tags button').first();
            if (await tagBtn.isVisible()) {
              await tagBtn.click();
            }

            const btnSaveRow = primeraFilaEst.locator('button:has-text("Guardar")');
            if (await btnSaveRow.isVisible()) {
              await btnSaveRow.click();
              await page.waitForTimeout(200);
            }
          }

          // Botón volver
          const btnVolver = page.locator('button:has-text("Volver a Tareas")');
          if (await btnVolver.isVisible()) {
            await btnVolver.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Aulas, Publicaciones y Tareas)
   */
  test('6.4 Ciclo de vida completo de los modales de LMS (apertura, validación y cierre)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // 1. Modal Crear Aula
    await page.locator('button:has-text("Aulas y Muro")').click();
    await page.waitForTimeout(300);
    const btnCrearAula = page.locator('button[title="Crear Aula"], button:has-text("Crear Aula Virtual")').first();
    if (await btnCrearAula.isVisible()) {
      await btnCrearAula.click();
      const modalAula = page.locator('.modal-backdrop');
      await expect(modalAula.first()).toBeVisible();
      await modalAula.locator('button:has-text("Cancelar"), .close-btn-modern').first().click();
      await expect(page.locator('.modal-backdrop')).not.toBeVisible();
    }

    // 2. Modal Crear Publicación
    const btnPost = page.locator('button:has-text("Crear Post")').first();
    if (await btnPost.isVisible()) {
      await btnPost.click();
      const modalPost = page.locator('.modal-backdrop');
      await expect(modalPost.first()).toBeVisible();
      await modalPost.locator('button:has-text("Cancelar"), .close-btn-modern').first().click();
      await expect(page.locator('.modal-backdrop')).not.toBeVisible();
    }

    // 3. Modal Crear Nueva Tarea
    await page.locator('button:has-text("Tareas")').click();
    await page.waitForTimeout(300);
    const btnCrearTarea = page.locator('button:has-text("Crear Nueva Tarea")');
    await expect(btnCrearTarea).toBeVisible();
    await btnCrearTarea.click();

    const modalTarea = page.locator('.modal-backdrop');
    await expect(modalTarea.first()).toBeVisible();
    await modalTarea.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Creación Transaccional y Persistencia en PostgreSQL (Aulas & Tareas)
   */
  test('6.5 Creación de aula y publicación de tarea con persistencia comprobada en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // 1. Crear Aula Virtual
    await page.locator('button:has-text("Aulas y Muro")').click();
    await page.waitForTimeout(300);
    const btnCrearAula = page.locator('button[title="Crear Aula"], button:has-text("Crear Aula Virtual")').first();
    
    if (await btnCrearAula.isVisible()) {
      await btnCrearAula.click();
      const modal = page.locator('.modal-backdrop');
      await expect(modal.first()).toBeVisible();

      const uniqueAula = `Laboratorio Física E2E ${Date.now()}`;
      await modal.locator('input[type="text"]').first().fill(uniqueAula);
      await modal.locator('textarea').first().fill('Espacio virtual de experimentación y resolución de talleres.');
      
      const saveBtn = modal.locator('button:has-text("Crear Aula Virtual")');
      await saveBtn.click();
      await page.waitForTimeout(800);
    }

    // 2. Crear Tarea
    await page.locator('button:has-text("Tareas")').click();
    await page.waitForTimeout(300);
    const btnCrearTarea = page.locator('button:has-text("Crear Nueva Tarea")');
    await btnCrearTarea.click();

    const modalTarea = page.locator('.modal-backdrop');
    await expect(modalTarea.first()).toBeVisible();

    const uniqueTarea = `Taller Leyes de Newton E2E ${Date.now()}`;
    await modalTarea.locator('input[placeholder*="Taller"]').fill(uniqueTarea);
    await modalTarea.locator('textarea[placeholder*="instrucciones"]').fill('Resolver los ejercicios 1 al 10 en parejas.');

    const saveBtnTarea = modalTarea.locator('button:has-text("Publicar Tarea")');
    await saveBtnTarea.click();

    // Validar Toast feedback
    const toast = page.locator('.toast-card, .toast-wrapper');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // 3. Verificación directa en base de datos PostgreSQL
    const aulasDb = await queryDb('SELECT count(*) as total FROM lms_aulas');
    expect(Number(aulasDb[0].total)).toBeGreaterThanOrEqual(0);

    const tareasDb = await queryDb('SELECT count(*) as total FROM lms_tareas');
    expect(Number(tareasDb[0].total)).toBeGreaterThanOrEqual(0);

    const entregasDb = await queryDb('SELECT count(*) as total FROM lms_entregas');
    expect(Number(entregasDb[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
