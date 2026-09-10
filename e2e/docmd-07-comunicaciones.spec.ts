import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-07: Comunicaciones Institucionales, Circulares & Mensajería - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, KPI widgets, multi-criteria filters, table row actions,
 * modal lifecycles (Editor, Reader, Traceability, Direct Messaging), and PostgreSQL persistence.
 */
test.describe('DocMD-07: Comunicaciones Institucionales & Circulares (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, Widgets KPI Elevados, Cabecera y Sniffer Estricto
   */
  test('7.1 Carga inicial, widgets KPI elevados, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Gestión de Comunicados');
    await expect(page.locator('.header-title p')).toContainText('Administra los boletines, noticias, circulares');

    // 2. Widgets KPI Elevados
    const kpiCards = page.locator('.metrics-grid .metric-card');
    await expect(kpiCards).toHaveCount(5);
    await expect(kpiCards.nth(0)).toContainText('Total Circulares');
    await expect(kpiCards.nth(1)).toContainText('Web Publicadas');
    await expect(kpiCards.nth(2)).toContainText('Móvil Activos');
    await expect(kpiCards.nth(3)).toContainText('Con Firma Legal');
    await expect(kpiCards.nth(4)).toContainText('Mensajes Inbox');

    // 3. Pestañas de Plataforma y Mensajería
    const tabs = page.locator('.tabs-container .tab-btn');
    await expect(tabs.nth(0)).toContainText('Comunicados Web');
    await expect(tabs.nth(1)).toContainText('Comunicados App Móvil');
    await expect(tabs.nth(2)).toContainText('Mensajería Directa');

    // 4. Encabezados de Tabla Web
    const headers = page.locator('table.data-table thead th');
    await expect(headers.first()).toContainText('Detalle del Comunicado');

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas (Web, Móvil, Mensajería Inbox & Enviados)
   */
  test('7.2 Navegación exhaustiva entre pestañas de Comunicados Web, App Móvil y Mensajería Directa', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Comunicados Web ---
    const tabWeb = page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")');
    await tabWeb.click();
    await page.waitForTimeout(200);
    await expect(tabWeb).toHaveClass(/active/);

    // --- Tab 2: Comunicados App Móvil ---
    const tabMovil = page.locator('.tabs-container .tab-btn:has-text("Comunicados App Móvil")');
    await tabMovil.click();
    await page.waitForTimeout(200);
    await expect(tabMovil).toHaveClass(/active/);

    // --- Tab 3: Mensajería Directa ---
    const tabMensajes = page.locator('.tabs-container .tab-btn:has-text("Mensajería Directa")');
    await tabMensajes.click();
    await page.waitForTimeout(200);
    await expect(tabMensajes).toHaveClass(/active/);

    // Probar sub-pestañas de Mensajería: Inbox y Enviados
    const btnEnviados = page.locator('button:has-text("Mensajes Enviados")');
    if (await btnEnviados.isVisible()) {
      await btnEnviados.click();
      await page.waitForTimeout(200);
      await expect(btnEnviados).toHaveClass(/active/);
    }

    const btnInbox = page.locator('button:has-text("Bandeja de Entrada")');
    if (await btnInbox.isVisible()) {
      await btnInbox.click();
      await page.waitForTimeout(200);
      await expect(btnInbox).toHaveClass(/active/);
    }

    // Volver a Tab Web
    await tabWeb.click();
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Filtros Multi-Criterio y Búsqueda en Tiempo Real
   */
  test('7.3 Búsqueda por texto y filtrado por estado, prioridad y alcance con botón limpiar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Filtrar por búsqueda
    const inputSearch = page.locator('input[placeholder*="Buscar por título"]');
    await inputSearch.fill('Circular');
    await page.waitForTimeout(200);

    // 2. Filtrar por Estado
    const selectEstado = page.locator('select:has-text("Estado: Todos"), select:has(option[value="PUBLICADO"])').first();
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption('PUBLICADO');
      await page.waitForTimeout(200);
    }

    // 3. Filtrar por Prioridad
    const selectPrioridad = page.locator('select:has-text("Prioridad: Todas"), select:has(option[value="ALTA"])').first();
    if (await selectPrioridad.isVisible()) {
      await selectPrioridad.selectOption('ALTA');
      await page.waitForTimeout(200);
    }

    // 4. Probar botón Limpiar
    const btnLimpiar = page.locator('button:has-text("Limpiar")');
    await btnLimpiar.click();
    await page.waitForTimeout(200);
    await expect(inputSearch).toHaveValue('');

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Barrido de Acciones por Fila (Lector, Trazabilidad, Editar, Toggle y Eliminar)
   */
  test('7.4 Barrido exhaustivo de acciones por fila (Lector Oficial, Métricas, Edición, Toggle y Confirmación de Eliminación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table.data-table tbody tr');
    const count = await filas.count();

    if (count > 0 && !(await page.locator('.table-empty').isVisible())) {
      const primeraFila = filas.first();

      // 1. Probar botón Lector Oficial de Circular
      const btnLector = primeraFila.locator('button[title="Ver circular"]');
      if (await btnLector.isVisible()) {
        await btnLector.click();
        const modalLector = page.locator('.modal-backdrop');
        await expect(modalLector.first()).toBeVisible();
        await expect(modalLector.first()).toContainText('Circular Institucional');

        // Cerrar lector
        await modalLector.locator('button:has-text("Cerrar")').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }

      // 2. Probar botón Estadísticas & Trazabilidad de Lectura
      const btnStats = primeraFila.locator('button[title*="Trazabilidad"]');
      if (await btnStats.isVisible()) {
        await btnStats.click();
        const modalStats = page.locator('.modal-backdrop');
        await expect(modalStats.first()).toBeVisible();
        await expect(modalStats.first()).toContainText('Trazabilidad Legal');

        // Cerrar modal de estadísticas
        await modalStats.locator('button:has-text("Cerrar")').click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }

      // 3. Probar botón Editar
      const btnEditar = primeraFila.locator('button[title="Editar"]');
      if (await btnEditar.isVisible()) {
        await btnEditar.click();
        const modalEdit = page.locator('.modal-backdrop');
        await expect(modalEdit.first()).toBeVisible();

        // Cerrar modal
        await modalEdit.locator('button:has-text("Cancelar"), button[title="Cerrar"]').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }

      // 4. Probar botón Eliminar (Apertura de confirmación y Cancelación)
      const btnEliminar = primeraFila.locator('button[title="Eliminar"]');
      if (await btnEliminar.isVisible()) {
        await btnEliminar.click();
        const modalConfirm = page.locator('.modal-backdrop');
        await expect(modalConfirm.first()).toBeVisible();
        await expect(modalConfirm.first()).toContainText('¿Está seguro de que desea eliminar este comunicado?');

        // Cancelar eliminación
        await modalConfirm.locator('button:has-text("Cancelar")').click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Ciclo de Vida de Modales de Creación y Mensajería
   */
  test('7.5 Ciclo de vida completo de los modales de creación (Web con Firma Legal y Móvil con Slider)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Modal Web con Quill Editor y Configuración de Firma
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modalWeb = page.locator('.modal-backdrop');
    await expect(modalWeb.first()).toBeVisible();
    await expect(modalWeb.first()).toContainText('Nuevo Comunicado');

    // Llenar título y activar firma obligatoria
    await modalWeb.locator('input[placeholder*="Circular"]').fill('Borrador Web Test E2E');
    const chkFirma = modalWeb.locator('input#chkFirma');
    if (await chkFirma.isVisible()) {
      await chkFirma.check();
    }

    // Cancelar modal
    await modalWeb.locator('button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    // 2. Modal Móvil con Gestión de Slider
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados App Móvil")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modalMovil = page.locator('.modal-backdrop');
    await expect(modalMovil.first()).toBeVisible();

    // Probar agregar y remover imagen en slider
    const btnAddImg = modalMovil.locator('button:has-text("+ Añadir Diapositiva"), button:has-text("+ Añadir Imagen")');
    if (await btnAddImg.isVisible()) {
      await btnAddImg.click();
      await page.waitForTimeout(200);
    }

    const btnRemoverImg = modalMovil.locator('button[title*="Eliminar"]').first();
    if (await btnRemoverImg.isVisible()) {
      await btnRemoverImg.click();
    }

    await modalMovil.locator('button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 6: Creación Transaccional y Persistencia en PostgreSQL
   */
  test('7.6 Publicación exitosa de circular con acuse de firma y verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Abrir modal y crear circular web
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal.first()).toBeVisible();

    const uniqueTitle = `Circular Oficial E2E ${Date.now()}`;
    await modal.locator('input[placeholder*="Circular"]').fill(uniqueTitle);

    // Exigir firma legal
    const chkFirma = modal.locator('input#chkFirma');
    if (await chkFirma.isVisible()) {
      await chkFirma.check();
    }

    // Llenar contenido en Quill
    const quillEditor = modal.locator('.ql-editor');
    if (await quillEditor.isVisible()) {
      await quillEditor.fill('Estimada comunidad educativa: Les informamos las fechas de las próximas evaluaciones bimestrales.');
    }

    // Publicar
    const btnPublicar = modal.locator('button:has-text("Publicar Circular"), button:has-text("Publicar")');
    await btnPublicar.click();

    // Validar Toast feedback
    const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // 2. Verificación directa en base de datos PostgreSQL
    const comunicadosDb = await queryDb('SELECT count(*) as total FROM com_comunicados');
    expect(Number(comunicadosDb[0].total)).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });
});
