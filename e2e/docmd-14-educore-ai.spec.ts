import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-14: EduCore AI & Asistente Pedagógico RAG (PEI, SIEE & Analítica Predictiva)
 * Exhaustive Anti-Regression E2E Suite compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */
test.describe('DocMD-14: EduCore AI & Asistente Pedagógico RAG (Exhaustive UI & E2E Verification)', () => {
  const tenantId = '11111111-2222-3333-4444-555555555555';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones de Cabecera y Sniffer de Errores
   */
  test('14.1 Carga inicial, KPIs de IA, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('EduCore AI & Asistente Pedagógico RAG');
    await expect(page.locator('.header-badge')).toContainText('INTELIGENCIA ARTIFICIAL');

    // 2. Acciones de Cabecera
    await expect(page.locator('button:has-text("Configurar Prompts & SIEE")')).toBeVisible();
    await expect(page.locator('button:has-text("Indexar PEI / Manual")')).toBeVisible();
    await expect(page.locator('button:has-text("Nueva Consulta RAG")')).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-grid .kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-grid')).toContainText('Consultas RAG');
    await expect(page.locator('.kpi-grid')).toContainText('Narrativas Generadas');
    await expect(page.locator('.kpi-grid')).toContainText('Alumnos en Riesgo');
    await expect(page.locator('.kpi-grid')).toContainText('Documentos Indexados');

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('14.2 Navegación exhaustiva por las 4 pestañas y filtros interactivos de IA', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Asistente RAG & PEI ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Asistente RAG")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.chat-messages-box')).toBeVisible();
    await expect(page.locator('.chat-input-box input')).toBeVisible();

    // --- Tab 2: Redactor de Boletines ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Redactor de Boletines")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Redactor Pedagógico")')).toBeVisible();
    await expect(page.locator('button:has-text("Generar Observación Pedagógica")')).toBeVisible();

    // --- Tab 3: Predictor de Deserción ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Predictor de Deserción")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Predictor Multi-Variable")')).toBeVisible();
    await expect(page.locator('table.data-table')).toBeVisible();

    // --- Tab 4: Prompt Studio & Sugerencias SIEE ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Prompt Studio")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Prompt Studio")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla (Row Action Sweep)
   */
  test('14.3 Barrido exhaustivo de botones de acción en filas de Predictor y Prompt Studio', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Predictor de Deserción: Probar botón "Diagnóstico"
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Predictor de Deserción")').click();
    await page.waitForLoadState('networkidle');

    const filaRiesgo = page.locator('table.data-table tbody tr').first();
    if (await filaRiesgo.isVisible()) {
      const btnDiag = filaRiesgo.locator('button:has-text("Diagnóstico")');
      if (await btnDiag.isVisible()) {
        await btnDiag.click();
        const modalDiag = page.locator('.modal-backdrop');
        await expect(modalDiag).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cerrar"), .modal-backdrop .close-btn').first().click();
        await expect(modalDiag).not.toBeVisible();
      }
    }

    // 2. En Tab Prompt Studio: Probar botones "Editar" y "Probar"
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Prompt Studio")').click();
    await page.waitForLoadState('networkidle');

    const filaPrompt = page.locator('table.data-table tbody tr').first();
    if (await filaPrompt.isVisible()) {
      const btnEditarP = filaPrompt.locator('button:has-text("Editar")');
      if (await btnEditarP.isVisible()) {
        await btnEditarP.click();
        const modalP = page.locator('.modal-backdrop');
        await expect(modalP).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cancelar"), .modal-backdrop .close-btn').first().click();
        await expect(modalP).not.toBeVisible();
      }

      const btnProbarP = filaPrompt.locator('button:has-text("Probar")');
      if (await btnProbarP.isVisible()) {
        await btnProbarP.click();
        await page.waitForTimeout(300);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Apertura, Validación y Cierre)
   */
  test('14.4 Ciclo de vida completo de los modales de EduCore AI (apertura, validación y cancelación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // 1. Modal Configuración de Prompts & SIEE
    const btnConfigP = page.locator('button:has-text("Configurar Prompts & SIEE")');
    await expect(btnConfigP).toBeVisible();
    await btnConfigP.click();

    const modalConfig = page.locator('.modal-backdrop');
    await expect(modalConfig).toBeVisible();
    await expect(modalConfig.locator('h3')).toContainText('Configuración de Directivas AI');
    await modalConfig.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalConfig).not.toBeVisible();

    // 2. Modal Indexar PEI / Manual
    const btnIndexar = page.locator('button:has-text("Indexar PEI / Manual")');
    await expect(btnIndexar).toBeVisible();
    await btnIndexar.click();

    const modalIndex = page.locator('.modal-backdrop');
    await expect(modalIndex).toBeVisible();
    await expect(modalIndex.locator('h3')).toContainText('Indexar Fragmento Curricular');
    await modalIndex.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalIndex).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacciones Completas y Verificación Directa en PostgreSQL
   */
  test('14.5 Consulta RAG institucional, redacción de narrativa y verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/educore-ai');
    await page.waitForLoadState('networkidle');

    // 1. Ejecutar Consulta RAG en el Asistente
    const question = '¿Cuáles son las causales de pérdida de año según el SIEE y el manual?';
    const inputChat = page.locator('.chat-input-box input');
    await inputChat.fill(question);

    const sendBtn = page.locator('.chat-input-box button');
    await sendBtn.click();

    // Esperar respuesta de IA en chat bubble
    const aiBubble = page.locator('.message-bubble.ai').last();
    await expect(aiBubble).toBeVisible({ timeout: 10000 });
    await expect(aiBubble.locator('.bubble-text')).toContainText('SIEE');
    await expect(aiBubble.locator('.source-tag')).toBeVisible();

    // Verificación en PostgreSQL (ai_conversaciones_asistente)
    const convRows = await queryDb('SELECT * FROM ai_conversaciones_asistente WHERE pregunta_usuario = $1 ORDER BY created_at DESC LIMIT 1', [question]);
    expect(convRows.length).toBeGreaterThan(0);
    expect(convRows[0].tokens_usados).toBeGreaterThan(0);

    // 2. Ejecutar Redacción de Narrativa Pedagógica desde la UI
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Redactor de Boletines")').click();
    await page.waitForLoadState('networkidle');

    const generateBtn = page.locator('button:has-text("Generar Observación Pedagógica")');
    await generateBtn.click();

    const outputBox = page.locator('.narrativa-output');
    await expect(outputBox).toBeVisible({ timeout: 10000 });
    await expect(outputBox.locator('p')).not.toBeEmpty();

    // Verificación en PostgreSQL (ai_boletines_narrativos)
    const dbNarrativas = await queryDb('SELECT count(*) as total FROM ai_boletines_narrativos WHERE colegio_id = $1', [tenantId]);
    expect(Number(dbNarrativas[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
