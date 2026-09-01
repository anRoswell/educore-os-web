import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-15: Analytics & Business Intelligence BI Institucional (Rectoría & Analítica 360°)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('15.1 Should display Executive Rector BI Dashboard with institutional KPI summary cards (bi_metricas_consolidadas)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Assert Rector Dashboard Header
    await expect(page.locator('h1')).toContainText('Dashboard Ejecutivo & Analytics BI');
    await expect(page.locator('.badge-header')).toContainText('Business Intelligence BI');

    // Assert 4 KPI Cards
    await expect(page.locator('.kpi-label:has-text("ESTUDIANTES MATRICULADOS")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("APROBACIÓN ACADÉMICA")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("EFECTIVIDAD DE RECAUDO")')).toBeVisible();
    await expect(page.locator('.kpi-label:has-text("CARTERA POR COBRAR")')).toBeVisible();

    // Verify DB count
    const studentCount = await queryDb('SELECT count(*) as total FROM mat_matriculas WHERE colegio_id = $1', ['11111111-2222-3333-4444-555555555555']);
    expect(Number(studentCount[0].total)).toBeGreaterThan(0);
  });

  test('15.2 Should render Subject Failure Heatmap (Mapa de Calor: Rendimiento por Asignatura)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Assert Heatmap Card Title
    const heatmapTitle = page.locator('.heatmap-card h3');
    await expect(heatmapTitle).toContainText('Mapa de Calor: Rendimiento por Asignatura');

    // Assert table headers
    await expect(page.locator('.heatmap-card th:has-text("Grado")')).toBeVisible();
    await expect(page.locator('.heatmap-card th:has-text("Asignatura")')).toBeVisible();
    await expect(page.locator('.heatmap-card th:has-text("Promedio")')).toBeVisible();
    await expect(page.locator('.heatmap-card th:has-text("Reprobación")')).toBeVisible();
  });

  test('15.3 Should display Saber 11° Institutional Projections and component breakdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Assert Saber 11 Card
    const saberCard = page.locator('.ai-analytics-card');
    await expect(saberCard.locator('h3')).toContainText('Proyecciones Pruebas Saber 11°');

    // Assert component bars
    await expect(saberCard.locator('span:has-text("Lectura Crítica")')).toBeVisible();
    await expect(saberCard.locator('span:has-text("Matemáticas")')).toBeVisible();
  });

  test('15.4 Should verify BI consolidated metrics and database data in PostgreSQL (mv_bi_rendimiento_global / aca_calificaciones)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    // 1. Direct API call to dashboard-rectoria
    const dashRes = await request.get('http://127.0.0.1:3001/api/v1/analytics/dashboard-rectoria', {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(dashRes.status()).toBe(200);
    const kpiData = await dashRes.json();
    expect(kpiData.kpisDirectivos.totalEstudiantesMatriculados).toBeGreaterThan(0);
    expect(kpiData.kpisDirectivos.totalDocentesActivos).toBeGreaterThan(0);
    expect(kpiData.kpisDirectivos.porcentajeAprobacionAcademica).toBeDefined();

    // 2. Direct API call to saber11
    const saberRes = await request.get('http://127.0.0.1:3001/api/v1/analytics/simulacros-saber11', {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(saberRes.status()).toBe(200);
    const saberData = await saberRes.json();
    const pruebas = saberData.pruebasSaber11 || saberData;
    expect(pruebas.puntajeGlobalPromedio).toBeGreaterThan(0);
    expect(pruebas.componentes).toBeDefined();

    // 3. PostgreSQL Direct Assertions
    const califs = await queryDb('SELECT count(*) as total FROM aca_calificaciones WHERE colegio_id = $1', [tenantId]);
    expect(Number(califs[0].total)).toBeGreaterThan(0);
  });
});
