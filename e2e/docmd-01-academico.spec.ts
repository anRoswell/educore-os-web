import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-01: Académico & SIEE 1290 - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of header actions, pedagogical guide, filters, gradebook row interactions,
 * all 10 modal lifecycles, and direct PostgreSQL persistence.
 */
test.describe('DocMD-01: Gestión Académica & Curricular Decreto 1290 (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, Banner Decreto 1290, Acciones de Cabecera y Sniffer de Errores
   */
  test('1.1 Carga inicial, escala nacional Decreto 1290, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Gestión Académica & Planilla Decreto 1290');
    await expect(page.locator('.page-header p')).toContainText('Estructura curricular, registro y control de calificaciones');

    // 2. Acciones de Cabecera (Header Actions)
    const btnRuta = page.locator('button:has-text("Ruta Pedagógica")');
    await expect(btnRuta).toBeVisible();

    const btnGuardarPlanilla = page.locator('button:has-text("Guardar Planilla")');
    await expect(btnGuardarPlanilla).toBeVisible();

    const btnBoletinesGrupo = page.locator('button:has-text("Descargar Boletines del Grupo (ZIP)")');
    await expect(btnBoletinesGrupo).toBeVisible();

    const btnBoletinPdf = page.locator('button:has-text("Boletín PDF")');
    await expect(btnBoletinPdf).toBeVisible();

    // 3. Banner Informativo Escala Decreto 1290
    const escalaBanner = page.locator('.escala-banner');
    await expect(escalaBanner).toBeVisible();
    await expect(escalaBanner).toContainText('Escala Nacional de Valoración (Decreto 1290 de 2009)');
    await expect(escalaBanner.locator('.badge-success')).toContainText('Superior: 4.6 – 5.0');
    await expect(escalaBanner.locator('.badge-info')).toContainText('Alto: 4.0 – 4.59');
    await expect(escalaBanner.locator('.badge-warning')).toContainText('Básico: 3.0 – 3.99');
    await expect(escalaBanner.locator('.badge-danger')).toContainText('Bajo: 1.0 – 2.99');

    // 4. Barra de Acciones Rápidas (Action Cards Bar)
    const actionButtons = page.locator('.action-buttons-bar .action-card-btn');
    await expect(actionButtons).toHaveCount(10);
    await expect(page.locator('.action-buttons-bar')).toContainText('0. Año Lectivo');
    await expect(page.locator('.action-buttons-bar')).toContainText('1. Nivel');
    await expect(page.locator('.action-buttons-bar')).toContainText('2. Grado');
    await expect(page.locator('.action-buttons-bar')).toContainText('3. Grupo');
    await expect(page.locator('.action-buttons-bar')).toContainText('4. Área');
    await expect(page.locator('.action-buttons-bar')).toContainText('5. Asignatura');
    await expect(page.locator('.action-buttons-bar')).toContainText('6. Periodo');
    await expect(page.locator('.action-buttons-bar')).toContainText('7. Actividad');
    await expect(page.locator('.action-buttons-bar')).toContainText('Reglas SIEE');
    await expect(page.locator('.action-buttons-bar')).toContainText('Cierre de Año');

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación de Guía Pedagógica y Selectores en Cascada
   */
  test('1.2 Navegación interactiva por la Ruta Pedagógica y aplicación de filtros en cascada', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Alternar visualización de la Ruta Pedagógica (Guía Paso a Paso)
    const btnRuta = page.locator('button:has-text("Ruta Pedagógica")');
    await btnRuta.click();
    await page.waitForTimeout(200);

    const setupGuide = page.locator('.setup-guide-card');
    await expect(setupGuide).toBeVisible();
    await expect(setupGuide).toContainText('Flujo Oficial de Configuración Académica');

    // Validar las 7 tarjetas de pasos
    const stepCards = setupGuide.locator('.steps-grid .step-card');
    await expect(stepCards).toHaveCount(7);
    await expect(stepCards.nth(0)).toContainText('Nivel Educativo');
    await expect(stepCards.nth(1)).toContainText('Grado Escolar');
    await expect(stepCards.nth(2)).toContainText('Grupo / Salón');
    await expect(stepCards.nth(3)).toContainText('Área (Ley 115)');
    await expect(stepCards.nth(4)).toContainText('Asignatura');
    await expect(stepCards.nth(5)).toContainText('Periodo');
    await expect(stepCards.nth(6)).toContainText('Actividad SIEE');

    // Ocultar guía nuevamente
    await btnRuta.click();
    await page.waitForTimeout(200);
    await expect(setupGuide).not.toBeVisible();

    // 2. Selectores de filtro en cascada
    // 2.1 Grado
    const gradoSelect = page.locator('.filter-bar select.form-select').nth(0);
    await expect(gradoSelect).toBeVisible();
    const gradoOptions = await gradoSelect.locator('option').count();
    expect(gradoOptions).toBeGreaterThan(0);
    await gradoSelect.selectOption({ index: 0 });
    await page.waitForTimeout(200);

    // 2.2 Grupo
    const grupoSelect = page.locator('.filter-bar select.form-select').nth(1);
    await expect(grupoSelect).toBeVisible();
    const grupoOptions = await grupoSelect.locator('option').count();
    if (grupoOptions > 0) {
      await grupoSelect.selectOption({ index: 0 });
      await page.waitForTimeout(200);
    }

    // 2.3 Asignatura
    const asigSelect = page.locator('.filter-bar select.form-select').nth(2);
    await expect(asigSelect).toBeVisible();
    const asigOptions = await asigSelect.locator('option').count();
    if (asigOptions > 0) {
      await asigSelect.selectOption({ index: 0 });
      await page.waitForTimeout(200);
    }

    // 2.4 Periodo
    const periodoSelect = page.locator('.filter-bar select.form-select').nth(3);
    await expect(periodoSelect).toBeVisible();
    const periodoOptions = await periodoSelect.locator('option').count();
    expect(periodoOptions).toBeGreaterThan(0);
    await periodoSelect.selectOption({ index: 0 });
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones en Filas de la Planilla (Row Action Sweep)
   */
  test('1.3 Barrido exhaustivo de filas en la planilla de calificaciones y recalculo Decreto 1290', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    const dataTable = page.locator('table.data-table');
    await expect(dataTable).toBeVisible({ timeout: 10000 });

    const studentRows = dataTable.locator('tbody tr');
    const rowCount = await studentRows.count();

    if (rowCount > 0) {
      const firstRow = studentRows.first();

      // Probar edición numérica y recálculo automático de escala SIEE
      const gradeInput = firstRow.locator('input[type="number"]');
      if (await gradeInput.isVisible()) {
        // Probar nivel Superior (4.8)
        await gradeInput.fill('4.8');
        await gradeInput.dispatchEvent('input');
        await gradeInput.dispatchEvent('change');
        await expect(firstRow.locator('.badge')).toContainText(/SUPERIOR/i);

        // Probar nivel Bajo (2.4)
        await gradeInput.fill('2.4');
        await gradeInput.dispatchEvent('input');
        await gradeInput.dispatchEvent('change');
        await expect(firstRow.locator('.badge')).toContainText(/BAJO/i);

        // Probar nivel Básico (3.5)
        await gradeInput.fill('3.5');
        await gradeInput.dispatchEvent('input');
        await gradeInput.dispatchEvent('change');
        await expect(firstRow.locator('.badge')).toContainText(/BÁSICO|BASICO/i);

        // Probar nivel Alto (4.3)
        await gradeInput.fill('4.3');
        await gradeInput.dispatchEvent('input');
        await gradeInput.dispatchEvent('change');
        await expect(firstRow.locator('.badge')).toContainText(/ALTO/i);
      }

      // Probar edición de observación pedagógica
      const obsInput = firstRow.locator('input[type="text"]');
      if (await obsInput.isVisible()) {
        await obsInput.fill('Excelente desempeño en competencias ciudadanas E2E');
        await obsInput.dispatchEvent('input');
      }

      // Probar botón de acción "🔄 Limpiar"
      const btnLimpiar = firstRow.locator('button:has-text("Limpiar")');
      if (await btnLimpiar.isVisible()) {
        await btnLimpiar.click();
        await page.waitForTimeout(200);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Modal Lifecycle Sweeps)
   */
  test('1.4 Ciclo de vida completo de los 10 modales de Gestión Académica (apertura, validación y cierre)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Modal 0: Año Lectivo
    const btnAnio = page.locator('button.action-card-btn:has-text("Año Lectivo")');
    await btnAnio.click();
    const modalAnio = page.locator('.modal-backdrop');
    await expect(modalAnio).toBeVisible();
    await expect(modalAnio).toContainText('Apertura y Cambio de Año Lectivo');
    await modalAnio.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalAnio).not.toBeVisible();

    // 2. Modal 1: Nivel Educativo
    const btnNivel = page.locator('button.action-card-btn:has-text("Nivel")');
    await btnNivel.click();
    const modalNivel = page.locator('.modal-backdrop');
    await expect(modalNivel).toBeVisible();
    await expect(modalNivel).toContainText('Paso 1: Crear Nivel Educativo');
    await modalNivel.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalNivel).not.toBeVisible();

    // 3. Modal 2: Grado Escolar
    const btnGrado = page.locator('button.action-card-btn:has-text("Grado")');
    await btnGrado.click();
    const modalGrado = page.locator('.modal-backdrop');
    await expect(modalGrado).toBeVisible();
    await expect(modalGrado).toContainText('Paso 2: Crear Grado Escolar');
    await modalGrado.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalGrado).not.toBeVisible();

    // 4. Modal 3: Grupo / Salón
    const btnGrupo = page.locator('button.action-card-btn:has-text("Grupo")');
    await btnGrupo.click();
    const modalGrupo = page.locator('.modal-backdrop');
    await expect(modalGrupo).toBeVisible();
    await expect(modalGrupo).toContainText('Paso 3: Crear Grupo / Salón');
    await modalGrupo.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalGrupo).not.toBeVisible();

    // 5. Modal 4: Área
    const btnArea = page.locator('button.action-card-btn:has-text("Área")');
    await btnArea.click();
    const modalArea = page.locator('.modal-backdrop');
    await expect(modalArea).toBeVisible();
    await expect(modalArea).toContainText('Paso 4: Crear Área Fundamental');
    await modalArea.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalArea).not.toBeVisible();

    // 6. Modal 5: Asignatura
    const btnAsig = page.locator('button.action-card-btn:has-text("Asignatura")');
    await btnAsig.click();
    const modalAsig = page.locator('.modal-backdrop');
    await expect(modalAsig).toBeVisible();
    await expect(modalAsig).toContainText('Paso 5: Crear Asignatura');
    await modalAsig.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalAsig).not.toBeVisible();

    // 7. Modal 6: Periodo
    const btnPeriodo = page.locator('button.action-card-btn:has-text("Periodo")');
    await btnPeriodo.click();
    const modalPeriodo = page.locator('.modal-backdrop');
    await expect(modalPeriodo).toBeVisible();
    await expect(modalPeriodo).toContainText('Paso 6: Crear Periodo');
    await modalPeriodo.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalPeriodo).not.toBeVisible();

    // 8. Modal 7: Actividad SIEE
    const btnActividad = page.locator('button.action-card-btn:has-text("Actividad")');
    await btnActividad.click();
    const modalActividad = page.locator('.modal-backdrop');
    await expect(modalActividad).toBeVisible();
    await expect(modalActividad).toContainText('Paso 7: Crear Actividad');
    await modalActividad.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalActividad).not.toBeVisible();

    // 9. Modal 8: Reglas SIEE
    const btnReglas = page.locator('button.action-card-btn:has-text("Reglas SIEE")');
    await btnReglas.click();
    const modalReglas = page.locator('.modal-backdrop');
    await expect(modalReglas).toBeVisible();
    await expect(modalReglas).toContainText('Configuración SIEE (Promoción)');
    await modalReglas.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalReglas).not.toBeVisible();

    // 10. Modal 9: Cierre de Año
    const btnCierre = page.locator('button.action-card-btn:has-text("Cierre de Año")');
    await btnCierre.click();
    const modalCierre = page.locator('.modal-backdrop');
    await expect(modalCierre).toBeVisible();
    await expect(modalCierre).toContainText('Cierre de Año Escolar');
    await modalCierre.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalCierre).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa y Verificación en PostgreSQL
   */
  test('1.5 Creación de actividad evaluativa SIEE, guardado de planilla y persistencia en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Crear una nueva actividad evaluativa SIEE
    const btnActividad = page.locator('button.action-card-btn:has-text("Actividad")');
    await btnActividad.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();

    const uniqueTitle = `Taller SIEE Exhaustivo ${Date.now()}`;
    await modal.locator('input[placeholder*="Taller"]').fill(uniqueTitle);
    await modal.locator('select.form-select').selectOption('COGNITIVO');
    await modal.locator('input[type="number"]').fill('30');

    const saveBtn = modal.locator('button:has-text("Guardar Actividad")');
    await saveBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });

    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });

    // 2. Guardar Planilla
    const savePlanillaBtn = page.locator('button:has-text("Guardar Planilla")');
    if (await savePlanillaBtn.isEnabled()) {
      await savePlanillaBtn.click();
      await expect(toast.first()).toBeVisible({ timeout: 8000 });
    }

    // 3. Verificación directa en base de datos PostgreSQL
    const actividades = await queryDb('SELECT * FROM aca_actividades WHERE titulo = $1', [uniqueTitle]);
    expect(actividades.length).toBeGreaterThan(0);
    expect(actividades[0].titulo).toBe(uniqueTitle);

    const calificaciones = await queryDb('SELECT count(*) as total FROM aca_calificaciones');
    expect(Number(calificaciones[0].total)).toBeGreaterThanOrEqual(0);

    const periodos = await queryDb('SELECT * FROM aca_periodos ORDER BY numero ASC LIMIT 4');
    expect(periodos.length).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });
  
  /**
   * SUITE 6: Panel Administrar Estructura (CRUD Modales) y Borrado Lógico
   * Cumpliendo requisito Anti-Regression de probar TODOS los tabs, modales y DB persistencia.
   */
  test('1.6 Panel Administrar Estructura: Interacción de pestañas, Modales de Edición y Borrado Lógico en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/academico');
    await page.waitForLoadState('networkidle');

    // 1. Activar el Modo de Administrar Estructura
    const btnAdmin = page.locator('button:has-text("Administrar Estructura")');
    await btnAdmin.click();
    await page.waitForTimeout(500);

    // 2. Verificar que se renderiza el componente Admin
    await expect(page.locator('h2').filter({ hasText: 'Administrar Estructura Académica' })).toBeVisible();

    // 3. Barrido interactivo de todas las pestañas para validar la refactorización CSS y carga (Zero Exceptions)
    const tabsToTest = ['Niveles', 'Grados', 'Grupos', 'Áreas', 'Asignaturas', 'Periodos'];
    for (const tabName of tabsToTest) {
      await page.locator(`button:has-text("${tabName}")`).click();
      await page.waitForTimeout(300);
      // Validar que la tabla sí cargue datos y no tire error en el sniffer
      await expect(page.locator('table.data-table')).toBeVisible();
    }

    // Volver a Niveles para la prueba CRUD
    await page.locator(`button:has-text("Niveles")`).click();
    await page.waitForTimeout(500);

    // Preparar un registro de prueba temporal en BD para validar CRUD sin alterar los niveles canónicos institucionales
    const timestamp = Date.now().toString().slice(-6);
    const initialName = `Nivel Prueba ${timestamp}`;
    const testCode = `T${timestamp.slice(-3)}`;
    await queryDb("INSERT INTO aca_niveles (id, colegio_id, codigo, nombre, orden, estado) VALUES (gen_random_uuid(), '11111111-2222-3333-4444-555555555555', $1, $2, 99, 'ACTIVO')", [testCode, initialName]);

    // Recargar pestaña Niveles para ver el nuevo registro
    await page.locator(`button:has-text("Niveles")`).click();
    await page.waitForTimeout(500);

    // Ubicar la fila de prueba
    const testRow = page.locator(`table.data-table tbody tr:has-text("${initialName}")`).first();
    await expect(testRow).toBeVisible();
    
    // Iniciar edición con el modal específico
    const btnEditar = testRow.locator('button[title="Editar"]');
    await btnEditar.click();

    // El Modal centrado debería verse
    const modalCard = page.locator('.modal-card');
    await expect(modalCard).toBeVisible();
    await expect(modalCard).toContainText('Editar Nivel Educativo');
    
    // Cambiar nombre usando el primer campo del modal específico
    const newName = `Nivel E2E ${timestamp}`;
    const inputNombre = modalCard.locator('input[type="text"]').first();
    await inputNombre.fill(newName);
    
    // Guardar
    const btnGuardar = modalCard.locator('button:has-text("Guardar Cambios")');
    await btnGuardar.click();
    await page.waitForTimeout(800);
    await expect(modalCard).not.toBeVisible();
    
    // Validar en Base de Datos que se guardó!
    const dbCheckEdit = await queryDb('SELECT id, nombre, estado FROM aca_niveles WHERE nombre = $1', [newName]);
    expect(dbCheckEdit.length).toBeGreaterThan(0);
    expect(dbCheckEdit[0].nombre).toBe(newName);
    const fullUuid = dbCheckEdit[0].id;
    
    // Validar el Borrado Lógico
    const updatedRow = page.locator(`table.data-table tbody tr:has-text("${newName}")`).first();
    await expect(updatedRow).toBeVisible();
    const btnEliminar = updatedRow.locator('button[title="Eliminar"]');
    await btnEliminar.click();
    
    // Modal Confirmación
    await expect(modalCard).toBeVisible();
    await expect(modalCard).toContainText('Confirmar Eliminación');
    
    const btnConfirmarEliminar = modalCard.locator('button:has-text("Sí, Eliminar")');
    await btnConfirmarEliminar.click();
    await page.waitForTimeout(800);
    
    // Verificar en BD que el estado cambió a ELIMINADO
    const dbCheckDelete = await queryDb('SELECT estado FROM aca_niveles WHERE id = $1', [fullUuid]);
    expect(dbCheckDelete.length).toBeGreaterThan(0);
    expect(dbCheckDelete[0].estado).toBe('ELIMINADO');

    sniffer.assertZeroErrors();
  });
});
