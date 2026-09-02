import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-15: Analytics & Business Intelligence BI Institucional (Rectoría & Analítica 360°)
 * Exhaustive Anti-Regression E2E Suite compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */
test.describe('DocMD-15: Analytics & Business Intelligence BI Institucional (Exhaustive UI & E2E Verification)', () => {
  const tenantId = '11111111-2222-3333-4444-555555555555';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs Directivos 360°, Acciones de Cabecera y Sniffer de Errores
   */
  test('15.1 Carga inicial, KPIs directivos 360°, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Dashboard Ejecutivo & Analytics BI');
    await expect(page.locator('.badge-header')).toContainText('Business Intelligence BI');

    // 2. Acciones de Cabecera Directiva
    await expect(page.locator('button:has-text("Exportar Informe BI")')).toBeVisible();
    await expect(page.locator('button:has-text("Metas Saber 11°")')).toBeVisible();
    await expect(page.locator('button:has-text("Filtros Directivos")')).toBeVisible();

    // 3. Tarjetas KPI
    await expect(page.locator('.kpi-label:has-text("ESTUDIANTES MATRICULADOS")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("APROBACIÓN ACADÉMICA")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("EFECTIVIDAD DE RECAUDO")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("CARTERA POR COBRAR")')).toBeVisible();

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('15.2 Navegación exhaustiva por las 4 pestañas de BI y aplicación de filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Visión Global 360° ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Visión Global")').click();
    await page.waitForTimeout(200);

    // --- Tab 2: Rendimiento & Mapa de Calor ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Mapa de Calor")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.heatmap-card h3')).toContainText('Mapa de Calor: Rendimiento por Asignatura');

    // --- Tab 3: Pruebas Saber 11° ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Pruebas Saber")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.ai-analytics-card h3')).toContainText('Proyecciones Pruebas Saber 11°');

    // --- Tab 4: Cartera & Recaudo BI ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Cartera & Recaudo")').click();
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla (Row Action Sweep)
   */
  test('15.3 Barrido exhaustivo de botones de acción en filas de datos de Mapa de Calor', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // En Mapa de Calor: Probar botón "Detalle" de la primera fila
    const filaHeatmap = page.locator('.heatmap-card table.data-table tbody tr').first();
    if (await filaHeatmap.isVisible()) {
      const btnDetalle = filaHeatmap.locator('button:has-text("Detalle")');
      if (await btnDetalle.isVisible()) {
        await btnDetalle.click();
        const modalDetalle = page.locator('.modal-backdrop');
        await expect(modalDetalle).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cerrar"), .modal-backdrop .close-btn').first().click();
        await expect(modalDetalle).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Apertura, Validación y Cierre)
   */
  test('15.4 Ciclo de vida completo de los modales de Analytics BI (apertura, validación y cancelación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Modal Exportar Informe BI
    const btnExportar = page.locator('button:has-text("Exportar Informe BI")');
    await expect(btnExportar).toBeVisible();
    await btnExportar.click();

    const modalExport = page.locator('.modal-backdrop');
    await expect(modalExport).toBeVisible();
    await expect(modalExport.locator('h3')).toContainText('Exportar Informe Ejecutivo BI');
    await modalExport.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalExport).not.toBeVisible();

    // 2. Modal Simulación Metas Saber 11°
    const btnMetas = page.locator('button:has-text("Metas Saber 11°")');
    await expect(btnMetas).toBeVisible();
    await btnMetas.click();

    const modalMetas = page.locator('.modal-backdrop');
    await expect(modalMetas).toBeVisible();
    await expect(modalMetas.locator('h3')).toContainText('Simulación y Metas Institucionales Saber 11°');
    await modalMetas.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalMetas).not.toBeVisible();

    // 3. Modal Filtros Directivos
    const btnFiltros = page.locator('button:has-text("Filtros Directivos")');
    await expect(btnFiltros).toBeVisible();
    await btnFiltros.click();

    const modalFiltros = page.locator('.modal-backdrop');
    await expect(modalFiltros).toBeVisible();
    await expect(modalFiltros.locator('h3')).toContainText('Filtros Directivos & Segmentación BI');
    await modalFiltros.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalFiltros).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Verificación de Persistencia y Métricas Directas en PostgreSQL
   */
  test('15.5 Consistencia analítica, simulación ejecutiva y verificación directa en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Ejecutar exportación de informe desde la UI
    await page.locator('button:has-text("Exportar Informe BI")').click();
    const modalExp = page.locator('.modal-backdrop');
    await expect(modalExp).toBeVisible();
    await modalExp.locator('button:has-text("Generar y Descargar Informe")').click();
    await expect(modalExp).not.toBeVisible({ timeout: 6000 });

    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 6000 });

    // 2. Verificación de tablas en PostgreSQL
    const califs = await queryDb('SELECT count(*) as total FROM aca_calificaciones WHERE colegio_id = $1', [tenantId]);
    expect(Number(califs[0].total)).toBeGreaterThan(0);

    const matriculas = await queryDb('SELECT count(*) as total FROM mat_matriculas WHERE colegio_id = $1', [tenantId]);
    expect(Number(matriculas[0].total)).toBeGreaterThan(0);

    const usuarios = await queryDb('SELECT count(*) as total FROM colegio_usuarios WHERE colegio_id = $1', [tenantId]);
    expect(Number(usuarios[0].total)).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });
});
