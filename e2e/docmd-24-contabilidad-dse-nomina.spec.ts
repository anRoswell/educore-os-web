import { test, expect } from '@playwright/test';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-24: Contabilidad Escolar — Documento Soporte Electrónico (No Obligados) & Nómina Electrónica UBL DIAN
 * Standard Compliance: ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-24: Documento Soporte DSE & Nómina Electrónica UBL DIAN — E2E Exhaustiva', () => {
  const colegioId = '11111111-2222-3333-4444-555555555555';
  let terceroProveedorId: string;
  let terceroEmpleadoId: string;

  test.beforeAll(async () => {
    // 1. Asegurar Colegio en DB
    await queryDb(
      `INSERT INTO colegios (id, nombre, slug, estado)
       VALUES ($1, 'Colegio Mayor de San Bartolomé QA', 'san-bartolome-qa', 'ACTIVO')
       ON CONFLICT (id) DO NOTHING`,
      [colegioId],
    );

    // 2. Asegurar configuración DIAN si no existe
    const dianConfigs = await queryDb('SELECT id FROM cont_dian_config WHERE colegio_id = $1', [colegioId]);
    if (dianConfigs.length === 0) {
      await queryDb(
        `INSERT INTO cont_dian_config (colegio_id, ambiente, nit_emisor, dv_emisor, razon_social_emisor, prefijo_ds, ultimo_consecutivo_ds, id_software, pin_software, resolucion_ds)
         VALUES ($1, 'HABILITACION', '890102345', '1', 'Colegio Mayor de San Bartolomé QA', 'DS', 0, 'software-e2e-id', '12345', '18760000001')`,
        [colegioId],
      );
    }

    // 3. Asegurar Tercero Proveedor (Persona Natural / No Obligado)
    const proveedores = await queryDb(
      `SELECT id FROM cont_terceros WHERE colegio_id = $1 AND numero_documento = '1098765432' LIMIT 1`,
      [colegioId],
    );
    if (proveedores.length > 0) {
      terceroProveedorId = proveedores[0].id;
    } else {
      const insTercero = await queryDb(
        `INSERT INTO cont_terceros (colegio_id, tipo_documento, numero_documento, tipo_persona, primer_nombre, primer_apellido, nombre_completo, es_proveedor, activo)
         VALUES ($1, 'CC', '1098765432', 'NATURAL', 'Maestro Jorge', 'Hernández Plomería', 'Maestro Jorge Hernández Plomería', true, true)
         RETURNING id`,
        [colegioId],
      );
      terceroProveedorId = insTercero[0].id;
    }

    // 4. Asegurar Tercero Empleado / Docente
    const empleados = await queryDb(
      `SELECT id FROM cont_terceros WHERE colegio_id = $1 AND numero_documento = '1012345678' LIMIT 1`,
      [colegioId],
    );
    if (empleados.length > 0) {
      terceroEmpleadoId = empleados[0].id;
    } else {
      const insEmp = await queryDb(
        `INSERT INTO cont_terceros (colegio_id, tipo_documento, numero_documento, tipo_persona, primer_nombre, primer_apellido, nombre_completo, es_colaborador, activo)
         VALUES ($1, 'CC', '1012345678', 'NATURAL', 'Prof. María', 'Fernanda Lozano', 'Prof. María Fernanda Lozano', true, true)
         RETURNING id`,
        [colegioId],
      );
      terceroEmpleadoId = insEmp[0].id;
    }

    // 5. Asegurar Periodo Contable Abierto para 2026-09
    await queryDb(
      `INSERT INTO cont_periodos (colegio_id, anio, mes, estado)
       VALUES ($1, 2026, 9, 'ABIERTO')
       ON CONFLICT (colegio_id, anio, mes) DO UPDATE SET estado = 'ABIERTO'`,
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
          nit: '890.102.345-1',
          plan: 'ENTERPRISE',
        })
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PARTE 1: DOCUMENTO SOPORTE ELECTRÓNICO (DSE)
  // ──────────────────────────────────────────────────────────────────────────

  test('24.DSE.1 Navegación a la pestaña Documento Soporte DSE, verificación de Banner, KPIs, filtros y controles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabBtn = page.locator('[data-testid="tab-documento-soporte"]');
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
    await page.waitForTimeout(300);

    // Validar cabecera y títulos
    await expect(page.locator('[data-testid="title-documento-soporte"]')).toContainText('Documento Soporte Electrónico');
    await expect(page.locator('[data-testid="btn-nuevo-documento-soporte"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-recargar-ds"]')).toBeVisible();

    // Validar 4 Tarjetas KPI
    await expect(page.locator('[data-testid="kpi-total-documentos"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-aceptados"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-valor"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-retenciones"]')).toBeVisible();

    // Validar barra de filtros
    await expect(page.locator('[data-testid="filtro-fecha-inicio-ds"]')).toBeVisible();
    await expect(page.locator('[data-testid="filtro-fecha-fin-ds"]')).toBeVisible();
    await expect(page.locator('[data-testid="filtro-estado-ds"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-busqueda-ds"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-documentos-soporte"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('24.DSE.2 Ciclo de vida completo de emisión de Documento Soporte Electrónico (No Obligados) con cálculo de retenciones, CUDS y causación en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-documento-soporte"]').click();
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnNuevo = page.locator('[data-testid="btn-nuevo-documento-soporte"]');
    await btnNuevo.click();
    const modalCrear = page.locator('[data-testid="modal-crear-ds"]');
    await expect(modalCrear).toBeVisible();

    // 2. Probar cancelación
    await page.locator('[data-testid="btn-cancelar-crear-ds"]').click();
    await expect(modalCrear).not.toBeVisible();

    // 3. Reabrir y diligenciar formulario
    await btnNuevo.click();
    await expect(modalCrear).toBeVisible();

    // Seleccionar tercero
    const selectTercero = page.locator('[data-testid="select-tercero-crear-ds"]');
    await selectTercero.selectOption(terceroProveedorId);

    // Llenar datos de servicio
    await page.locator('[data-testid="input-item-descripcion-ds"]').fill('Mantenimiento locativo e hidrosanitario de baterias de baños primaria');
    await page.locator('[data-testid="input-item-cantidad-ds"]').fill('1');
    await page.locator('[data-testid="input-item-precio-ds"]').fill('1500000');
    await page.locator('[data-testid="input-item-retefuente-ds"]').fill('4.0');
    await page.locator('[data-testid="input-item-reteica-ds"]').fill('0.966');
    await page.locator('[data-testid="textarea-notas-ds"]').fill('Servicio de fontanería ejecutado a satisfacción en sede campestre.');

    // Validar cálculo reactivo en pantalla (Subtotal: 1,500,000 | Retenciones: 60,000 + 14,490 = 74,490 | Neto: 1,425,510)
    await expect(page.locator('[data-testid="total-neto-calculado-ds"]')).toContainText(/1[.,]425[.,]510/);

    // 4. Enviar formulario y emitir
    await page.locator('[data-testid="btn-confirmar-crear-ds"]').click();
    await expect(modalCrear).not.toBeVisible({ timeout: 15000 });

    // 5. Verificar persistencia en base de datos PostgreSQL
    const docsEnDb = await queryDb(
      `SELECT id, numero_documento, subtotal, total_retefuente, total_reteica, total_pagar, cuds, estado_dian, asiento_id
       FROM cont_documentos_soporte
       WHERE colegio_id = $1 AND tercero_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId, terceroProveedorId],
    );

    expect(docsEnDb.length).toBe(1);
    const docDb = docsEnDb[0];
    expect(Number(docDb.subtotal)).toBe(1500000);
    expect(Number(docDb.total_retefuente)).toBe(60000);
    expect(Number(docDb.total_reteica)).toBe(14490);
    expect(Number(docDb.total_pagar)).toBe(1425510);
    expect(docDb.cuds).toBeDefined();
    expect(docDb.cuds.length).toBe(96); // SHA-384
    expect(docDb.estado_dian).toBe('ACEPTADO');

    sniffer.assertZeroErrors();
  });

  test('24.DSE.3 Visualización del Detalle de Documento Soporte y Anulación con Nota de Ajuste NDS', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-documento-soporte"]').click();
    await page.waitForTimeout(300);

    // Obtener el último documento soporte creado
    const docs = await queryDb(
      `SELECT id, numero_documento FROM cont_documentos_soporte WHERE colegio_id = $1 AND estado_dian = 'ACEPTADO' ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );
    expect(docs.length).toBeGreaterThan(0);
    const numDoc = docs[0].numero_documento;

    // 1. Ver Detalle
    await page.locator(`[data-testid="row-ds-${numDoc}"]`).waitFor({ state: 'visible', timeout: 15000 });
    const btnDetalle = page.locator(`[data-testid="btn-detalle-ds-${numDoc}"]`);
    await expect(btnDetalle).toBeVisible();
    await btnDetalle.click();

    const modalDetalle = page.locator('[data-testid="modal-detalle-ds"]');
    await expect(modalDetalle).toBeVisible();
    await expect(page.locator('[data-testid="modal-detalle-cuds"]')).toBeVisible();

    await page.locator('[data-testid="btn-cerrar-detalle-ds"]').click();
    await expect(modalDetalle).not.toBeVisible();

    // 2. Anular con Nota de Ajuste NDS
    const btnAnular = page.locator(`[data-testid="btn-anular-ds-${numDoc}"]`);
    await expect(btnAnular).toBeVisible();
    await btnAnular.click();

    const modalAnular = page.locator('[data-testid="modal-anular-ds"]');
    await expect(modalAnular).toBeVisible();

    await page.locator('[data-testid="textarea-motivo-anulacion-ds"]').fill('Anulación por rescisión de mutuo acuerdo del servicio de fontanería.');
    await page.locator('[data-testid="btn-confirmar-anular-ds"]').click();
    await expect(modalAnular).not.toBeVisible({ timeout: 15000 });

    // 3. Verificar estado ANULADO en PostgreSQL y creación de Nota en cont_documentos_soporte_notas
    const docAnulado = await queryDb(
      `SELECT estado_dian FROM cont_documentos_soporte WHERE id = $1`,
      [docs[0].id],
    );
    expect(docAnulado[0].estado_dian).toBe('ANULADO');

    const notasDb = await queryDb(
      `SELECT id, numero_nota, tipo_nota, cuds_nota, estado_dian FROM cont_documentos_soporte_notas WHERE documento_soporte_id = $1`,
      [docs[0].id],
    );
    expect(notasDb.length).toBe(1);
    expect(notasDb[0].tipo_nota).toBe('ANULACION');
    expect(notasDb[0].estado_dian).toBe('ACEPTADO');

    sniffer.assertZeroErrors();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PARTE 2: NÓMINA ELECTRÓNICA UBL DIAN
  // ──────────────────────────────────────────────────────────────────────────

  test('24.NE.1 Navegación a la pestaña Nómina Electrónica UBL, verificación de Banner, KPIs, filtros y controles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabBtn = page.locator('[data-testid="tab-nomina-electronica"]');
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
    await page.waitForTimeout(300);

    // Validar cabecera y títulos
    await expect(page.locator('[data-testid="title-nomina-electronica"]')).toContainText('Nómina Electrónica UBL DIAN');
    await expect(page.locator('[data-testid="btn-nueva-nomina-individual"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-emision-masiva-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-recargar-nomina"]')).toBeVisible();

    // Validar 4 Tarjetas KPI
    await expect(page.locator('[data-testid="kpi-total-nominas"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-aceptadas-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-devengados"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-deducciones"]')).toBeVisible();

    // Validar barra de filtros
    await expect(page.locator('[data-testid="filtro-anio-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="filtro-mes-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="filtro-estado-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-busqueda-nomina"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-nominas-electronicas"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('24.NE.2 Ciclo de vida completo de emisión de Nómina Electrónica Individual con devengados, deducciones de ley (Salud/Pensión) y CUNE en BD', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-nomina-electronica"]').click();
    await page.waitForLoadState('networkidle');
    await page.locator('.global-loading-overlay').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    // 1. Abrir modal
    const btnIndividual = page.locator('[data-testid="btn-nueva-nomina-individual"]');
    await expect(btnIndividual).toBeVisible();
    await btnIndividual.click();
    const modalCrear = page.locator('[data-testid="modal-crear-ne"]');
    await expect(modalCrear).toBeVisible();

    // 2. Probar cancelación
    await page.locator('[data-testid="btn-cancelar-crear-ne"]').click();
    await expect(modalCrear).not.toBeVisible();

    // 3. Reabrir y diligenciar formulario
    await btnIndividual.click();
    await expect(modalCrear).toBeVisible();

    // Seleccionar empleado
    await page.locator('[data-testid="select-empleado-crear-ne"]').selectOption(terceroEmpleadoId);
    await page.locator('[data-testid="input-sueldo-basico-ne"]').fill('3500000');
    await page.locator('[data-testid="input-aux-transporte-ne"]').fill('162000');
    await page.locator('[data-testid="input-otros-devengados-ne"]').fill('200000');

    // Validar cálculos reactivos en pantalla:
    // Devengado: 3,500,000 + 162,000 + 200,000 = 3,862,000
    // Deducciones: Salud (4% de 3,500,000) = 140,000 | Pensión (4% de 3,500,000) = 140,000 => Total Ded: 280,000
    // Total Neto Comprobante = 3,862,000 - 280,000 = 3,582,000
    await expect(page.locator('[data-testid="total-neto-calculado-ne"]')).toContainText(/3[.,]582[.,]000/);

    // 4. Enviar formulario y emitir
    await page.locator('[data-testid="btn-confirmar-crear-ne"]').click();
    await expect(modalCrear).not.toBeVisible({ timeout: 15000 });

    // 5. Verificar persistencia en base de datos PostgreSQL
    const nominasEnDb = await queryDb(
      `SELECT id, numero_nomina, total_devengado, total_deducciones, total_comprobante, cune, estado_dian
       FROM cont_nomina_electronica
       WHERE colegio_id = $1 AND tercero_empleado_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [colegioId, terceroEmpleadoId],
    );

    expect(nominasEnDb.length).toBe(1);
    const nomDb = nominasEnDb[0];
    expect(Number(nomDb.total_devengado)).toBe(3862000);
    expect(Number(nomDb.total_deducciones)).toBe(280000);
    expect(Number(nomDb.total_comprobante)).toBe(3582000);
    expect(nomDb.cune).toBeDefined();
    expect(nomDb.cune.length).toBe(96); // SHA-384
    expect(nomDb.estado_dian).toBe('ACEPTADO');

    sniffer.assertZeroErrors();
  });

  test('24.NE.3 Emisión Masiva de Nómina Electrónica del Mes y visualización de detalle con desglose financiero', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-nomina-electronica"]').click();
    await page.waitForLoadState('networkidle');
    await page.locator('.global-loading-overlay').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    // 1. Abrir modal de emisión masiva
    const btnMasiva = page.locator('[data-testid="btn-emision-masiva-nomina"]');
    await expect(btnMasiva).toBeVisible();
    await btnMasiva.click();
    const modalMasiva = page.locator('[data-testid="modal-masiva-ne"]');
    await expect(modalMasiva).toBeVisible();

    // 2. Cancelar modal
    await page.locator('[data-testid="btn-cancelar-masiva-ne"]').click();
    await expect(modalMasiva).not.toBeVisible();

    // 3. Reabrir y ejecutar emisión masiva
    await btnMasiva.click();
    await expect(modalMasiva).toBeVisible();

    await page.locator('[data-testid="input-masiva-anio"]').fill('2026');
    await page.locator('[data-testid="select-masiva-mes"]').selectOption('9');
    await page.locator('[data-testid="btn-confirmar-masiva-ne"]').click();
    await expect(modalMasiva).not.toBeVisible({ timeout: 15000 });

    // 4. Verificar que existen registros en la tabla
    const totalNominas = await queryDb(
      `SELECT count(*)::int as count FROM cont_nomina_electronica WHERE colegio_id = $1 AND periodo_anio = 2026 AND periodo_mes = 9`,
      [colegioId],
    );
    expect(totalNominas[0].count).toBeGreaterThan(0);

    // 5. Ver Detalle de la última nómina
    const ultNomina = await queryDb(
      `SELECT numero_nomina FROM cont_nomina_electronica WHERE colegio_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [colegioId],
    );
    const numNom = ultNomina[0].numero_nomina;

    await page.locator(`[data-testid="row-ne-${numNom}"]`).waitFor({ state: 'visible', timeout: 15000 });
    const btnDetalle = page.locator(`[data-testid="btn-detalle-ne-${numNom}"]`);
    await expect(btnDetalle).toBeVisible();
    await btnDetalle.click();

    const modalDetalle = page.locator('[data-testid="modal-detalle-ne"]');
    await expect(modalDetalle).toBeVisible();
    await expect(page.locator('[data-testid="modal-detalle-cune"]')).toBeVisible();

    await page.locator('[data-testid="btn-cerrar-detalle-ne"]').click();
    await expect(modalDetalle).not.toBeVisible();

    sniffer.assertZeroErrors();
  });
});
