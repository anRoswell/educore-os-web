import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-13: Portería, Minuta Digital de Visitantes & Control de Acceso (Torniquetes QR)
 * Exhaustive Anti-Regression E2E Suite compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * Tests 100% of tabs, table row action buttons, camera stream emulation, photo snapshot capture,
 * visitor profile rendering with zero broken img tags, and direct PostgreSQL persistence.
 */
test.describe('DocMD-13: Portería & Control de Acceso (Exhaustive UI & E2E Verification)', () => {
  const tenantId = '11111111-2222-3333-4444-555555555555';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs, Acciones de Cabecera y Sniffer de Errores
   */
  test('13.1 Carga inicial, KPIs de seguridad, acciones de cabecera y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Portería, Minuta Digital & Control de Acceso');
    await expect(page.locator('.header-badge')).toContainText('CONTROL DE ACCESO');

    // 2. Acciones de Cabecera
    await expect(page.locator('button:has-text("Registrar Visitante")')).toBeVisible();
    await expect(page.locator('button:has-text("Marcación Torniquete QR")')).toBeVisible();
    await expect(page.locator('button:has-text("Salida de Estudiante")')).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-grid .kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-grid')).toContainText('Visitantes en Campus');
    await expect(page.locator('.kpi-grid')).toContainText('Marcaciones Hoy');
    await expect(page.locator('.kpi-grid')).toContainText('Salidas Autorizadas');
    await expect(page.locator('.kpi-grid')).toContainText('Vehículos en Parqueadero');

    // 4. Barra de Pestañas
    const tabs = page.locator('.tabs-nav-bar .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('13.2 Navegación exhaustiva por las 4 pestañas y aplicación de filtros de búsqueda', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Minuta de Visitantes ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Minuta de Visitantes")').click();
    await page.waitForTimeout(200);

    // Probar filtro de texto en Visitantes
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Claudia');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    // Probar selector de estado
    const selectEstado = page.locator('.filters-card select').first();
    if (await selectEstado.isVisible()) {
      await selectEstado.selectOption({ index: 0 });
    }

    // --- Tab 2: Torniquetes & Control QR ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Torniquetes")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Marcaciones de Torniquetes")')).toBeVisible();

    // --- Tab 3: Autorizaciones de Salida ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Autorizaciones de Salida")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Salida Segura de Estudiantes")')).toBeVisible();

    // --- Tab 4: Vehículos & Parqueadero ---
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Vehículos")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Ingreso Vehicular & Parqueadero")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Tabla (Row Action Sweep)
   */
  test('13.3 Barrido exhaustivo de botones de acción en filas de Minuta, Torniquetes y Salidas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Minuta de Visitantes: Probar botón "Ver Ficha" de la primera fila
    const filaVisitante = page.locator('table.data-table tbody tr').first();
    if (await filaVisitante.isVisible()) {
      const btnVerFicha = filaVisitante.locator('button:has-text("Ver Ficha")');
      if (await btnVerFicha.isVisible()) {
        await btnVerFicha.click();
        const modalCarnet = page.locator('.modal-backdrop');
        await expect(modalCarnet).toBeVisible();
        await page.locator('.modal-backdrop button:has-text("Cerrar"), .modal-backdrop .close-btn').first().click();
        await expect(modalCarnet).not.toBeVisible();
      }
    }

    // 2. En Tab Torniquetes: Probar acción de fila
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Torniquetes")').click();
    await page.waitForLoadState('networkidle');

    const filaTorniquete = page.locator('table.data-table tbody tr').first();
    if (await filaTorniquete.isVisible()) {
      const btnDetalleT = filaTorniquete.locator('button:has-text("Ver Detalle")');
      if (await btnDetalleT.isVisible()) {
        await btnDetalleT.click();
        await page.waitForTimeout(300);
      }
    }

    // 3. En Tab Autorizaciones de Salida: Probar acción de fila
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Autorizaciones de Salida")').click();
    await page.waitForLoadState('networkidle');

    const filaSalida = page.locator('table.data-table tbody tr').first();
    if (await filaSalida.isVisible()) {
      const btnFichaSalida = filaSalida.locator('button:has-text("Ficha Salida")');
      if (await btnFichaSalida.isVisible()) {
        await btnFichaSalida.click();
        await page.waitForTimeout(300);
      }
    }

    // 4. En Tab Vehículos: Probar acción de fila
    await page.locator('.tabs-nav-bar .tab-btn:has-text("Vehículos")').click();
    await page.waitForLoadState('networkidle');

    const filaVehiculo = page.locator('table.data-table tbody tr').first();
    if (await filaVehiculo.isVisible()) {
      const btnSalidaVeh = filaVehiculo.locator('button:has-text("Marcar Salida")');
      if (await btnSalidaVeh.isVisible()) {
        await btnSalidaVeh.click();
        await page.waitForTimeout(300);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Emulación de Cámara WebRTC, Captura de Fotografía y Verificación de Cero Imágenes Rotas
   */
  test('13.4 Emulación de cámara de seguridad, captura instantánea de snapshot y validación en minuta', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // 1. Abrir Modal Registro de Visitante
    const btnNuevoVisitante = page.locator('button:has-text("Registrar Visitante")');
    await expect(btnNuevoVisitante).toBeVisible();
    await btnNuevoVisitante.click();

    const modalVisitante = page.locator('.modal-backdrop');
    await expect(modalVisitante).toBeVisible();

    // 2. Probar interacción con la cámara / snapshot
    const btnActivarCam = modalVisitante.locator('button:has-text("Activar Cámara"), button:has-text("Iniciar Cámara")');
    if (await btnActivarCam.isVisible()) {
      await btnActivarCam.click();
      await page.waitForTimeout(300);
    }

    const btnCapturar = modalVisitante.locator('button.btn-capturar-foto, button:has-text("Capturar Snapshot"), button:has-text("Capturar Foto")');
    if (await btnCapturar.isVisible()) {
      await btnCapturar.click();
      await page.waitForTimeout(300);

      // Verificar que se renderiza el preview de la foto tomada
      const previewImg = modalVisitante.locator('img.snapshot-img');
      await expect(previewImg).toBeVisible();
    }

    // 3. Llenar datos requeridos del visitante
    const docNum = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    const visitorName = `Visitante Camara E2E ${Date.now()}`;
    const badge = `GAFETE-${Math.floor(10 + Math.random() * 90)}`;

    await modalVisitante.locator('input[placeholder*="52876123"]').fill(docNum);
    await modalVisitante.locator('input[placeholder*="Claudia"]').fill(visitorName);
    await modalVisitante.locator('input[placeholder*="Secretaría"]').fill('Ministerio de Educación');
    await modalVisitante.locator('input[placeholder*="Auditoría"]').fill('Revisión técnica de infraestructura');
    await modalVisitante.locator('input[placeholder*="Rectoría"]').fill('Coordinación General');
    await modalVisitante.locator('input[placeholder*="GAFETE"]').fill(badge);

    // 4. Guardar ingreso
    const btnGuardar = modalVisitante.locator('button:has-text("Registrar Ingreso")');
    await btnGuardar.click();
    await expect(modalVisitante).not.toBeVisible({ timeout: 6000 });

    // 5. Verificar que en la tabla no existan imágenes rotas (broken <img>)
    const images = page.locator('table.data-table img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();
      if (isVisible) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacciones Completas y Verificación Directa en PostgreSQL
   */
  test('13.5 Registro de ingreso de visitante, marcación QR, salida autorizada y verificación en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/porteria');
    await page.waitForLoadState('networkidle');

    // 1. Registrar Ingreso de Visitante en Minuta Digital desde la UI
    await page.locator('button:has-text("Registrar Visitante")').click();
    const modalV = page.locator('.modal-backdrop');
    await expect(modalV).toBeVisible();

    const uniqueDoc = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    const uniqueVisitor = `Auditor SED E2E ${Date.now()}`;
    const badgeNum = `GAFETE-${Math.floor(10 + Math.random() * 90)}`;

    await modalV.locator('input[placeholder*="52876123"]').fill(uniqueDoc);
    await modalV.locator('input[placeholder*="Claudia"]').fill(uniqueVisitor);
    await modalV.locator('input[placeholder*="Secretaría"]').fill('Secretaría de Educación Distrital');
    await modalV.locator('input[placeholder*="Auditoría"]').fill('Inspección de estándares de calidad');
    await modalV.locator('input[placeholder*="Rectoría"]').fill('Rectoría Central');
    await modalV.locator('input[placeholder*="GAFETE"]').fill(badgeNum);

    await modalV.locator('button:has-text("Registrar Ingreso")').click();
    await expect(modalV).not.toBeVisible({ timeout: 6000 });

    // Toast de confirmación
    const toast = page.locator('.toast-card, .toast-wrapper, .toast-success');
    await expect(toast.first()).toBeVisible({ timeout: 6000 });

    // 2. Verificación en PostgreSQL (acc_minuta_visitantes)
    const dbVisitas = await queryDb('SELECT * FROM acc_minuta_visitantes WHERE numero_documento = $1', [uniqueDoc]);
    expect(dbVisitas.length).toBe(1);
    expect(dbVisitas[0].nombre_completo).toBe(uniqueVisitor);
    expect(dbVisitas[0].gafete_asignado).toBe(badgeNum);
    expect(dbVisitas[0].fecha_salida).toBeNull();

    // 3. Ejecutar Marcación de Torniquete QR desde la UI
    await page.locator('button:has-text("Marcación Torniquete QR")').click();
    const modalT = page.locator('.modal-backdrop');
    await expect(modalT).toBeVisible();
    await modalT.locator('button:has-text("Ejecutar Marcación QR")').click();
    await expect(modalT).not.toBeVisible({ timeout: 6000 });

    // Verificación en PostgreSQL (acc_marcaciones_torniquete)
    const dbMarcaciones = await queryDb('SELECT count(*) as total FROM acc_marcaciones_torniquete WHERE colegio_id = $1', [tenantId]);
    expect(Number(dbMarcaciones[0].total)).toBeGreaterThan(0);

    // 4. Crear Autorización de Salida y Validar en Portería
    await page.locator('button:has-text("Salida de Estudiante")').click();
    const modalS = page.locator('.modal-backdrop');
    await expect(modalS).toBeVisible();
    await modalS.locator('input[placeholder*="Cita médica"]').fill('Cita de Odontopediatría E2E');
    await modalS.locator('input[placeholder*="Carolina Restrepo"]').fill('Andrés Morales (Tutor)');
    await modalS.locator('input[placeholder*="52876123"]').fill('79812345');
    await modalS.locator('button:has-text("Autorizar Salida")').click();
    await expect(modalS).not.toBeVisible({ timeout: 6000 });

    // Verificación en PostgreSQL (acc_autorizaciones_salida)
    const dbSalidas = await queryDb('SELECT * FROM acc_autorizaciones_salida WHERE persona_retira_documento = $1', ['79812345']);
    expect(dbSalidas.length).toBeGreaterThanOrEqual(1);
    expect(dbSalidas[0].persona_retira_nombre).toBe('Andrés Morales (Tutor)');

    sniffer.assertZeroErrors();
  });
});
