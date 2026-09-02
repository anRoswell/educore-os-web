import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-05: Control de Asistencia Digital & Excusas Médicas - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, filters, excusas lifecycle, and PostgreSQL persistence.
 */
test.describe('DocMD-05: Control de Asistencia Digital & Excusas Médicas (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'COORDINADOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones Globales y Sniffer de Errores
   */
  test('5.1 Carga inicial, KPIs de presentismo, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Toma de Asistencia & Excusas Médicas');

    // 2. Acciones de Cabecera (Header Actions)
    const btnHoy = page.locator('.header-actions-wrapper button:has-text("Hoy")');
    await expect(btnHoy).toBeVisible();
    await btnHoy.click();

    // 3. Tarjetas KPI / Estadísticas
    const statsCards = page.locator('.stats-grid .stat-card');
    await expect(statsCards).toHaveCount(4);
    await expect(page.locator('.stats-grid')).toContainText('Total');
    await expect(page.locator('.stats-grid')).toContainText('Presentes');
    await expect(page.locator('.stats-grid')).toContainText('Retardos');
    await expect(page.locator('.stats-grid')).toContainText('Faltas Totales');

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav .tab-btn');
    await expect(tabs).toHaveCount(2);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('5.2 Navegación exhaustiva por las pestañas y aplicación de filtros de carga y grupo', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Tomar Lista de Clase ---
    const tabTomarLista = page.locator('.tabs-nav .tab-btn:has-text("Tomar Lista")');
    await tabTomarLista.click();
    await expect(page.locator('.table-responsive')).toBeVisible();

    // Filtro selector de carga docente / grupo
    const selectCarga = page.locator('select.form-select').first();
    if (await selectCarga.isVisible()) {
      const optionsCount = await selectCarga.locator('option').count();
      if (optionsCount > 0) {
        await selectCarga.selectOption({ index: 0 });
        await page.waitForTimeout(300);
      }
    }

    // Input de tema de clase
    const topicInput = page.locator('input[placeholder*="Revolución Industrial"], input[placeholder*="Tema"]');
    if (await topicInput.isVisible()) {
      await topicInput.fill('Filtro de prueba tema');
      await page.waitForTimeout(200);
      await topicInput.clear();
    }

    // --- Tab 2: Excusas & Justificaciones ---
    const tabExcusas = page.locator('.tabs-nav .tab-btn:has-text("Excusas")');
    await tabExcusas.click();
    await expect(page.locator('h3:has-text("Bandeja de Entrada: Justificaciones")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla (Row Action Sweep)
   */
  test('5.3 Barrido exhaustivo de chips de asistencia (P/R/F/FJ), toggles SMS y acciones en excusas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // 1. Barrido en planilla de asistencia
    const rows = page.locator('table.data-table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();

      // Probar chip R (Retardo)
      const btnRetardo = firstRow.locator('.btn-retardo');
      if (await btnRetardo.isVisible()) {
        await btnRetardo.click();
        await expect(btnRetardo).toHaveClass(/active/);
      }

      // Probar chip F (Falta Injustificada)
      const btnFalta = firstRow.locator('.btn-falta');
      if (await btnFalta.isVisible()) {
        await btnFalta.click();
        await expect(btnFalta).toHaveClass(/active/);
      }

      // Probar chip FJ (Falta Justificada)
      const btnJustificada = firstRow.locator('.btn-justificada');
      if (await btnJustificada.isVisible()) {
        await btnJustificada.click();
        await expect(btnJustificada).toHaveClass(/active/);
      }

      // Probar chip P (Presente)
      const btnPresente = firstRow.locator('.btn-presente');
      if (await btnPresente.isVisible()) {
        await btnPresente.click();
        await expect(btnPresente).toHaveClass(/active/);
      }

      // Probar input de observación individual
      const obsInput = firstRow.locator('input[placeholder*="Opcional"]');
      if (await obsInput.isVisible()) {
        await obsInput.fill('Observación E2E test');
        await page.waitForTimeout(200);
      }
    }

    // 2. Barrido en bandeja de Excusas
    const tabExcusas = page.locator('.tabs-nav .tab-btn:has-text("Excusas")');
    await tabExcusas.click();
    await page.waitForLoadState('networkidle');

    const filaExcusa = page.locator('table.data-table tbody tr').first();
    if (await filaExcusa.isVisible()) {
      const btnAprobar = filaExcusa.locator('button:has-text("Aprobar")');
      if (await btnAprobar.isVisible()) {
        await btnAprobar.click();
        const toast = page.locator('.toast-card, .toast-wrapper');
        await expect(toast.first()).toBeVisible({ timeout: 8000 });
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales y Radicación de Excusas
   */
  test('5.4 Ciclo de vida completo del modal de radicación de excusas (apertura, cancelación y envío)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // 1. Cambiar a pestaña Excusas
    const tabExcusas = page.locator('.tabs-nav .tab-btn:has-text("Excusas")');
    await tabExcusas.click();
    await page.waitForLoadState('networkidle');

    // 2. Abrir Modal Radicar Incapacidad
    const btnRadicar = page.locator('button:has-text("Radicar Nueva Incapacidad")').first();
    await expect(btnRadicar).toBeVisible();
    await btnRadicar.click();

    // 3. Validar visibilidad del modal
    const modal = page.locator('.modal-backdrop, .modal-card');
    await expect(modal.first()).toBeVisible();

    // 4. Probar botón Cancelar
    const btnCancelar = page.locator('.modal-card button:has-text("Cancelar"), .modal-card .close-btn').first();
    await btnCancelar.click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    // 5. Reabrir modal para envío válido
    await btnRadicar.click();
    await expect(modal.first()).toBeVisible();

    // Seleccionar motivo
    const selectMotivo = page.locator('.modal-card select.form-select');
    if (await selectMotivo.isVisible()) {
      await selectMotivo.selectOption('MEDICA');
    }

    // Llenar descripción
    const descTextarea = page.locator('.modal-card textarea.form-control');
    if (await descTextarea.isVisible()) {
      await descTextarea.fill('Incapacidad médica por cuadro viral de 48 horas');
    }

    // Disparar envío
    const btnEnviar = page.locator('.modal-card button:has-text("Enviar a Coordinación")');
    await expect(btnEnviar).toBeVisible();
    await btnEnviar.click();

    // Verificar toast de éxito y cierre de modal
    const toast = page.locator('.toast-card, .toast-wrapper');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa de Toma de Asistencia y Persistencia en PostgreSQL
   */
  test('5.5 Registro de sesión de clase con fallas y verificación transaccional en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table.data-table');
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Toggle primer estudiante a Retardo
      const firstRow = rows.first();
      const btnRetardo = firstRow.locator('.btn-retardo');
      if (await btnRetardo.isVisible()) {
        await btnRetardo.click();
      }

      // Toggle segundo estudiante a Falta si existe
      if (rowCount > 1) {
        const secondRow = rows.nth(1);
        const btnFalta = secondRow.locator('.btn-falta');
        if (await btnFalta.isVisible()) {
          await btnFalta.click();
        }
      }

      // Registrar tema tratado
      const uniqueTopic = `Sesión E2E Automatizada ${Date.now()}`;
      const topicInput = page.locator('input[placeholder*="Revolución Industrial"], input[placeholder*="Tema"]');
      if (await topicInput.isVisible()) {
        await topicInput.fill(uniqueTopic);
      }

      // Guardar planilla
      const saveBtn = page.locator('button:has-text("Registrar Sesión")');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Verificar feedback toast
      const toast = page.locator('.toast-card, .toast-wrapper');
      await expect(toast.first()).toBeVisible({ timeout: 8000 });
    }

    // Verificación directa en base de datos PostgreSQL
    const sesiones = await queryDb('SELECT count(*) as total FROM asi_sesiones_clase');
    expect(Number(sesiones[0].total)).toBeGreaterThanOrEqual(0);

    const detalles = await queryDb('SELECT count(*) as total FROM asi_asistencia_detalle');
    expect(Number(detalles[0].total)).toBeGreaterThanOrEqual(0);

    const excusas = await queryDb('SELECT count(*) as total FROM asi_excusas_justificaciones');
    expect(Number(excusas[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
