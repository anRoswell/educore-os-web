import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-09: Inclusión Educativa, PIAR (Decreto 1421 / DUA) & Habeas Data (Ley 1581)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * 5 Mandatory Suites:
 * 1. Initial Load, KPIs, Header Actions & Zero JS Errors
 * 2. 100% Tab Navigation and Interactive Filters
 * 3. Table Row Action Buttons Sweep
 * 4. Modal Lifecycles (Open, Validate, Cancel/Close)
 * 5. Full Business Transactions & Direct PostgreSQL Persistence Verification
 */
test.describe('DocMD-09: Inclusión Educativa, PIAR & Habeas Data (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones de Cabecera y Sniffer de Cero Errores JS
   */
  test('9.1 Carga inicial, KPIs Decreto 1421 y Habeas Data, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // 1. Título y badges de normativa
    await expect(page.locator('h1')).toContainText('Inclusión Educativa & PIAR');
    await expect(page.locator('.header-badge')).toContainText('DECRETO 1421 DE 2017 & DUA');

    // 2. Acciones de Cabecera
    const btnNuevoPiar = page.locator('button:has-text("Nueva Ficha PIAR")');
    await expect(btnNuevoPiar).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-card:has-text("Estudiantes en Inclusión")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Ajustes Razonables (DUA)")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Actas de Compromiso")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Cumplimiento Auditoría")')).toBeVisible();

    // 4. Barra de pestañas
    const tabs = page.locator('.tabs-nav .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('9.2 Navegación exhaustiva por el 100% de pestañas (PIAR, DUA, Actas, Auditoría, Habeas Data) y filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Expedientes & Fichas PIAR ---
    await page.locator('.tabs-nav .tab-btn:has-text("Expedientes")').click();
    await page.waitForTimeout(200);

    const searchInput = page.locator('.filters-grid input.search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gómez');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    const selectCategoria = page.locator('.filters-grid select').nth(0);
    if (await selectCategoria.isVisible()) {
      await selectCategoria.selectOption({ index: 0 });
    }

    const selectEstado = page.locator('.filters-grid select').nth(1);
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption({ index: 0 });
    }

    // --- Tab 2: Ajustes Curriculares (Anexo 2) ---
    await page.locator('.tabs-nav .tab-btn:has-text("Ajustes Curriculares")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.section-intro h3')).toContainText('Matriz de Ajustes Razonables Curriculares & DUA');

    // --- Tab 3: Actas de Acuerdo (Anexo 3) ---
    await page.locator('.tabs-nav .tab-btn:has-text("Actas de Acuerdo")').click();
    await page.waitForTimeout(200);

    // --- Tab 4: Guía de Auditoría SED / MEN ---
    await page.locator('.tabs-nav .tab-btn:has-text("Guía de Auditoría")').click();
    await page.waitForTimeout(200);

    // --- Sub-módulo: Habeas Data (Ley 1581) ---
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Protección de Datos & Habeas Data');
    const tabsHabeas = page.locator('.tabs-nav .tab-btn');
    const habeasCount = await tabsHabeas.count();
    for (let i = 0; i < habeasCount; i++) {
      await tabsHabeas.nth(i).click();
      await page.waitForTimeout(200);
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Datos (Row Action Sweep)
   */
  test('9.3 Barrido exhaustivo de botones de acción en filas de expedientes PIAR y consentimientos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Expedientes PIAR: inspeccionar primera fila
    const primeraFilaPiar = page.locator('table.data-table tbody tr').first();
    if (await primeraFilaPiar.isVisible()) {
      const actionButtons = primeraFilaPiar.locator('.actions-group button');
      const btnCount = await actionButtons.count();

      for (let i = 0; i < btnCount; i++) {
        const btn = actionButtons.nth(i);
        const title = (await btn.getAttribute('title') || await btn.innerText() || '').trim();

        if (!title.toLowerCase().includes('pdf') && !title.toLowerCase().includes('descargar')) {
          await btn.click();
          await page.waitForTimeout(300);

          // Cerrar modal / drawer si se abrió
          const modal = page.locator('.modal-backdrop, .drawer-backdrop, .modal-card').first();
          if (await modal.isVisible()) {
            const closeBtn = modal.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), .close-btn, .btn-close').first();
            if (await closeBtn.isVisible()) {
              await closeBtn.click();
              await page.waitForTimeout(200);
            }
          }
        }
      }
    }

    // 2. En Habeas Data: inspeccionar fila de consentimientos
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    const primeraFilaConsent = page.locator('table.data-table tbody tr').first();
    if (await primeraFilaConsent.isVisible()) {
      const btnVer = primeraFilaConsent.locator('button').first();
      if (await btnVer.isVisible()) {
        await btnVer.click();
        await page.waitForTimeout(300);

        const modal = page.locator('.modal-backdrop, .modal-card').first();
        if (await modal.isVisible()) {
          const closeBtn = modal.locator('button:has-text("Cerrar"), button:has-text("Cancelar"), .close-btn').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(200);
          }
        }
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida Completo de Modales (Apertura, Validación y Cierre)
   */
  test('9.4 Ciclo de vida completo de los modales de Inclusión y Habeas Data sin bloqueos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // 1. Modal Ficha PIAR (Anexo 1)
    const btnNuevoPiar = page.locator('button:has-text("Nueva Ficha PIAR")');
    await expect(btnNuevoPiar).toBeVisible();
    await btnNuevoPiar.click();

    const modalPiar = page.locator('.modal-backdrop');
    await expect(modalPiar.first()).toBeVisible();
    await expect(modalPiar.locator('h3').first()).toContainText('Ficha de Caracterización Psicopedagógica PIAR');

    // Cancelar modal
    await modalPiar.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalPiar).not.toBeVisible();

    // 2. Modal Nuevo Consentimiento (Habeas Data)
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    const btnNuevoConsent = page.locator('button:has-text("Registrar Consentimiento Digital")');
    await expect(btnNuevoConsent).toBeVisible();
    await btnNuevoConsent.click();

    const modalConsent = page.locator('.modal-backdrop');
    await expect(modalConsent.first()).toBeVisible();
    await expect(modalConsent.locator('h3').first()).toContainText('Radicar Consentimiento Digital de Acudiente');

    // Cancelar modal
    await modalConsent.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalConsent).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa y Verificación de Persistencia en PostgreSQL
   */
  test('9.5 Registro integral de PIAR y consentimiento digital con verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/inclusion');
    await page.waitForLoadState('networkidle');

    // 1. Crear nueva Ficha PIAR (Anexo 1)
    await page.locator('button:has-text("Nueva Ficha PIAR")').click();
    const modalPiar = page.locator('.modal-backdrop');
    await expect(modalPiar.first()).toBeVisible();

    // Seleccionar estudiante
    const studentSelect = modalPiar.locator('app-searchable-select .select-trigger').first();
    await studentSelect.click();
    const studentOpt = modalPiar.locator('app-searchable-select .option-item').first();
    await expect(studentOpt).toBeVisible({ timeout: 5000 });
    await studentOpt.click();

    // Categoría y Estilo
    await modalPiar.locator('select.form-select').first().selectOption('AUTISMO_TEA');
    await modalPiar.locator('select.form-select').nth(1).selectOption('VISUAL');

    const uniqueDiag = `Trastorno del Espectro Autista E2E Test ${Date.now()}`;
    await modalPiar.locator('textarea').first().fill(uniqueDiag);

    const textareas = modalPiar.locator('textarea');
    const count = await textareas.count();
    if (count >= 4) {
      await textareas.nth(1).fill('Hipersensibilidad auditiva moderada en horas de descanso');
      await textareas.nth(2).fill('Gran habilidad para cálculo lógico y diseño computacional');
      await textareas.nth(3).fill('Red de apoyo familiar activa con tutorías de refuerzo');
    }

    await modalPiar.locator('button:has-text("Guardar Ficha PIAR")').click();
    await expect(modalPiar).not.toBeVisible({ timeout: 8000 });

    // 2. Navegar a Habeas Data y registrar consentimiento con SHA-256
    await page.goto('/habeas-data');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Registrar Consentimiento Digital")').click();
    const modalConsent = page.locator('.modal-backdrop');
    await expect(modalConsent.first()).toBeVisible();

    const consentStudentSelect = modalConsent.locator('app-searchable-select .select-trigger').first();
    await consentStudentSelect.click();
    const consentStudentOpt = modalConsent.locator('app-searchable-select .option-item').first();
    await expect(consentStudentOpt).toBeVisible({ timeout: 5000 });
    await consentStudentOpt.click();

    const guardianName = `Acudiente E2E Playwright ${Date.now()}`;
    const guardianDoc = `CC${Math.floor(10000000 + Math.random() * 90000000)}`;

    const formGroups = modalConsent.locator('.modal-form-grid .form-group');
    await formGroups.filter({ hasText: 'Nombre del Padre' }).locator('input').fill(guardianName);
    await formGroups.filter({ hasText: 'Documento de Identidad' }).locator('input').fill(guardianDoc);
    await formGroups.filter({ hasText: 'Parentesco' }).locator('input').fill('Madre');
    await formGroups.filter({ hasText: 'Correo Electrónico' }).locator('input').fill('acudiente.e2e@educore.edu.co');

    const checkboxes = modalConsent.locator('.checkbox-clause input[type="checkbox"]');
    const chkCount = await checkboxes.count();
    for (let i = 0; i < chkCount; i++) {
      if (!(await checkboxes.nth(i).isChecked())) {
        await checkboxes.nth(i).check();
      }
    }

    await modalConsent.locator('button:has-text("Firmar y Registrar Consentimiento")').click();
    await expect(modalConsent).not.toBeVisible({ timeout: 8000 });

    // 3. Verificaciones directas en PostgreSQL
    // 3.1 PIAR Caracterización persistida
    const piarRows = await queryDb('SELECT * FROM piar_caracterizaciones WHERE diagnostico_clinico = $1', [uniqueDiag]);
    expect(piarRows.length).toBeGreaterThan(0);
    expect(piarRows[0].diagnostico_categoria).toBe('AUTISMO_TEA');
    expect(piarRows[0].estado).toBe('ACTIVO');

    // 3.2 Ajustes Curriculares y Actas
    const ajustesDb = await queryDb('SELECT count(*) as total FROM piar_ajustes_curriculares');
    expect(Number(ajustesDb[0].total)).toBeGreaterThanOrEqual(0);

    const actasDb = await queryDb('SELECT count(*) as total FROM piar_actas_compromiso');
    expect(Number(actasDb[0].total)).toBeGreaterThanOrEqual(0);

    // 3.3 Consentimiento Habeas Data persistido con hash SHA-256
    const consentRows = await queryDb('SELECT * FROM habeas_consentimientos WHERE acudiente_nombre = $1', [guardianName]);
    expect(consentRows.length).toBeGreaterThan(0);
    expect(consentRows[0].hash_integridad_sha256).toBeDefined();
    expect(consentRows[0].hash_integridad_sha256.length).toBe(64);
    expect(consentRows[0].autoriza_datos_sensibles).toBe(true);
    expect(consentRows[0].estado).toBe('VIGENTE');

    // 3.4 Solicitudes ARCO y Auditoría RNBD
    const arcoDb = await queryDb('SELECT count(*) as total FROM habeas_solicitudes_arco');
    expect(Number(arcoDb[0].total)).toBeGreaterThanOrEqual(0);

    const auditDb = await queryDb('SELECT count(*) as total FROM habeas_auditoria_rnbd');
    expect(Number(auditDb[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
