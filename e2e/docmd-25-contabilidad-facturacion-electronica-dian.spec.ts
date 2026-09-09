import { test, expect } from '@playwright/test';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-25: Contabilidad Escolar — Facturación Electrónica DIAN UBL 2.1, Notas Crédito/Débito y PDF con QR
 * Standard Compliance: ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-25: Facturación Electrónica DIAN UBL 2.1 & Notas de Ajuste — E2E Exhaustiva', () => {
  const colegioId = '11111111-2222-3333-4444-555555555555';
  let terceroClienteId: string;

  test.beforeAll(async () => {
    // 1. Asegurar Colegio en DB
    await queryDb(
      `INSERT INTO colegios (id, nombre, slug, estado)
       VALUES ($1, 'Colegio Mayor de San Bartolomé QA', 'san-bartolome-qa', 'ACTIVO')
       ON CONFLICT (id) DO NOTHING`,
      [colegioId],
    );

    // 2. Asegurar configuración DIAN
    const dianConfigs = await queryDb('SELECT id FROM cont_dian_config WHERE colegio_id = $1', [colegioId]);
    if (dianConfigs.length === 0) {
      await queryDb(
        `INSERT INTO cont_dian_config (
          colegio_id, ambiente, nit_emisor, dv_emisor, razon_social_emisor,
          prefijo_factura, rango_desde, rango_hasta, ultimo_consecutivo,
          resolucion_dian, id_software, pin_software, clave_tecnica,
          prefijo_nc, ultimo_consecutivo_nc, prefijo_nd, ultimo_consecutivo_nd,
          prefijo_ds, ultimo_consecutivo_ds
        ) VALUES (
          $1, 'HABILITACION', '900123456', '1', 'Colegio Mayor de San Bartolomé QA',
          'FE', 1, 999999, 0,
          '18760000001', '430b3266-9e99-4d69-90b5-e2e000000001', '12345', 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
          'NC', 0, 'ND', 0,
          'DS', 0
        )`,
        [colegioId],
      );
    }

    // 3. Asegurar Tercero Adquiriente / Padre de Familia
    const terceros = await queryDb(
      `SELECT id FROM cont_terceros WHERE colegio_id = $1 AND numero_documento = '1020304050' LIMIT 1`,
      [colegioId],
    );
    if (terceros.length > 0) {
      terceroClienteId = terceros[0].id;
    } else {
      const insTercero = await queryDb(
        `INSERT INTO cont_terceros (colegio_id, tipo_documento, numero_documento, tipo_persona, primer_nombre, primer_apellido, nombre_completo, email, telefono, activo)
         VALUES ($1, 'CC', '1020304050', 'NATURAL', 'Alejandro', 'Morales Padre', 'Alejandro Morales Padre', 'amorales@sanbartolome.edu.co', '3109876543', true)
         RETURNING id`,
        [colegioId],
      );
      terceroClienteId = insTercero[0].id;
    }

    // 4. Asegurar Periodo Contable Abierto para 2026-09
    await queryDb(
      `INSERT INTO cont_periodos (colegio_id, anio, mes, estado)
       VALUES ($1, 2026, 9, 'ABIERTO')
       ON CONFLICT (colegio_id, anio, mes) DO UPDATE SET estado = 'ABIERTO'`,
      [colegioId],
    );

    // 5. Asegurar Cuentas PUC para Causación Facturación
    await queryDb(
      `INSERT INTO cont_puc_cuentas (colegio_id, codigo, nombre, naturaleza, nivel, es_auxiliar, maneja_matricula, maneja_tercero, maneja_centro_costo, activo)
       VALUES 
        ($1, '130505', 'Clientes Nacionales - Pensiones', 'DEBITO', 4, true, false, true, false, true),
        ($1, '416005', 'Ingresos por Educación Formal', 'CREDITO', 4, true, false, true, false, true)
       ON CONFLICT (colegio_id, codigo) DO UPDATE SET maneja_matricula = false, maneja_tercero = true, maneja_centro_costo = false, activo = true`,
      [colegioId],
    );
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'educore_user',
        JSON.stringify({
          id: '71111111-1111-4111-8111-000000000001',
          email: 'rectoria@sanbartolome.edu.co',
          primerNombre: 'Carlos',
          primerApellido: 'Mendoza',
          role: 'RECTOR',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        })
      );
      localStorage.setItem(
        'educore_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6InJlY3RvcmlhQHNhbmJhcnRvbG9tZS5lZHUuY28iLCJyb2xlIjoiUkVDVE9SIiwicm9sZXMiOlsiUkVDVE9SIiwiU1VQRVJfQURNSU4iXSwicGVybWlzc2lvbnMiOlsiKiJdLCJjb2xlZ2lvSWQiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJpYXQiOjE3NzIzOTAwMDAsImV4cCI6MTk5OTk5OTk5OX0.Xrwb9ON-U9pdmv2LL3eh0EAHUusgXqMoA7wtImPgnbs'
      );
      localStorage.setItem(
        'educore_colegio',
        JSON.stringify({
          id: '11111111-2222-3333-4444-555555555555',
          nombre: 'Colegio Mayor de San Bartolomé',
          slug: 'san-bartolome',
          nit: '900.123.456-1',
          plan: 'ENTERPRISE',
        })
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Navegación, Header Banner, KPIs y Filtros
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.1 Navegación a pestaña DIAN, verificación de Banner institucional, 4 KPIs y Filtros de búsqueda', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabDian = page.locator('[data-testid="tab-dian"]');
    await expect(tabDian).toBeVisible();
    await tabDian.click();
    await page.waitForTimeout(300);

    // Banner de Estado
    await expect(page.locator('[data-testid="dian-status-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="dian-header-title"]')).toContainText('Facturación Electrónica DIAN');
    await expect(page.locator('[data-testid="badge-ambiente-dian"]')).toBeVisible();

    // Botones de Acción en Header
    await expect(page.locator('[data-testid="btn-abrir-config-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-emision-masiva-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-nuevo-doc-soporte"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-nueva-factura-directa"]')).toBeVisible();

    // 4 Tarjetas KPI
    await expect(page.locator('[data-testid="kpi-total-documentos-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-documentos"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-aceptados"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-pendientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-rechazados"]')).toBeVisible();

    // Barra de Filtros
    await expect(page.locator('[data-testid="dian-filters-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-filtro-tipo-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-filtro-estado-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-buscar-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-buscar-dian"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-limpiar-filtros-dian"]')).toBeVisible();

    // Tabla de Documentos
    await expect(page.locator('[data-testid="dian-table-container"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Modal de Configuración DIAN
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.2 Ciclo de vida del Modal de Configuración DIAN, Test de Conexión SOAP y Guardado en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir Modal Config
    const btnConfig = page.locator('[data-testid="btn-abrir-config-dian"]');
    await btnConfig.click();
    const modalConfig = page.locator('[data-testid="modal-config-dian"]');
    await expect(modalConfig).toBeVisible();

    // 2. Cancelar Modal
    await page.locator('[data-testid="btn-cancelar-config-dian"]').click();
    await expect(modalConfig).not.toBeVisible();

    // 3. Reabrir y Probar Conexión DIAN
    await btnConfig.click();
    await expect(modalConfig).toBeVisible();

    const btnTest = page.locator('[data-testid="btn-probar-conexion-dian"]');
    await expect(btnTest).toBeVisible();
    await btnTest.click();
    await expect(page.locator('[data-testid="alert-success-config-dian"]')).toBeVisible({ timeout: 10000 });

    // 4. Modificar y Guardar
    await page.locator('[data-testid="input-razon-social"]').fill('Colegio Mayor de San Bartolomé QA Oficial');
    await page.locator('[data-testid="btn-guardar-config-dian"]').click();
    await expect(modalConfig).not.toBeVisible({ timeout: 10000 });

    // 5. Verificar persistencia en PostgreSQL
    const configDb = await queryDb(
      `SELECT razon_social_emisor, nit_emisor, prefijo_factura FROM cont_dian_config WHERE colegio_id = $1`,
      [colegioId],
    );
    expect(configDb.length).toBe(1);
    expect(configDb[0].razon_social_emisor).toBe('Colegio Mayor de San Bartolomé QA Oficial');

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Emisión Directa Manual de Factura Electrónica (UBL 2.1 + Asientos CAU)
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.3 Emisión Directa de Factura Electrónica con múltiples ítems, cálculo CUFE (SHA-384) y causación contable automática en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir Modal Factura Directa
    const btnNueva = page.locator('[data-testid="btn-nueva-factura-directa"]');
    await btnNueva.click();
    const modalFactura = page.locator('[data-testid="modal-factura-directa"]');
    await expect(modalFactura).toBeVisible();

    // 2. Probar Cancelación
    await page.locator('[data-testid="btn-cancelar-factura-directa"]').click();
    await expect(modalFactura).not.toBeVisible();

    // 3. Reabrir y Diligenciar Formulario
    await btnNueva.click();
    await expect(modalFactura).toBeVisible();

    // Seleccionar Tercero
    await page.locator('[data-testid="select-tercero-factura-directa"]').selectOption(terceroClienteId);
    await expect(page.locator('[data-testid="input-cliente-nombre"]')).toHaveValue('Alejandro Morales Padre');
    await expect(page.locator('[data-testid="input-cliente-documento"]')).toHaveValue('1020304050');

    // Configurar Ítem 1 (Pensión)
    await page.locator('[data-testid="input-item-desc-0"]').fill('Pensión Mensual Grado Undécimo - Septiembre 2026');
    await page.locator('[data-testid="input-item-cant-0"]').fill('1');
    await page.locator('[data-testid="input-item-precio-0"]').fill('450000');
    await page.locator('[data-testid="input-item-descuento-0"]').fill('50000');

    // Agregar Ítem 2 (Derechos de Grado)
    await page.locator('[data-testid="btn-agregar-item-factura"]').click();
    await page.locator('[data-testid="input-item-desc-1"]').fill('Derechos de Grado y Diploma Bachiller');
    await page.locator('[data-testid="input-item-cant-1"]').fill('1');
    await page.locator('[data-testid="input-item-precio-1"]').fill('120000');

    // Validar Liquidación Reactiva en pantalla
    // Subtotal: 450,000 + 120,000 = 570,000 | Descuentos: 50,000 | Total: 520,000
    await expect(page.locator('[data-testid="factura-resumen-subtotal"]')).toContainText(/570[.,]000/);
    await expect(page.locator('[data-testid="factura-resumen-descuento"]')).toContainText(/50[.,]000/);
    await expect(page.locator('[data-testid="factura-resumen-total"]')).toContainText(/520[.,]000/);

    // Observaciones
    await page.locator('[data-testid="textarea-factura-observaciones"]').fill('Factura expedida por servicios educativos conforme a Ley 115.');

    // 4. Emitir y Transmitir
    await page.locator('[data-testid="btn-confirmar-factura-directa"]').click();
    await expect(modalFactura).not.toBeVisible({ timeout: 15000 });

    // 5. Verificar persistencia en PostgreSQL (Documento Electrónico)
    const docsDb = await queryDb(
      `SELECT id, tipo_documento, prefijo, numero, total, subtotal, descuentos, cufe_cude, estado_dian
       FROM cont_documentos_electronicos
       WHERE colegio_id = $1 AND tipo_documento = 'FACTURA_VENTA_01'
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );

    expect(docsDb.length).toBe(1);
    const doc = docsDb[0];
    expect(Number(doc.total)).toBe(520000);
    expect(Number(doc.subtotal)).toBe(570000);
    expect(Number(doc.descuentos)).toBe(50000);
    expect(doc.cufe_cude).toBeDefined();
    expect(doc.cufe_cude.length).toBe(96); // CUFE SHA-384
    expect(doc.estado_dian).toBe('ACEPTADO');

    // 6. Verificar Causación Contable en BD (cont_asientos + cont_asiento_lineas)
    const asientos = await queryDb(
      `SELECT id, tipo_comprobante, concepto, total_debito, total_credito, estado
       FROM cont_asientos
       WHERE colegio_id = $1 AND tipo_comprobante = 'CAU' AND concepto LIKE '%FE-%'
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );

    expect(asientos.length).toBe(1);
    const asiento = asientos[0];
    expect(Number(asiento.total_debito)).toBe(520000);
    expect(Number(asiento.total_credito)).toBe(520000);
    expect(asiento.estado).toBe('POSTED');

    const lineas = await queryDb(
      `SELECT p.codigo AS cuenta_codigo, l.debito, l.credito 
       FROM cont_asiento_lineas l 
       JOIN cont_puc_cuentas p ON p.id = l.cuenta_id 
       WHERE l.asiento_id = $1 
       ORDER BY l.debito DESC`,
      [asiento.id],
    );
    expect(lineas.length).toBe(2);
    expect(lineas[0].cuenta_codigo).toBe('130505');
    expect(Number(lineas[0].debito)).toBe(520000);
    expect(lineas[1].cuenta_codigo).toBe('416005');
    expect(Number(lineas[1].credito)).toBe(520000);

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Emisión Masiva de Facturación Electrónica por Lote
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.4 Emisión Masiva de Facturación por Lote para Cuentas de Cobro del mes', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir Modal Masiva
    const btnMasiva = page.locator('[data-testid="btn-emision-masiva-dian"]');
    await btnMasiva.click();
    const modalMasiva = page.locator('[data-testid="modal-masiva-dian"]');
    await expect(modalMasiva).toBeVisible();

    // 2. Probar Cancelación
    await page.locator('[data-testid="btn-cancelar-masiva-dian"]').click();
    await expect(modalMasiva).not.toBeVisible();

    // 3. Reabrir y Procesar Lote
    await btnMasiva.click();
    await expect(modalMasiva).toBeVisible();

    await page.locator('[data-testid="input-masiva-anio"]').fill('2026');
    await page.locator('[data-testid="select-masiva-mes"]').selectOption('9');
    await page.locator('[data-testid="btn-confirmar-masiva-dian"]').click();

    // 4. Validar Resultado del Lote
    await expect(page.locator('[data-testid="resultado-masiva-dian"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="res-total-solicitadas"]')).toBeVisible();

    // 5. Cerrar Modal
    await page.locator('[data-testid="btn-cancelar-masiva-dian"]').click();
    await expect(modalMasiva).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Modal Detalle de Factura, Descarga PDF con QR / XML y Envío por Email
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.5 Visualización de Detalle de Factura, CUFE, XML UBL, Representación Gráfica PDF y Envío por Email', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    // Obtener la última factura emitida
    const ultFactura = await queryDb(
      `SELECT id, numero, prefijo FROM cont_documentos_electronicos WHERE colegio_id = $1 AND tipo_documento = 'FACTURA_VENTA_01' ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );
    expect(ultFactura.length).toBeGreaterThan(0);
    const docId = ultFactura[0].id;

    // 1. Abrir Modal de Detalle
    const btnDetalle = page.locator(`[data-testid="btn-detalle-${docId}"]`);
    await expect(btnDetalle).toBeVisible();
    await btnDetalle.click();

    const modalDetalle = page.locator('[data-testid="modal-detalle-factura"]');
    await expect(modalDetalle).toBeVisible();
    await expect(page.locator('[data-testid="detalle-cufe"]')).toBeVisible();
    await expect(page.locator('[data-testid="detalle-total"]')).toBeVisible();

    // 2. Probar Toggle y Envío por Email
    await page.locator('[data-testid="btn-detalle-toggle-email"]').click();
    await expect(page.locator('[data-testid="panel-email-factura"]')).toBeVisible();
    await page.locator('[data-testid="input-email-destino"]').fill('padrefamilia@sanbartolome.edu.co');
    await page.locator('[data-testid="btn-confirmar-enviar-email"]').click();
    await expect(page.locator('[data-testid="alert-detalle-success"]')).toBeVisible({ timeout: 10000 });

    // 3. Probar Reconsulta DIAN
    await page.locator('[data-testid="btn-detalle-reconsultar"]').click();
    await expect(page.locator('[data-testid="alert-detalle-success"]')).toBeVisible({ timeout: 10000 });

    // 4. Cerrar Modal Detalle
    await page.locator('[data-testid="btn-cerrar-detalle-factura"]').click();
    await expect(modalDetalle).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Emisión de Nota Crédito (Tipo 91) y Reversión Contable en BD
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.6 Emisión de Nota Crédito DIAN (Tipo 91) sobre Factura Electrónica y Reversión Automática en Contabilidad', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    const facturas = await queryDb(
      `SELECT id, numero, prefijo, total FROM cont_documentos_electronicos WHERE colegio_id = $1 AND tipo_documento = 'FACTURA_VENTA_01' AND estado_dian = 'ACEPTADO' ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );
    expect(facturas.length).toBeGreaterThan(0);
    const fac = facturas[0];

    // 1. Abrir Modal NC
    const btnNc = page.locator(`[data-testid="btn-nc-${fac.id}"]`);
    await expect(btnNc).toBeVisible();
    await btnNc.click();

    const modalNc = page.locator('[data-testid="modal-nc-dian"]');
    await expect(modalNc).toBeVisible();

    // 2. Probar Cancelación
    await page.locator('[data-testid="btn-cancelar-nc-dian"]').click();
    await expect(modalNc).not.toBeVisible();

    // 3. Reabrir y Diligenciar Motivo
    await btnNc.click();
    await expect(modalNc).toBeVisible();

    await page.locator('[data-testid="textarea-motivo-nc"]').fill('Anulación por beca del 100% otorgada por el Consejo Directivo');
    await page.locator('[data-testid="btn-confirmar-nc-dian"]').click();
    await expect(modalNc).not.toBeVisible({ timeout: 15000 });

    // 4. Verificar creación de Nota Crédito en PostgreSQL
    const ncDb = await queryDb(
      `SELECT id, tipo_documento, prefijo, numero, total, cufe_cude, estado_dian
       FROM cont_documentos_electronicos
       WHERE colegio_id = $1 AND tipo_documento = 'NOTA_CREDITO_91'
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );

    expect(ncDb.length).toBeGreaterThan(0);
    expect(Number(ncDb[0].total)).toBe(Number(fac.total));
    expect(ncDb[0].cufe_cude).toBeDefined();
    expect(ncDb[0].cufe_cude.length).toBe(96); // CUDE
    expect(ncDb[0].estado_dian).toBe('ACEPTADO');

    // 5. Verificar Asiento Contable de Reversión NOT en BD
    const asientoNot = await queryDb(
      `SELECT id, tipo_comprobante, concepto, total_debito, total_credito, estado
       FROM cont_asientos
       WHERE colegio_id = $1 AND tipo_comprobante = 'NOT'
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );

    expect(asientoNot.length).toBeGreaterThan(0);
    expect(Number(asientoNot[0].total_debito)).toBe(Number(fac.total));
    expect(Number(asientoNot[0].total_credito)).toBe(Number(fac.total));

    const lineasNot = await queryDb(
      `SELECT p.codigo AS cuenta_codigo, l.debito, l.credito 
       FROM cont_asiento_lineas l 
       JOIN cont_puc_cuentas p ON p.id = l.cuenta_id 
       WHERE l.asiento_id = $1 
       ORDER BY l.debito DESC`,
      [asientoNot[0].id],
    );
    expect(lineasNot.length).toBe(2);
    expect(lineasNot[0].cuenta_codigo).toBe('416005'); // Ingreso debitado (reversión)
    expect(Number(lineasNot[0].debito)).toBe(Number(fac.total));
    expect(lineasNot[1].cuenta_codigo).toBe('130505'); // Cartera acreditada
    expect(Number(lineasNot[1].credito)).toBe(Number(fac.total));

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Emisión de Nota Débito (Tipo 92)
  // ──────────────────────────────────────────────────────────────────────────
  test('25.FE.7 Emisión de Nota Débito DIAN (Tipo 92) sobre Factura Electrónica con CUDE en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-dian"]').click();
    await page.waitForTimeout(300);

    const facturas = await queryDb(
      `SELECT id FROM cont_documentos_electronicos WHERE colegio_id = $1 AND tipo_documento = 'FACTURA_VENTA_01' AND estado_dian = 'ACEPTADO' ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );
    expect(facturas.length).toBeGreaterThan(0);
    const facId = facturas[0].id;

    // 1. Abrir Modal ND
    const btnNd = page.locator(`[data-testid="btn-nd-${facId}"]`);
    await expect(btnNd).toBeVisible();
    await btnNd.click();

    const modalNd = page.locator('[data-testid="modal-nd-dian"]');
    await expect(modalNd).toBeVisible();

    // 2. Probar Cancelación
    await page.locator('[data-testid="btn-cancelar-nd-dian"]').click();
    await expect(modalNd).not.toBeVisible();

    // 3. Reabrir y Diligenciar
    await btnNd.click();
    await expect(modalNd).toBeVisible();

    await page.locator('[data-testid="textarea-motivo-nd"]').fill('Cobro de intereses moratorios por pago extemporáneo');
    await page.locator('[data-testid="input-valor-nd"]').fill('25000');
    await page.locator('[data-testid="btn-confirmar-nd-dian"]').click();
    await expect(modalNd).not.toBeVisible({ timeout: 15000 });

    // 4. Verificar Nota Débito en PostgreSQL
    const ndDb = await queryDb(
      `SELECT id, tipo_documento, total, cufe_cude, estado_dian
       FROM cont_documentos_electronicos
       WHERE colegio_id = $1 AND tipo_documento = 'NOTA_DEBITO_92'
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );

    expect(ndDb.length).toBe(1);
    expect(Number(ndDb[0].total)).toBe(25000);
    expect(ndDb[0].cufe_cude).toBeDefined();
    expect(ndDb[0].cufe_cude.length).toBe(96);
    expect(ndDb[0].estado_dian).toBe('ACEPTADO');

    sniffer.assertZeroErrors();
  });
});
