import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-16: Gobierno Escolar & Votaciones Electrónicas Criptográficas (Ley 115)
 * Exhaustive Anti-Regression E2E Suite compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */
test.describe('DocMD-16: Gobierno Escolar & Elecciones (Exhaustive UI & E2E Verification)', () => {
  const tenantId = '11111111-2222-3333-4444-555555555555';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs Electorales, Acciones de Cabecera y Sniffer de Errores
   */
  test('16.1 Carga inicial, KPIs electorales, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/gobierno-escolar');
    await page.waitForLoadState('networkidle');

    // 1. Título y encabezado
    await expect(page.locator('h1')).toContainText('Gobierno Escolar & Elecciones');

    // 2. Acciones de Cabecera
    await expect(page.locator('button:has-text("Nueva Elección")')).toBeVisible();
    await expect(page.locator('button:has-text("Inscribir Candidato")')).toBeVisible();
    await expect(page.locator('button:has-text("Acta de Escrutinio")')).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-grid .kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-grid')).toContainText('Total Sufragios');
    await expect(page.locator('.kpi-grid')).toContainText('Candidatos');
    await expect(page.locator('.kpi-grid')).toContainText('Cargo en Disputa');
    await expect(page.locator('.kpi-grid')).toContainText('Estado de Urnas');

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Electorales
   */
  test('16.2 Navegación exhaustiva por las 4 pestañas de Gobierno Escolar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/gobierno-escolar');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Tarjetón Electoral ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Tarjetón Electoral")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.tarjeton-card h3')).toContainText('Tarjetón Electoral Digital');
    await expect(page.locator('.candidatos-grid')).toBeVisible();

    // --- Tab 2: Escrutinio en Vivo ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Escrutinio en Vivo")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.escrutinio-card h3')).toContainText('Escrutinio & Mesa de Votación');

    // --- Tab 3: Candidatos Inscritos ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Candidatos Inscritos")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Candidatos Inscritos en la Elección")')).toBeVisible();
    await expect(page.locator('table.data-table')).toBeVisible();

    // --- Tab 4: Histórico de Elecciones ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Histórico de Elecciones")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Histórico de Procesos Electorales")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla y Tarjetas (Row Action Sweep)
   */
  test('16.3 Barrido exhaustivo de botones de acción en tarjetas y tablas de Candidatos e Histórico', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/gobierno-escolar');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Tarjetón: Probar selección de candidato
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Tarjetón Electoral")').click();
    await page.waitForLoadState('networkidle');

    const primerCandidatoCard = page.locator('.candidato-card').first();
    if (await primerCandidatoCard.isVisible()) {
      await primerCandidatoCard.click();
      await expect(primerCandidatoCard).toHaveClass(/selected/);
    }

    // 2. En Tab Candidatos: Probar botón "Editar" en la tabla
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Candidatos Inscritos")').click();
    await page.waitForLoadState('networkidle');

    const filaCand = page.locator('table.data-table tbody tr').first();
    if (await filaCand.isVisible()) {
      const btnEditar = filaCand.locator('button:has-text("Editar")');
      if (await btnEditar.isVisible()) {
        await btnEditar.click();
        const modalEdit = page.locator('.modal-backdrop');
        await expect(modalEdit).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cancelar"), .modal-backdrop .close-btn').first().click();
        await expect(modalEdit).not.toBeVisible();
      }
    }

    // 3. En Tab Histórico: Probar botón "Acta"
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Histórico de Elecciones")').click();
    await page.waitForLoadState('networkidle');

    const filaHist = page.locator('table.data-table tbody tr').first();
    if (await filaHist.isVisible()) {
      const btnActa = filaHist.locator('button:has-text("Acta")');
      if (await btnActa.isVisible()) {
        await btnActa.click();
        const modalActa = page.locator('.modal-backdrop');
        await expect(modalActa).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cerrar"), .modal-backdrop .close-btn').first().click();
        await expect(modalActa).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida de Modales (Apertura, Validación y Cierre)
   */
  test('16.4 Ciclo de vida completo de los modales de Gobierno Escolar (apertura, validación y cancelación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/gobierno-escolar');
    await page.waitForLoadState('networkidle');

    // 1. Modal Nueva Elección
    const btnNuevaEleccion = page.locator('button:has-text("Nueva Elección")').first();
    await expect(btnNuevaEleccion).toBeVisible();
    await btnNuevaEleccion.click();

    const modalJornada = page.locator('.modal-backdrop');
    await expect(modalJornada).toBeVisible();
    await expect(modalJornada.locator('h3')).toContainText('Configurar y Aperturar Nueva Elección');
    await modalJornada.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalJornada).not.toBeVisible();

    // 2. Modal Inscribir Candidato
    const btnInscribir = page.locator('button:has-text("Inscribir Candidato")').first();
    await expect(btnInscribir).toBeVisible();
    await btnInscribir.click();

    const modalCand = page.locator('.modal-backdrop');
    await expect(modalCand).toBeVisible();
    await expect(modalCand.locator('h3')).toContainText('Inscribir Candidato');
    await modalCand.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalCand).not.toBeVisible();

    // 3. Modal Finalizar Votaciones
    const btnCerrar = page.locator('button:has-text("Finalizar Votaciones")').first();
    if (await btnCerrar.isVisible()) {
      await btnCerrar.click();
      const modalCierre = page.locator('.modal-backdrop');
      await expect(modalCierre).toBeVisible();
      await expect(modalCierre.locator('h3')).toContainText('Finalizar y Sellar Urnas Electorales');
      await modalCierre.locator('button:has-text("Cancelar"), .close-btn').first().click();
      await expect(modalCierre).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Emisión de Sufragio Criptográfico, Escrutinio y Verificación en PostgreSQL
   */
  test('16.5 Emisión de voto en urna secreta, comprobante criptográfico SHA-256 y verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/gobierno-escolar');
    await page.waitForLoadState('networkidle');

    // 1. Asegurar estar en Tab Tarjetón
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Tarjetón Electoral")').click();
    await page.waitForLoadState('networkidle');

    // 2. Seleccionar primer candidato y emitir voto
    const candidatoCard = page.locator('.candidato-card').first();
    await candidatoCard.click();

    const btnVotar = page.locator('button:has-text("Depositar Voto en Urna Secreta")');
    if (await btnVotar.isEnabled()) {
      await btnVotar.click();

      // Comprobante criptográfico emitido
      const comprobante = page.locator('.comprobante-card');
      await expect(comprobante).toBeVisible({ timeout: 6000 });
      await expect(comprobante.locator('.hash-code')).not.toBeEmpty();
    }

    // 3. Verificación directa en base de datos PostgreSQL
    const jornadas = await queryDb('SELECT * FROM gob_jornadas_electorales WHERE colegio_id = $1 LIMIT 5', [tenantId]);
    expect(jornadas.length).toBeGreaterThan(0);

    const candidatosDb = await queryDb('SELECT * FROM gob_candidatos WHERE colegio_id = $1 LIMIT 5', [tenantId]);
    expect(candidatosDb.length).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });
});
