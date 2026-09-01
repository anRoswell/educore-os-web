import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';

test.describe('DocMD-14: EduCore AI & Asistente Pedagógico RAG (PEI, SIEE & Analítica Predictiva)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('14.1 Should display EduCore AI Assistant page with RAG chat and pedagogical tools', async ({ page }) => {
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // Header & Subtitle assertions
    await expect(page.locator('h1')).toContainText('EduCore AI & Asistente Pedagógico RAG');
    await expect(page.locator('.chat-card h3')).toContainText('Asistente Institucional RAG');
    await expect(page.locator('.tools-card h3:has-text("Redactor")')).toBeVisible();
    await expect(page.locator('.tools-card h3:has-text("Predictor")')).toBeVisible();

    // Chat elements
    await expect(page.locator('.chat-messages-box')).toBeVisible();
    await expect(page.locator('.chat-input-box input')).toBeVisible();
    await expect(page.locator('.chat-input-box button')).toBeVisible();

    // Verify DB table existence
    const dbConv = await queryDb('SELECT count(*) as total FROM ai_conversaciones_asistente');
    expect(Number(dbConv[0].total)).toBeGreaterThanOrEqual(0);
  });

  test('14.2 Should execute RAG query about institutional PEI/SIEE with source citations (ai_conversaciones_asistente)', async ({ page }) => {
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    const question = '¿Cuáles son las causales de pérdida de año según el SIEE y el manual?';
    const input = page.locator('.chat-input-box input');
    await input.fill(question);

    const sendBtn = page.locator('.chat-input-box button');
    await sendBtn.click();

    // Wait for AI response in chat bubble
    const aiBubble = page.locator('.message-bubble.ai').last();
    await expect(aiBubble).toBeVisible({ timeout: 10000 });
    await expect(aiBubble.locator('.bubble-text')).toContainText('SIEE');
    await expect(aiBubble.locator('.source-tag')).toBeVisible();

    // PostgreSQL Direct Validation
    const convRows = await queryDb('SELECT * FROM ai_conversaciones_asistente WHERE pregunta_usuario = $1 ORDER BY created_at DESC LIMIT 1', [question]);
    expect(convRows.length).toBeGreaterThan(0);
    expect(convRows[0].tokens_usados).toBeGreaterThan(0);
  });

  test('14.3 Should generate AI narrative observation for student report card (ai_boletines_narrativos)', async ({ page, request }) => {
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // Select student in searchable select
    const studentTrigger = page.locator('.tool-section app-searchable-select .select-trigger').first();
    await studentTrigger.click();
    const studentOpt = page.locator('.tool-section app-searchable-select .option-item').first();
    await expect(studentOpt).toBeVisible({ timeout: 5000 });
    await studentOpt.click();

    // Click Generar Observación Pedagógica
    const generateBtn = page.locator('button:has-text("Generar Observación Pedagógica")');
    await generateBtn.click();

    // Verify generated output on page
    const outputBox = page.locator('.narrativa-output');
    await expect(outputBox).toBeVisible({ timeout: 10000 });
    await expect(outputBox.locator('p')).not.toBeEmpty();

    // Verify direct API endpoint and PostgreSQL persistence
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const matRows = await queryDb('SELECT id FROM mat_matriculas WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    const perRows = await queryDb('SELECT id FROM aca_periodos WHERE colegio_id = $1 LIMIT 1', [tenantId]);

    if (matRows.length > 0 && perRows.length > 0) {
      const apiRes = await request.post('http://127.0.0.1:3001/api/v1/ai/boletines/redactar-narrativa', {
        headers: {
          'x-colegio-id': tenantId,
          'Content-Type': 'application/json',
        },
        data: {
          matriculaId: matRows[0].id,
          periodoId: perRows[0].id,
        },
      });

      expect(apiRes.status()).toBe(201);
      const apiData = await apiRes.json();
      expect(apiData.narrativaGenerada).toBeDefined();

      // Verify in PostgreSQL
      const dbNarrativas = await queryDb('SELECT * FROM ai_boletines_narrativos WHERE matricula_id = $1 AND periodo_id = $2', [matRows[0].id, perRows[0].id]);
      expect(dbNarrativas.length).toBeGreaterThan(0);
      expect(dbNarrativas[0].observacion_narrativa_generada).toBeDefined();
    }
  });

  test('14.4 Should query multi-variable dropout risk prediction model (ai_scores_desercion)', async ({ request }) => {
    const tenantId = '11111111-2222-3333-4444-555555555555';

    const riskRes = await request.get('http://127.0.0.1:3001/api/v1/ai/prediccion-desercion', {
      headers: {
        'x-colegio-id': tenantId,
      },
    });

    expect(riskRes.status()).toBe(200);
    const riskData = await riskRes.json();
    expect(riskData.totalAnalizados).toBeDefined();
    expect(Array.isArray(riskData.rankingRiesgo)).toBe(true);

    if (riskData.rankingRiesgo.length > 0) {
      const studentRisk = riskData.rankingRiesgo[0];
      expect(studentRisk.scoreRiesgo).toBeDefined();
      expect(studentRisk.nivelRiesgo).toBeDefined();
      expect(Number(studentRisk.scoreRiesgo)).toBeGreaterThanOrEqual(0);
    }
  });
});
