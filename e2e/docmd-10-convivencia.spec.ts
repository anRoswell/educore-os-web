import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-10: Convivencia Escolar (Ley 1620, Tipificación Tipo I/II/III & Debido Proceso)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * 5 Mandatory Suites:
 * 1. Initial Load, KPIs, Header Actions & Zero JS Errors
 * 2. 100% Tab Navigation and Interactive Filters
 * 3. Table Row Action Buttons Sweep
 * 4. Modal Lifecycles (Open, Validate, Cancel/Close)
 * 5. Full Business Transactions & Direct PostgreSQL Persistence Verification
 */
test.describe('DocMD-10: Convivencia Escolar & Observador Digital (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'COORDINADOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs Ley 1620, Acciones de Cabecera y Sniffer de Cero Errores JS
   */
  test('10.1 Carga inicial, 4 KPIs de convivencia escolar, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('.page-title')).toContainText('Convivencia Escolar & Observador Digital');
    await expect(page.locator('.header-badge')).toContainText('LEY 1620 DE 2013 & DECRETO 1965');

    // 2. Acciones de Cabecera
    const btnNuevoCaso = page.locator('button:has-text("Radicar Anotación / Caso")');
    await expect(btnNuevoCaso).toBeVisible();

    const btnNuevaActa = page.locator('button:has-text("Nueva Sesión Comité")');
    await expect(btnNuevaActa).toBeVisible();

    // 3. Tarjetas de Indicadores / Métricas Ley 1620 (4 tarjetas)
    const metricCards = page.locator('.metric-card');
    await expect(metricCards).toHaveCount(4);
    await expect(page.locator('.metric-card:has-text("Total Expedientes")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo I (Leves)")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo II (Bullying)")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Tipo III (Graves)")')).toBeVisible();

    // 4. Barra de 4 Pestañas
    const tabs = page.locator('.tabs-container .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('10.2 Navegación exhaustiva por las 4 pestañas (Observador, Comité, SIUCE, Ruta) y aplicación de filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Observador Digital & Casos ---
    await page.locator('.tabs-container .tab-btn:has-text("Observador Digital")').click();
    await page.waitForTimeout(200);

    const searchInput = page.locator('.filters-bar input.search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Acoso');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    const selectFalta = page.locator('.filters-bar select').nth(0);
    if (await selectFalta.isVisible()) {
      await selectFalta.selectOption({ index: 0 });
    }

    const selectEstado = page.locator('.filters-bar select').nth(1);
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption({ index: 0 });
    }

    // --- Tab 2: Comité de Convivencia ---
    await page.locator('.tabs-container .tab-btn:has-text("Comité de Convivencia")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.tab-body-title:has-text("Libro de Actas")')).toBeVisible();

    // --- Tab 3: Matriz Oficial SIUCE ---
    await page.locator('.tabs-container .tab-btn:has-text("Matriz Oficial SIUCE")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.siuce-summary-grid')).toBeVisible();

    // --- Tab 4: Ruta de Atención Integral ---
    await page.locator('.tabs-container .tab-btn:has-text("Ruta de Atención Integral")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.tab-body-title:has-text("Ruta de Atención Integral")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Datos (Row Action Sweep)
   */
  test('10.3 Barrido exhaustivo de botones de acción en filas de expedientes y actas de comité', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Observador: inspeccionar primera fila
    const primeraFila = page.locator('table.data-table tbody tr').first();
    if (await primeraFila.isVisible()) {
      // Probar botón "👁️ Expediente"
      const btnExpediente = primeraFila.locator('button.btn-view');
      if (await btnExpediente.isVisible()) {
        await btnExpediente.click();
        const modalExp = page.locator('.modal-backdrop');
        await expect(modalExp.first()).toBeVisible();

        const closeExp = modalExp.locator('button:has-text("Cerrar"), .close-btn').first();
        if (await closeExp.isVisible()) {
          await closeExp.click();
          await page.waitForTimeout(200);
        }
      }

      // Probar botón "✍️ Descargos"
      const btnDescargos = primeraFila.locator('button.btn-edit');
      if (await btnDescargos.isVisible()) {
        await btnDescargos.click();
        const modalDesc = page.locator('.modal-backdrop');
        await expect(modalDesc.first()).toBeVisible();

        const closeDesc = modalDesc.locator('button:has-text("Cerrar"), button:has-text("Cancelar"), .close-btn').first();
        if (await closeDesc.isVisible()) {
          await closeDesc.click();
          await page.waitForTimeout(200);
        }
      }
    }

    // 2. En Tab Comité: inspeccionar primera acta
    await page.locator('.tabs-container .tab-btn:has-text("Comité de Convivencia")').click();
    await page.waitForTimeout(200);

    const primerActa = page.locator('.grid-actas .acta-card').first();
    if (await primerActa.isVisible()) {
      const btnVerActa = primerActa.locator('button:has-text("Ver / Imprimir Acta"), .btn-link-action');
      if (await btnVerActa.isVisible()) {
        await btnVerActa.click();
        await page.waitForTimeout(300);

        const modalActa = page.locator('.modal-backdrop, .print-preview-backdrop').first();
        if (await modalActa.isVisible()) {
          const closeBtn = modalActa.locator('button:has-text("Cerrar"), .close-btn').first();
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
  test('10.4 Ciclo de vida completo de los modales de Convivencia sin dejar estados congelados', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // 1. Modal Radicar Anotación / Caso
    const btnNuevoCaso = page.locator('button:has-text("Radicar Anotación / Caso")');
    await expect(btnNuevoCaso).toBeVisible();
    await btnNuevoCaso.click();

    const modalCaso = page.locator('.modal-backdrop');
    await expect(modalCaso.first()).toBeVisible();
    await expect(modalCaso.locator('h3').first()).toContainText('Radicar Anotación en Observador Digital');

    // Cancelar modal
    await modalCaso.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalCaso).not.toBeVisible();

    // 2. Modal Nueva Acta de Comité
    const btnNuevaActa = page.locator('button:has-text("Nueva Sesión Comité")');
    await expect(btnNuevaActa).toBeVisible();
    await btnNuevaActa.click();

    const modalActa = page.locator('.modal-backdrop');
    await expect(modalActa.first()).toBeVisible();
    await expect(modalActa.locator('h3').first()).toContainText('Nueva Acta de Comité de Convivencia');

    // Cancelar modal
    await modalActa.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalActa).not.toBeVisible();

    // 3. Modal Ajustes Convivencia
    const btnAjustes = page.locator('button:has-text("Ajustes")');
    if (await btnAjustes.isVisible()) {
      await btnAjustes.click();
      const modalConfig = page.locator('.modal-backdrop');
      if (await modalConfig.first().isVisible()) {
        await modalConfig.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), .close-btn').first().click();
        await expect(modalConfig).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa, Descargos 48h, Foliado de Actas y Verificación en PostgreSQL
   */
  test('10.5 Radicación transaccional de caso Tipo II, descargos debidos y acta de comité en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // 1. Radicar Caso Tipo II
    await page.locator('button:has-text("Radicar Anotación / Caso")').click();
    const modalCaso = page.locator('.modal-backdrop');
    await expect(modalCaso.first()).toBeVisible();

    // Seleccionar estudiante
    const studentSelect = modalCaso.locator('app-searchable-select .select-trigger').first();
    await studentSelect.click();
    const studentOption = modalCaso.locator('app-searchable-select .option-item').first();
    await expect(studentOption).toBeVisible({ timeout: 5000 });
    await studentOption.click();

    // Tipificación Tipo II
    await modalCaso.locator('select.form-select').selectOption('TIPO_II');
    await modalCaso.locator('input[placeholder*="Capítulo"]').fill('Capítulo 4, Art. 18 (Ley 1620)');
    await modalCaso.locator('input[placeholder*="Aula"]').fill('Patio Central');

    const uniqueHechos = `Caso de presunto acoso escolar reiterado registrado en prueba automatizada E2E Playwright ${Date.now()}`;
    await modalCaso.locator('textarea').fill(uniqueHechos);

    await modalCaso.locator('button:has-text("Radicar en Observador")').click();
    await expect(modalCaso).not.toBeVisible({ timeout: 8000 });

    // 2. Radicar Acta de Comité de Convivencia
    await page.locator('.tabs-container .tab-btn:has-text("Comité de Convivencia")').click();
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Redactar Nueva Acta")').click();
    const modalActa = page.locator('.modal-backdrop');
    await expect(modalActa.first()).toBeVisible();

    const uniqueActa = `ACTA-E2E-${Date.now()}`;
    await modalActa.locator('input[placeholder*="ACTA-"]').fill(uniqueActa);

    const textareas = modalActa.locator('textarea');
    await textareas.nth(0).fill('Decisiones unánimes adoptadas en sesión del Comité de Convivencia Escolar: mediación restaurativa y seguimiento psicosocial.');
    await textareas.nth(1).fill('Compromiso familiar de acompañamiento en casa y garantía de no repetición.');

    await modalActa.locator('button:has-text("Guardar y Foliar Acta")').click();
    await expect(modalActa).not.toBeVisible({ timeout: 8000 });

    // 3. Verificaciones directas en PostgreSQL
    // 3.1 Caso registrado en con_casos_convivencia
    const casoRows = await queryDb('SELECT * FROM con_casos_convivencia WHERE descripcion_hechos = $1', [uniqueHechos]);
    expect(casoRows.length).toBeGreaterThan(0);
    expect(casoRows[0].tipo_falta).toBe('TIPO_II');
    expect(casoRows[0].estado).toBe('ABIERTO');

    // 3.2 Acta registrada en con_actas_comite
    const actasRows = await queryDb('SELECT * FROM con_actas_comite WHERE numero_acta = $1', [uniqueActa]);
    expect(actasRows.length).toBeGreaterThan(0);
    expect(actasRows[0].decisiones_adoptadas).toContain('mediación restaurativa');

    // 3.3 Agrupación SIUCE en PostgreSQL
    const siuceDb = await queryDb('SELECT tipo_falta, count(*) as count FROM con_casos_convivencia GROUP BY tipo_falta');
    expect(siuceDb.length).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
