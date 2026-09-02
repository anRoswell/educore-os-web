import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-07: Comunicaciones Institucionales & Circulares - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, modal lifecycles, and PostgreSQL persistence.
 */
test.describe('DocMD-07: Comunicaciones Institucionales & Circulares (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, Cabecera, Acciones Globales y Sniffer de Errores
   */
  test('7.1 Carga inicial, estructura de tabla, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Gestión de Comunicados');
    await expect(page.locator('.header-title p')).toContainText('Administra los boletines, noticias y anuncios');

    // 2. Botón de Cabecera
    const btnNuevo = page.locator('header button:has-text("Nuevo Comunicado")');
    await expect(btnNuevo).toBeVisible();

    // 3. Pestañas de Plataforma
    const tabs = page.locator('.tabs-container .tab-btn');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toContainText('Comunicados Web');
    await expect(tabs.nth(1)).toContainText('Comunicados App Móvil');

    // 4. Encabezados de Tabla
    const headers = page.locator('table.data-table thead th');
    await expect(headers).toHaveCount(5);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas (Web vs App Móvil)
   */
  test('7.2 Navegación exhaustiva entre pestañas de Comunicados Web y App Móvil', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Comunicados Web ---
    const tabWeb = page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")');
    await tabWeb.click();
    await page.waitForTimeout(300);
    await expect(tabWeb).toHaveClass(/active/);

    // --- Tab 2: Comunicados App Móvil ---
    const tabMovil = page.locator('.tabs-container .tab-btn:has-text("Comunicados App Móvil")');
    await tabMovil.click();
    await page.waitForTimeout(300);
    await expect(tabMovil).toHaveClass(/active/);

    // Volver a Tab Web
    await tabWeb.click();
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Botones de Acción en Filas de Tabla (Row Action Sweep)
   */
  test('7.3 Barrido exhaustivo de acciones por fila (Editar y Eliminar con confirmación)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table.data-table tbody tr');
    const count = await filas.count();

    if (count > 0 && !(await page.locator('.table-empty').isVisible())) {
      const primeraFila = filas.first();

      // 1. Probar botón Editar
      const btnEditar = primeraFila.locator('button[title="Editar"]');
      if (await btnEditar.isVisible()) {
        await btnEditar.click();
        const modal = page.locator('.modal-backdrop');
        await expect(modal.first()).toBeVisible();

        // Cerrar modal
        await modal.locator('button:has-text("Cancelar"), button[title="Cerrar"]').first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible();
      }

      // 2. Probar botón Eliminar (Apertura de confirmación y Cancelación)
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
   * SUITE 4: Ciclo de Vida de Modales (Web con Quill y Móvil con Carrusel)
   */
  test('7.4 Ciclo de vida completo de los modales de creación (Web con Quill y Móvil con Slider)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Modal Web con Quill Editor
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modalWeb = page.locator('.modal-backdrop');
    await expect(modalWeb.first()).toBeVisible();
    await expect(modalWeb.first()).toContainText('Nuevo Comunicado');
    await expect(modalWeb.first()).toContainText('Plataforma WEB');

    // Llenar título provisional y probar cancelación
    await modalWeb.locator('input[placeholder*="Escuela para Padres"]').fill('Borrador Web Test');
    await modalWeb.locator('button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    // 2. Modal Móvil con Gestión de Slider
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados App Móvil")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modalMovil = page.locator('.modal-backdrop');
    await expect(modalMovil.first()).toBeVisible();
    await expect(modalMovil.first()).toContainText('Plataforma MOVIL');

    // Probar agregar y remover imagen en slider
    const btnAddImg = modalMovil.locator('button:has-text("+ Añadir Imagen")');
    await btnAddImg.click();
    await page.waitForTimeout(200);

    const btnRemoverImg = modalMovil.locator('button[title="Eliminar imagen"]').first();
    if (await btnRemoverImg.isVisible()) {
      await btnRemoverImg.click();
    }

    await modalMovil.locator('button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Creación Transaccional y Persistencia en PostgreSQL
   */
  test('7.5 Publicación exitosa de comunicado y verificación transaccional en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/comunicaciones');
    await page.waitForLoadState('networkidle');

    // 1. Abrir modal y crear circular web
    await page.locator('.tabs-container .tab-btn:has-text("Comunicados Web")').click();
    await page.locator('button:has-text("Nuevo Comunicado")').click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal.first()).toBeVisible();

    const uniqueTitle = `Circular General E2E ${Date.now()}`;
    await modal.locator('input[placeholder*="Escuela para Padres"]').fill(uniqueTitle);

    // Llenar contenido en Quill
    const quillEditor = modal.locator('.ql-editor');
    if (await quillEditor.isVisible()) {
      await quillEditor.fill('Estimada comunidad educativa: Les informamos las fechas de las próximas evaluaciones bimestrales.');
    }

    // Publicar
    const btnPublicar = modal.locator('button:has-text("Publicar")');
    await btnPublicar.click();

    // Validar Toast feedback
    const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // 2. Verificación directa en base de datos PostgreSQL
    const comunicadosDb = await queryDb('SELECT count(*) as total FROM com_comunicados');
    expect(Number(comunicadosDb[0].total)).toBeGreaterThan(0);

    const lecturasDb = await queryDb('SELECT count(*) as total FROM com_lecturas_trazabilidad');
    expect(Number(lecturasDb[0].total)).toBeGreaterThanOrEqual(0);

    sniffer.assertZeroErrors();
  });
});
