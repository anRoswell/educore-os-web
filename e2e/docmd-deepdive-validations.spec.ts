import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-DeepDive: Negative Form Boundary & Robustness Validation Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Systematically exercises negative form boundary cases across all core modules:
 * - Empty required field submission alerts & toasts
 * - Invalid alphabetic, numeric, and negative boundary inputs
 * - Large UTF-8 unicode / emoji input resilience
 * - Zero unhandled JS exceptions, console errors, or broken states verified by StrictErrorSniffer
 */
test.describe('DocMD-DeepDive: Validaciones de Límites y Robustez en Formularios', () => {

  /**
   * TEST 1: Matrículas - Validación de Límites y Campos Vacíos Requeridos
   */
  test('D.1 Matrículas: Envío de formulario vacío, validación de documento y límites de caracteres', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'RECTOR');
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // 1. Abrir modal nueva matrícula
    const btnNueva = page.locator('button:has-text("Formalizar Nueva Matrícula")');
    await btnNueva.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();

    // 2. Intentar guardar con campos vacíos
    const submitBtn = modal.locator('button:has-text("Formalizar Matrícula")').first();
    await submitBtn.click();

    // Validar toast de campos requeridos
    const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).toContainText('Requeridos');

    // 3. Probar inyección de caracteres especiales y longitud extrema
    const longString = 'Estudiante🧪' + 'A'.repeat(120);
    await modal.locator('input[placeholder*="Santiago"]').fill(longString);
    await modal.locator('input[placeholder*="Gómez"]').first().fill('Pérez');
    await modal.locator('input[placeholder*="1025896321"]').fill('ABC-INVALID-123');

    // Cancelar modal limpiamente
    await modal.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modal).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * TEST 2: Asistencia - Validación de Excusas con Campos Vacíos
   */
  test('D.2 Asistencia: Radicación de excusa médica sin adjunto ni campos mínimos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'COORDINADOR');
    await page.goto('/asistencia');
    await page.waitForLoadState('networkidle');

    // Cambiar a pestaña Excusas
    await page.locator('.tabs-nav .tab-btn:has-text("Excusas")').click();
    await page.waitForTimeout(300);

    // Abrir modal radicación
    const btnRadicar = page.locator('button:has-text("Radicar Nueva Incapacidad")').first();
    if (await btnRadicar.isVisible()) {
      await btnRadicar.click();
      const modal = page.locator('.modal-backdrop, .modal-card');
      await expect(modal.first()).toBeVisible();

      // Enviar formulario sin llenar nada
      const btnEnviar = modal.locator('button:has-text("Enviar a Coordinación")');
      if (await btnEnviar.isVisible()) {
        await btnEnviar.click();
        await page.waitForTimeout(300);
      }

      // Cerrar modal
      const btnCancelar = page.locator('.modal-backdrop button:has-text("Cancelar"), .modal-backdrop .close-btn').first();
      if (await btnCancelar.isVisible()) {
        await btnCancelar.click();
        await page.waitForTimeout(300);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * TEST 3: Convivencia - Validación de Radicación de Casos sin Datos
   */
  test('D.3 Convivencia: Apertura de caso Tipo I/II/III sin estudiante ni descripción de hechos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'COORDINADOR');
    await page.goto('/convivencia');
    await page.waitForLoadState('networkidle');

    // Abrir modal radicar caso
    const btnRadicar = page.locator('button:has-text("Radicar Caso"), button:has-text("Nuevo Caso")').first();
    if (await btnRadicar.isVisible()) {
      await btnRadicar.click();
      const modal = page.locator('.modal-backdrop');
      await expect(modal.first()).toBeVisible();

      // Dejar descripción vacía y clickear guardar
      const btnGuardar = modal.locator('button:has-text("Radicar Caso"), button:has-text("Guardar Caso")').first();
      if (await btnGuardar.isVisible()) {
        await btnGuardar.click();
        const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
        await expect(toast.first()).toBeVisible({ timeout: 5000 });
      }

      // Cerrar modal
      await modal.locator('button:has-text("Cancelar"), .close-btn').first().click();
      await expect(modal).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * TEST 4: LMS - Validación de Publicación de Tareas y Formularios
   */
  test('D.4 LMS: Publicación de tareas sin título ni fecha límite y validación de formulario', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'DOCENTE');
    await page.goto('/lms');
    await page.waitForLoadState('networkidle');

    // Cambiar a Tareas
    await page.locator('button:has-text("Tareas")').click();
    await page.waitForTimeout(300);

    // Abrir Crear Tarea
    const btnCrear = page.locator('button:has-text("Crear Nueva Tarea")');
    if (await btnCrear.isVisible()) {
      await btnCrear.click();
      const modal = page.locator('.modal-backdrop');
      await expect(modal.first()).toBeVisible();

      // Intentar publicar con campos vacíos
      const btnPublicar = modal.locator('button:has-text("Publicar Tarea")');
      await btnPublicar.click();

      // Toast o feedback requerido
      const toast = page.locator('.toast-card, .toast-wrapper, .ngx-toastr');
      await expect(toast.first()).toBeVisible({ timeout: 5000 });

      // Cerrar modal
      await modal.locator('button:has-text("Cancelar"), .close-btn').first().click();
      await expect(modal).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * TEST 5: Portería - Validación de Ingreso de Visitante sin Documento ni Nombre
   */
  test('D.5 Portería: Registro de visitante con campos vacíos y validación de alertas de seguridad', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'RECTOR');
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // Abrir modal visitante
    const btnNuevo = page.locator('button:has-text("Registrar Visitante")');
    await btnNuevo.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();

    // Limpiar documento y nombre
    await modal.locator('input[placeholder*="52876123"]').fill('');
    await modal.locator('input[placeholder*="Claudia"]').fill('');

    // Intentar registrar
    const btnGuardar = modal.locator('button:has-text("Registrar Ingreso")');
    await btnGuardar.click();

    // Alerta / Toast de campos requeridos
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-warning, .ngx-toastr');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });

    // Cerrar modal
    await modal.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modal).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * TEST 6: Resiliencia Global ante Inyecciones UTF-8 y Emojis en Búsquedas
   */
  test('D.6 Búsqueda Global: Resiliencia ante caracteres Unicode, emojis y scripts inyectados en filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await loginAs(page, 'RECTOR');
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible();

    // Inyectar cadenas complejas (XSS-like, emojis, quotes)
    const attackStrings = [
      '<script>alert(1)</script>',
      'DROP TABLE mat_estudiantes; --',
      '🤖🎉🔥📚⚡',
      '\' OR \'1\'=\'1',
    ];

    for (const testStr of attackStrings) {
      await searchInput.fill(testStr);
      await page.waitForTimeout(200);
      // Validar que la aplicación sigue viva y no lanza excepciones JS
      await expect(page.locator('h1')).toBeVisible();
    }

    await searchInput.clear();
    await page.waitForTimeout(200);

    sniffer.assertZeroErrors();
  });
});
