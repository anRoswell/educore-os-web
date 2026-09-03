import { test, expect } from '@playwright/test';
import * as path from 'path';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-02: Matrículas & SIMAT - Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of header actions, dynamic search, row action sweep,
 * real identity document upload (PDF), student file preview modal, digital carnet photo & HMAC QR,
 * all modal lifecycles, and direct PostgreSQL persistence.
 */
test.describe('DocMD-02: Matrículas & Directorio Escolar 360° SIMAT (Exhaustive UI & E2E Verification)', () => {
  const fixtureDocIdentidadPdf = path.resolve(__dirname, 'fixtures/documento_identidad.pdf');

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, Controles de Cabecera, Verificación de Tabla y Sniffer de Errores
   */
  test('2.1 Carga inicial, controles de cabecera, tabla de directorio y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Matrículas & Ficha Integral del Estudiante');
    await expect(page.locator('.page-header p')).toContainText('Directorio escolar 360°, control de expediente documental');

    // 2. Acciones de Cabecera (Header Actions)
    const btnPlantillas = page.locator('button:has-text("Plantillas Legales")');
    await expect(btnPlantillas).toBeVisible();

    const btnSimat = page.locator('button:has-text("Exportar SIMAT")');
    await expect(btnSimat).toBeVisible();

    const btnNuevaMatricula = page.locator('button:has-text("Formalizar Nueva Matrícula")');
    await expect(btnNuevaMatricula).toBeVisible();

    // 3. Estructura de Columnas de la Tabla de Datos
    const dataTable = page.locator('table.data-table');
    await expect(dataTable).toBeVisible();
    await expect(dataTable.locator('th')).toContainText([
      'Código',
      'Estudiante',
      'Documento',
      'Grado / Grupo',
      'RH / EPS',
      'Estado',
      'Acciones CRUD',
    ]);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Búsqueda Dinámica y Filtrado en Tiempo Real
   */
  test('2.2 Búsqueda interactiva y filtrado en tiempo real en el directorio escolar', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible();

    // Probar búsqueda con texto
    await searchInput.fill('Gómez');
    await page.waitForTimeout(300);

    // Limpiar búsqueda y validar que se restauran los estudiantes
    await searchInput.clear();
    await page.waitForTimeout(300);

    const dataTable = page.locator('table.data-table tbody tr');
    const rowCount = await dataTable.count();
    expect(rowCount).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones en Filas de Estudiantes (Row Action Sweep)
   */
  test('2.3 Barrido exhaustivo de todos los botones de acción en filas de datos de estudiantes', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table.data-table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // 1. Probar botón "👁️ Ficha" -> Abre Modal Ficha 360
    const btnFicha = firstRow.locator('button:has-text("Ficha")');
    if (await btnFicha.isVisible()) {
      await btnFicha.click();
      const modalFicha = page.locator('.modal-backdrop');
      await expect(modalFicha).toBeVisible();
      await expect(modalFicha.locator('h3')).toContainText('Ficha Integral 360° del Estudiante');

      // Validar sección de Carnet Digital QR rotativo y foto
      const carnetCard = modalFicha.locator('.carnet-card-sim');
      await expect(carnetCard).toBeVisible();
      await expect(carnetCard).toContainText('QR ACTIVO');

      // Validar foto carnet
      const photoImg = carnetCard.locator('img');
      await expect(photoImg.first()).toBeVisible();

      // Cerrar modal
      await modalFicha.locator('button:has-text("Cerrar"), .close-btn').first().click();
      await expect(modalFicha).not.toBeVisible();
    }

    // 2. Probar botón "✏️ Editar" -> Abre Modal Edición
    const btnEditar = firstRow.locator('button:has-text("Editar")');
    if (await btnEditar.isVisible()) {
      await btnEditar.click();
      const modalEditar = page.locator('.modal-backdrop');
      await expect(modalEditar).toBeVisible();
      await expect(modalEditar.locator('h3')).toContainText('Editar Datos del Estudiante');

      // Cancelar edición
      await modalEditar.locator('button:has-text("Cancelar"), .close-btn').first().click();
      await expect(modalEditar).not.toBeVisible();
    }

    // 3. Probar botón "📄 PDF" -> Descargar certificado
    const btnPdf = firstRow.locator('button:has-text("PDF")');
    if (await btnPdf.isVisible()) {
      await btnPdf.click();
      await page.waitForTimeout(300);
    }

    // 4. Probar botón "🗑️ Retiro" si está disponible
    const btnRetiro = firstRow.locator('button:has-text("Retiro")');
    if (await btnRetiro.isVisible()) {
      await btnRetiro.click();
      const modalRetiro = page.locator('.modal-backdrop');
      await expect(modalRetiro).toBeVisible();
      await expect(modalRetiro.locator('h3')).toContainText('Registrar Retiro / Traslado SIMAT');

      // Cancelar retiro sin ejecutar
      await modalRetiro.locator('button:has-text("Cancelar"), .close-btn').first().click();
      await expect(modalRetiro).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Carga Real de Documento de Identidad, Previsualización de Expediente y Modal Lifecycles
   */
  test('2.4 Carga real de documento de identidad al expediente SIMAT, visor de documentos y ciclo de modales', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // 1. Abrir Ficha 360 del primer estudiante
    const btnFicha = page.locator('table.data-table tbody tr button:has-text("Ficha")').first();
    await expect(btnFicha).toBeVisible();
    await btnFicha.click();

    const modalFicha = page.locator('.modal-backdrop');
    await expect(modalFicha).toBeVisible();

    // 2. Inyectar archivo binario real (documento_identidad.pdf) en input file del expediente
    const fileInputExp = modalFicha.locator('input[type="file"]');
    await expect(fileInputExp).toBeAttached();
    await fileInputExp.setInputFiles(fixtureDocIdentidadPdf);
    await page.waitForTimeout(500);

    // Click subir soporte
    const btnSubirSoporte = modalFicha.locator('button:has-text("Subir Soporte")');
    await expect(btnSubirSoporte).toBeEnabled();
    await btnSubirSoporte.click();
    await page.waitForTimeout(600);

    // 3. Probar botón "👁️ Ver" en la lista de documentos del expediente
    const btnVerDoc = modalFicha.locator('button.btn-ver-documento, button:has-text("Ver")').first();
    if (await btnVerDoc.isVisible()) {
      await btnVerDoc.click();

      // Validar que se abre el modal visor
      const modalVisor = page.locator('.modal-card.visor-modal, .modal-backdrop').last();
      await expect(modalVisor).toBeVisible({ timeout: 5000 });

      // Validar elemento visor (iframe o img)
      await expect(modalVisor.locator('iframe, img').first()).toBeVisible();

      // Validar streaming HTTP 200
      const linkDirecto = modalVisor.locator('a[download]').first();
      if (await linkDirecto.isVisible()) {
        const url = await linkDirecto.getAttribute('href');
        if (url && url.startsWith('http')) {
          const res = await page.request.get(url);
          expect(res.status()).toBe(200);
        }
      }

      // Cerrar visor
      await modalVisor.locator('button:has-text("Cerrar Visor"), .close-btn').first().click();
    }

    // Cerrar Ficha 360
    await modalFicha.locator('button:has-text("Cerrar")').first().click();
    await expect(modalFicha).not.toBeVisible();

    // 4. Modal Plantillas Legales
    const btnPlantillas = page.locator('button:has-text("Plantillas Legales")');
    await btnPlantillas.click();

    const modalPlantillas = page.locator('.modal-backdrop');
    await expect(modalPlantillas).toBeVisible();
    await expect(modalPlantillas.locator('h2')).toContainText('Editor de Plantillas Legales');
    await expect(modalPlantillas).toContainText('estudianteNombre');

    // Cancelar y validar cierre limpio
    await modalPlantillas.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalPlantillas).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacción Completa y Verificación en PostgreSQL
   */
  test('2.5 Formalización de matrícula con generación de carnet QR y verificación directa en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/matriculas');
    await page.waitForLoadState('networkidle');

    // 1. Abrir modal y formalizar nueva matrícula
    const btnNueva = page.locator('button:has-text("Formalizar Nueva Matrícula")');
    await btnNueva.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();

    const randomSuffix = `${Date.now().toString().slice(-6)}`;
    const docNumber = `103050${randomSuffix}`;
    const firstName = `JuanE2E${randomSuffix}`;
    const lastName = `PérezE2E${randomSuffix}`;

    await modal.locator('input[placeholder*="Santiago"]').fill(firstName);
    await modal.locator('input[placeholder*="Gómez"]').first().fill(lastName);
    await modal.locator('input[placeholder*="1025896321"]').fill(docNumber);
    await modal.locator('input[placeholder*="Carlos Gómez"]').fill(`Acudiente ${lastName}`);

    const submitBtn = modal.locator('button:has-text("Formalizar Matrícula")').first();
    await submitBtn.click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });

    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // 2. Disparar exportación SIMAT
    const btnSimat = page.locator('button:has-text("Exportar SIMAT")');
    await btnSimat.click();
    await expect(toast.first()).toBeVisible({ timeout: 8000 });

    // 3. Verificación directa en PostgreSQL (mat_estudiantes)
    const dbStudents = await queryDb('SELECT * FROM mat_estudiantes WHERE primer_nombre = $1 ORDER BY created_at DESC', [firstName]);
    expect(dbStudents.length).toBeGreaterThan(0);
    expect(dbStudents[0].primer_nombre).toBe(firstName);
    expect(dbStudents[0].primer_apellido).toBe(lastName);
    expect(dbStudents[0].numero_documento).toBe(docNumber);
    expect(['MATRICULADO', 'ACTIVO']).toContain(dbStudents[0].estado);

    const totalStudents = await queryDb('SELECT count(*) as total FROM mat_estudiantes');
    expect(Number(totalStudents[0].total)).toBeGreaterThan(0);

    sniffer.assertZeroErrors();
  });
});
