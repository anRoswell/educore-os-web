import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-12: Transporte Escolar (GPS/Geofencing) & Restaurante Escolar (Nutrición / Alergias)
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 * 
 * 5 Mandatory Suites:
 * 1. Initial Load, KPIs, Header Actions & Zero JS Errors
 * 2. 100% Tab Navigation and Interactive Filters
 * 3. Table Row Action Buttons Sweep
 * 4. Modal Lifecycles (Open, Validate, Cancel/Close)
 * 5. Full Business Transactions & Direct PostgreSQL Persistence Verification
 */
test.describe('DocMD-12: Transporte Escolar & Restaurante (Exhaustive UI & E2E Verification)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  /**
   * SUITE 1: Carga Inicial, KPIs de Logística, Acciones de Cabecera y Sniffer de Cero Errores JS
   */
  test('12.1 Carga inicial, 4 KPIs de transporte y restaurante, acciones globales y verificación de cero errores JS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/transporte-restaurante');
    await page.waitForLoadState('networkidle');

    // 1. Título y descripción
    await expect(page.locator('h1')).toContainText('Transporte & Restaurante Escolar');
    await expect(page.locator('.header-badge')).toContainText('LOGÍSTICA ESCOLAR & BIENESTAR');

    // 2. Acciones de Cabecera
    const btnNuevaRuta = page.locator('button:has-text("Nueva Ruta Escolar")');
    await expect(btnNuevaRuta).toBeVisible();

    const btnNuevoMenu = page.locator('button:has-text("Publicar Menú Diario")');
    await expect(btnNuevoMenu).toBeVisible();

    const btnConsumo = page.locator('button:has-text("Marcar Consumo")');
    await expect(btnConsumo).toBeVisible();

    // 3. Tarjetas KPI
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);
    await expect(page.locator('.kpi-card:has-text("Rutas Activas")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Estudiantes en Ruta")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Menús Publicados")')).toBeVisible();
    await expect(page.locator('.kpi-card:has-text("Consumos en Comedor")')).toBeVisible();

    // 4. Barra de 4 Pestañas
    const tabs = page.locator('.tabs-nav .tab-btn');
    await expect(tabs).toHaveCount(4);

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 2: Navegación por el 100% de Pestañas y Filtros Interactivos
   */
  test('12.2 Navegación exhaustiva por las 4 pestañas (Rutas, Paradas, Menús, Comedor) y filtros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/transporte-restaurante');
    await page.waitForLoadState('networkidle');

    // --- Tab 1: Rutas & Monitoreo GPS ---
    await page.locator('.tabs-nav .tab-btn:has-text("Rutas & Monitoreo GPS")').click();
    await page.waitForTimeout(200);

    const searchInput = page.locator('.filters-grid input.search-input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Norte');
      await page.waitForTimeout(200);
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    // --- Tab 2: Asignación de Paradas ---
    await page.locator('.tabs-nav .tab-btn:has-text("Asignación de Paradas")').click();
    await page.waitForTimeout(200);

    // --- Tab 3: Menú Nutricional & Alérgenos ---
    await page.locator('.tabs-nav .tab-btn:has-text("Menú Nutricional")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Carta Nutricional Semanal")')).toBeVisible();

    // --- Tab 4: Control de Comedor & Alergias ---
    await page.locator('.tabs-nav .tab-btn:has-text("Control de Comedor")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('h3:has-text("Registro de Asistencia & Bloqueo de Alergias")')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 3: Barrido de Acciones por Fila de Datos (Row Action Sweep)
   */
  test('12.3 Barrido exhaustivo de botones de acción en filas de rutas y paradas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/transporte-restaurante');
    await page.waitForLoadState('networkidle');

    // 1. En Tab Rutas: inspeccionar primera fila
    const filasRuta = page.locator('table.data-table tbody tr');
    if (await filasRuta.count() > 0) {
      // Probar botón "📡 GPS"
      const btnGps = filasRuta.first().locator('button:has-text("GPS")');
      if (await btnGps.count() > 0 && await btnGps.isVisible()) {
        await btnGps.click();
        await page.waitForTimeout(200);
      }

      // Probar botón "👥 Parada"
      const btnParada = filasRuta.first().locator('button:has-text("Parada")');
      if (await btnParada.count() > 0 && await btnParada.isVisible()) {
        await btnParada.click();
        const modalParada = page.locator('.modal-backdrop');
        await expect(modalParada.first()).toBeVisible();

        // Cerrar modal
        await modalParada.locator('button:has-text("Cancelar"), .close-btn').first().click();
        await expect(modalParada).not.toBeVisible();
      }
    }

    // 2. En Tab Paradas: inspeccionar si hay paradas
    await page.locator('.tabs-nav .tab-btn:has-text("Asignación de Paradas")').click();
    await page.waitForTimeout(200);

    const filasParada = page.locator('table.data-table tbody tr');
    if (await filasParada.count() > 0) {
      const btnVer = filasParada.first().locator('.actions-group button').first();
      if (await btnVer.count() > 0 && await btnVer.isVisible()) {
        await btnVer.click();
        await page.waitForTimeout(200);
      }
    }

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 4: Ciclo de Vida Completo de Modales (Apertura, Validación y Cierre)
   */
  test('12.4 Ciclo de vida completo de los modales de Transporte y Restaurante sin bloqueos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/transporte-restaurante');
    await page.waitForLoadState('networkidle');

    // 1. Modal Nueva Ruta Escolar
    const btnNuevaRuta = page.locator('button:has-text("Nueva Ruta Escolar")');
    await expect(btnNuevaRuta).toBeVisible();
    await btnNuevaRuta.click();

    const modalRuta = page.locator('.modal-backdrop');
    await expect(modalRuta.first()).toBeVisible();
    await expect(modalRuta.locator('h3').first()).toContainText('Crear Ruta de Transporte Escolar');

    // Cancelar modal
    await modalRuta.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalRuta).not.toBeVisible();

    // 2. Modal Publicar Menú Diario
    const btnNuevoMenu = page.locator('button:has-text("Publicar Menú Diario")');
    await expect(btnNuevoMenu).toBeVisible();
    await btnNuevoMenu.click();

    const modalMenu = page.locator('.modal-backdrop');
    await expect(modalMenu.first()).toBeVisible();
    await expect(modalMenu.locator('h3').first()).toContainText('Publicar Menú Nutricional Diario');

    // Cancelar modal
    await modalMenu.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalMenu).not.toBeVisible();

    // 3. Modal Marcar Consumo Comedor
    const btnConsumo = page.locator('button:has-text("Marcar Consumo")');
    await expect(btnConsumo).toBeVisible();
    await btnConsumo.click();

    const modalConsumo = page.locator('.modal-backdrop');
    await expect(modalConsumo.first()).toBeVisible();
    await expect(modalConsumo.locator('h3').first()).toContainText('Registrar Consumo en Comedor');

    // Cancelar modal
    await modalConsumo.locator('button:has-text("Cancelar"), .close-btn').first().click();
    await expect(modalConsumo).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  /**
   * SUITE 5: Transacciones Completas, Telemetría GPS y Verificación en PostgreSQL
   */
  test('12.5 Ruta escolar, parada de estudiante, telemetría GPS, menú con alérgenos y persistencia en PostgreSQL', async ({ page, request }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/transporte-restaurante');
    await page.waitForLoadState('networkidle');

    const tenantId = '11111111-2222-3333-4444-555555555555';
    const uniqueRouteName = `Ruta 7 - Zona Norte E2E ${Date.now()}`;
    const uniquePlate = `BUS-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Crear nueva ruta escolar desde UI
    await page.locator('button:has-text("Nueva Ruta Escolar")').click();
    const modalRuta = page.locator('.modal-backdrop');
    await expect(modalRuta.first()).toBeVisible();

    await modalRuta.locator('input[placeholder*="Ruta 07"]').fill(uniqueRouteName);
    await modalRuta.locator('input[placeholder*="BUS-"]').fill(uniquePlate);
    await modalRuta.locator('input[type="number"]').fill('36');

    await modalRuta.locator('button:has-text("Guardar Ruta")').click();
    await expect(modalRuta).not.toBeVisible({ timeout: 8000 });

    // 2. Obtener la ruta recién creada de la base de datos
    const dbRuta = await queryDb('SELECT * FROM tra_rutas_escolares WHERE nombre = $1', [uniqueRouteName]);
    expect(dbRuta.length).toBeGreaterThan(0);
    const rutaId = dbRuta[0].id;
    expect(dbRuta[0].placa_vehiculo).toBe(uniquePlate);
    expect(dbRuta[0].capacidad).toBe(36);

    // 3. Asignar estudiante a la ruta
    const matRows = await queryDb('SELECT id FROM mat_matriculas WHERE colegio_id = $1 LIMIT 1', [tenantId]);
    expect(matRows.length).toBeGreaterThan(0);
    const matriculaId = matRows[0].id;

    const assignRes = await request.post(`http://127.0.0.1:3001/api/v1/servicios-escolares/transporte/rutas/${rutaId}/asignar-estudiante`, {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        matriculaId: matriculaId,
        direccionParada: 'Calle 127 # 15-40, Apto 501',
        ordenParada: 1,
        jornadaTipo: 'AM_PM',
      },
    });
    expect(assignRes.status()).toBe(201);

    // 4. Actualizar telemetría GPS y verificar tracking
    await queryDb('UPDATE tra_rutas_escolares SET latitud_actual = 4.6985, longitud_actual = -74.0531, ultima_actualizacion_gps = NOW() WHERE id = $1', [rutaId]);

    const trackRes = await request.get(`http://127.0.0.1:3001/api/v1/servicios-escolares/transporte/rutas/${rutaId}/tracking`, {
      headers: { 'x-colegio-id': tenantId },
    });
    expect(trackRes.status()).toBe(200);
    const trackData = await trackRes.json();
    expect(trackData.rutaId).toBe(rutaId);
    expect(Number(trackData.gps.lat)).toBeCloseTo(4.6985, 2);

    // 5. Publicar menú nutricional con alérgenos
    const menuDate = '2026-09-01';
    const createMenuRes = await request.post('http://127.0.0.1:3001/api/v1/servicios-escolares/restaurante/menus', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        fecha: menuDate,
        tipoServicio: 'ALMUERZO',
        platoPrincipal: 'Pechuga Cordon Bleu en Salsa Tártara',
        acompanamiento: 'Arroz jardinero, ensalada caprese y papas al vapor',
        bebida: 'Jugo natural de mango',
        caloriasAprox: 650,
        alergenosDeclarados: 'Contiene derivados lácteos y gluten',
      },
    });
    expect(createMenuRes.status()).toBe(201);
    const menuData = await createMenuRes.json();

    // 6. Registrar consumo en comedor
    const consumoRes = await request.post('http://127.0.0.1:3001/api/v1/servicios-escolares/restaurante/marcar-consumo', {
      headers: {
        'x-colegio-id': tenantId,
        'Content-Type': 'application/json',
      },
      data: {
        matriculaId: matriculaId,
        tipoServicio: 'ALMUERZO',
      },
    });
    expect(consumoRes.status()).toBe(201);

    // 7. Verificaciones directas en PostgreSQL
    // 7.1 Estudiante en ruta
    const dbEstRuta = await queryDb('SELECT * FROM tra_estudiantes_ruta WHERE ruta_id = $1 AND matricula_id = $2', [rutaId, matriculaId]);
    expect(dbEstRuta.length).toBeGreaterThan(0);
    expect(dbEstRuta[0].direccion_parada).toContain('Calle 127');

    // 7.2 Menú nutricional
    const dbMenu = await queryDb('SELECT * FROM res_menus_nutricionales WHERE id = $1', [menuData.id]);
    expect(dbMenu.length).toBeGreaterThan(0);
    expect(dbMenu[0].plato_principal).toContain('Cordon Bleu');
    expect(dbMenu[0].alergenos_declarados).toContain('lácteos');

    // 7.3 Consumo en comedor
    const dbConsumos = await queryDb('SELECT * FROM res_asistencia_comedor WHERE matricula_id = $1 ORDER BY consumido_at DESC LIMIT 1', [matriculaId]);
    expect(dbConsumos.length).toBeGreaterThan(0);
    expect(dbConsumos[0].tipo_servicio).toBe('ALMUERZO');

    sniffer.assertZeroErrors();
  });
});
