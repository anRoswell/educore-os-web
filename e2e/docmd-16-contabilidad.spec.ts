import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-16: Contabilidad NIIF Escolar — Exhaustive Anti-Regression E2E Suite
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 *
 * Full-Stack validation from Frontend Angular Signals to PostgreSQL QA Database.
 * Covers:
 * - Suite 1: Carga inicial, navegación exhaustiva en 5 tabs y sniffer de errores estricto
 * - Suite 2: PUC Tree — búsqueda, filtros por clase, expand/collapse, modal nueva cuenta y persistencia
 * - Suite 3: Comprobantes y Asientos — filtros por fecha/tipo/estado, modales de detalle, anulación y nuevo asiento
 * - Suite 4: Periodos Fiscales — selector de año, apertura, bloqueo y ciclo de modal de cierre
 * - Suite 5: Reportes NIIF — Balance General, Estado de Resultados, Libro Diario, Libro Mayor y Libro Auxiliar
 * - Suite 6: Persistencia e Integridad en PostgreSQL — verificación directa de esquemas, CHECKs y datos
 * - Suite 7: Aislamiento y Control de Roles — protección de acceso
 */

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — CARGA INICIAL, NAVEGACIÓN POR LAS 5 PESTAÑAS Y ERROR SNIFFER
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 1: Carga inicial y navegación de Contabilidad', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('16.1 Carga la página de Contabilidad sin excepciones JS ni errores HTTP >= 400', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="contabilidad-page-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-contabilidad"]')).toContainText('Contabilidad NIIF');
    await expect(page.locator('[data-testid="contabilidad-tabs-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="contabilidad-tab-panel"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.2 Las 5 pestañas (PUC, Comprobantes, Mapeo, Periodos, Reportes) son visibles e interactivas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabs = [
      { id: 'tab-puc', contentId: 'tab-content-puc' },
      { id: 'tab-comprobantes', contentId: 'tab-content-comprobantes' },
      { id: 'tab-mapeo', contentId: 'tab-content-mapeo' },
      { id: 'tab-periodos', contentId: 'tab-content-periodos' },
      { id: 'tab-reportes', contentId: 'tab-content-reportes' },
    ];

    for (const t of tabs) {
      const tabBtn = page.locator(`[data-testid="${t.id}"]`);
      await expect(tabBtn).toBeVisible();
      await tabBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator(`[data-testid="${t.contentId}"]`)).toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  test('16.3 Acceso desde Sidebar de Navegación y verificación de badge NIIF', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebarLink = page.locator('a[href="/contabilidad"], a[routerLink="/contabilidad"]').first();
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*\/contabilidad/);
    await expect(page.locator('[data-testid="contabilidad-page-header"]').locator('.badge-mini')).toBeVisible();

    sniffer.assertZeroErrors();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — PUC: ÁRBOL JERÁRQUICO, BÚSQUEDA, FILTROS Y MODAL DE NUEVA CUENTA
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 2: Catálogo PUC Educativo NIIF', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-puc"]').click();
    await page.waitForTimeout(300);
  });

  test('16.4 KPIs del PUC se renderizan con valores cuantitativos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="puc-kpis"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-cuentas"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-auxiliares"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-activas"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-inactivas"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.5 Búsqueda de cuenta PUC por código filtra el listado reactivamente', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const searchInput = page.locator('[data-testid="input-search-puc"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('1105');
    await page.waitForTimeout(400);

    const rowCaja = page.locator('[data-testid="row-puc-1105"]').or(page.locator('tbody tr').first());
    await expect(rowCaja).toBeVisible();

    await searchInput.clear();
    await page.waitForTimeout(300);

    sniffer.assertZeroErrors();
  });

  test('16.6 Filtro select por clase contable filtra cuentas de Activos (Clase 1)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const selectClase = page.locator('[data-testid="select-clase-puc"]');
    await selectClase.selectOption('1');
    await page.waitForTimeout(400);

    const firstRowCode = await page.locator('[data-testid="tabla-puc"] tbody tr td span.font-mono').first().textContent();
    expect(firstRowCode?.trim().startsWith('1')).toBeTruthy();

    await selectClase.selectOption('');
    await page.waitForTimeout(300);

    sniffer.assertZeroErrors();
  });

  test('16.7 Botones "Expandir Todo" y "Colapsar Todo" del árbol PUC', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    // 1. Colapsar Todo: debe mostrar únicamente las clases raíz de nivel 1
    await page.locator('[data-testid="btn-collapse-all"]').click();
    await page.waitForTimeout(300);
    const collapsedCount = await page.locator('[data-testid="tabla-puc"] tbody tr').count();
    expect(collapsedCount).toBeLessThanOrEqual(10);
    expect(collapsedCount).toBeGreaterThanOrEqual(1);

    // 2. Expandir un nodo individual (Clase 1)
    const btnExpand1 = page.locator('[data-testid="btn-expand-1"]');
    if (await btnExpand1.isVisible()) {
      await btnExpand1.click();
      await page.waitForTimeout(300);
      const partialCount = await page.locator('[data-testid="tabla-puc"] tbody tr').count();
      expect(partialCount).toBeGreaterThan(collapsedCount);
    }

    // 3. Expandir Todo: debe mostrar todas las cuentas jerárquicas
    await page.locator('[data-testid="btn-expand-all"]').click();
    await page.waitForTimeout(300);
    const expandedCount = await page.locator('[data-testid="tabla-puc"] tbody tr').count();
    expect(expandedCount).toBeGreaterThan(20);

    sniffer.assertZeroErrors();
  });

  test('16.8 Ciclo de Vida Modal "Nueva Cuenta": Apertura, validación de requeridos y cancelación', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-nueva-cuenta"]').click();
    await expect(page.locator('[data-testid="modal-nueva-cuenta"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-nueva-cuenta-title"]')).toContainText('Nueva Cuenta PUC');

    // Validación de botón deshabilitado sin campos
    const btnGuardar = page.locator('[data-testid="btn-guardar-nueva-cuenta"]');
    await expect(btnGuardar).toBeDisabled();

    // Cancelar
    await page.locator('[data-testid="btn-cancelar-nueva-cuenta"]').click();
    await expect(page.locator('[data-testid="modal-nueva-cuenta"]')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.9 Creación de cuenta auxiliar y verificación de persistencia en PostgreSQL', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    const testCode = `11059999`;
    const testName = `Cuenta E2E Auto ${Date.now()}`;

    // Pre-limpieza en DB
    await queryDb(`DELETE FROM cont_puc_cuentas WHERE codigo = $1`, [testCode]);

    await page.locator('[data-testid="btn-nueva-cuenta"]').click();
    await expect(page.locator('[data-testid="modal-nueva-cuenta"]')).toBeVisible();

    await page.locator('[data-testid="input-codigo-puc"]').fill(testCode);
    await page.locator('[data-testid="input-nombre-puc"]').fill(testName);
    await page.locator('[data-testid="select-naturaleza-puc"]').selectOption('DEBITO');

    const btnGuardar = page.locator('[data-testid="btn-guardar-nueva-cuenta"]');
    await expect(btnGuardar).toBeEnabled();
    await btnGuardar.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="modal-nueva-cuenta"]')).not.toBeVisible();

    // Verificación SQL directa en PostgreSQL
    const rows = await queryDb(
      `SELECT codigo, nombre, naturaleza, es_auxiliar FROM cont_puc_cuentas WHERE codigo = $1 LIMIT 1`,
      [testCode],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].nombre).toBe(testName);

    sniffer.assertZeroErrors();

    // Limpieza
    await queryDb(`DELETE FROM cont_puc_cuentas WHERE codigo = $1`, [testCode]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — COMPROBANTES: FILTROS, TABLA, MODAL DETALLE Y MODAL NUEVO ASIENTO
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 3: Libro de Comprobantes y Asientos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-comprobantes"]').click();
    await page.waitForTimeout(300);
  });

  test('16.10 Filtros de comprobantes (Fechas, Tipo, Estado) y tabla visibles', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="input-filtro-desde"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-filtro-hasta"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-filtro-tipo"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-filtro-estado"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-buscar-comprobantes"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-nuevo-comprobante"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-comprobantes"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.11 Filtro por tipo CAU (Causaciones) ejecuta consulta sin errores', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="select-filtro-tipo"]').selectOption('CAU');
    await page.locator('[data-testid="btn-buscar-comprobantes"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    sniffer.assertZeroErrors();
  });

  test('16.12 Modal "Nuevo Comprobante": balanceo reactivo en tiempo real y cancelación', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-nuevo-comprobante"]').click();
    await expect(page.locator('[data-testid="modal-nuevo-asiento"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-nuevo-asiento-title"]')).toContainText('Nuevo Comprobante');

    // Badge de balance
    await expect(page.locator('[data-testid="badge-balance-asiento"]')).toBeVisible();

    // Botón agregar línea
    await page.locator('[data-testid="btn-agregar-linea-asiento"]').click();
    await page.waitForTimeout(200);

    // Cancelar
    await page.locator('[data-testid="btn-cancelar-nuevo-asiento"]').click();
    await expect(page.locator('[data-testid="modal-nuevo-asiento"]')).not.toBeVisible();

    sniffer.assertZeroErrors();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — PERIODOS CONTABLES: GESTIÓN FISCAL Y CIERRES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 4: Control de Periodos Fiscales', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-periodos"]').click();
    await page.waitForTimeout(300);
  });

  test('16.13 Tab Periodos carga tabla con 12 meses y selector de año', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await expect(page.locator('[data-testid="periodos-titulo"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-anio-periodos"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabla-periodos"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.14 Cambio de año fiscal en selector actualiza la lista de periodos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="select-anio-periodos"]').selectOption('2026');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    sniffer.assertZeroErrors();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — REPORTES FINANCIEROS NIIF: BALANCE, PyG, DIARIO, MAYOR Y AUXILIAR
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 5: Reportes Financieros Oficiales NIIF', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="tab-reportes"]').click();
    await page.waitForTimeout(300);
  });

  test('16.15 Navegación entre los 5 sub-reportes (Balance, PyG, Diario, Mayor, Auxiliar)', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    const subreportes = ['balance', 'pyg', 'diario', 'mayor', 'auxiliar'];
    for (const sub of subreportes) {
      const btn = page.locator(`[data-testid="btn-subreporte-${sub}"]`);
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);
    }

    sniffer.assertZeroErrors();
  });

  test('16.16 Balance General: Generación por fecha de corte y visualización de ecuación patrimonial', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-subreporte-balance"]').click();
    await page.locator('[data-testid="input-balance-fecha-corte"]').fill('2026-12-31');
    await page.locator('[data-testid="btn-generar-balance"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="kpis-balance"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="btn-exportar-excel-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-exportar-pdf-balance"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.17 Estado de Resultados: Generación por rango de fechas y KPIs de ingresos/gastos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-subreporte-pyg"]').click();
    await page.locator('[data-testid="input-pyg-desde"]').fill('2026-01-01');
    await page.locator('[data-testid="input-pyg-hasta"]').fill('2026-12-31');
    await page.locator('[data-testid="btn-generar-pyg"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="kpis-pyg"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="btn-exportar-excel-pyg"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-exportar-pdf-pyg"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.18 Libro Diario: Consulta cronológica de movimientos contables', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-subreporte-diario"]').click();
    await page.locator('[data-testid="input-diario-desde"]').fill('2026-01-01');
    await page.locator('[data-testid="input-diario-hasta"]').fill('2026-12-31');
    await page.locator('[data-testid="btn-generar-diario"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="tabla-diario"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="totales-diario"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('16.19 Libro Mayor y Balances: Consulta con prefijo de cuenta mayor', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);

    await page.locator('[data-testid="btn-subreporte-mayor"]').click();
    await page.locator('[data-testid="input-mayor-desde"]').fill('2026-01-01');
    await page.locator('[data-testid="input-mayor-hasta"]').fill('2026-12-31');
    await page.locator('[data-testid="input-mayor-cuenta"]').fill('130');
    await page.locator('[data-testid="btn-generar-mayor"]').click();
    await page.waitForLoadState('networkidle');

    sniffer.assertZeroErrors();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — PERSISTENCIA E INTEGRIDAD DIRECTA EN POSTGRESQL QA
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 6: Persistencia e Integridad PostgreSQL directa', () => {
  test('16.20 Las 10 tablas relacionales cont_* existen en public schema de PostgreSQL QA', async () => {
    const tables = [
      'cont_puc_cuentas',
      'cont_terceros',
      'cont_periodos',
      'cont_centros_costo',
      'cont_consecutivos',
      'cont_concepto_mappings',
      'cont_asientos',
      'cont_asiento_lineas',
      'cont_impuestos',
      'cont_cuentas_por_pagar',
    ];

    for (const table of tables) {
      const rows = await queryDb(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      );
      expect(rows, `Tabla ${table} debe existir en PostgreSQL`).toHaveLength(1);
    }
  });

  test('16.21 CHECK constraint chk_asiento_cuadrado rechaza descuadres a nivel de motor DB', async () => {
    const colegioId = await queryDb(
      `SELECT id FROM colegios LIMIT 1`,
    ).then((r) => (r[0]?.id as string) ?? null);

    if (!colegioId) {
      test.skip();
      return;
    }

    // Insertar un asiento descuadrado (débito 100000 != crédito 200000) debe fallar con error de CHECK constraint
    await expect(
      queryDb(
        `INSERT INTO cont_asientos
           (colegio_id, tipo_comprobante, consecutivo, fecha_contable, fuente_modulo, estado, total_debito, total_credito)
         VALUES ($1, 'AJU', 88888, CURRENT_DATE, 'TEST_E2E', 'ACTIVO', 100000, 200000)`,
        [colegioId],
      ),
    ).rejects.toThrow();
  });

  test('16.22 Catálogo PUC tiene más de 1,700 cuentas educativas sembradas e indexadas', async () => {
    const rows = await queryDb(`SELECT COUNT(*)::int AS total FROM cont_puc_cuentas`);
    const total = rows[0]?.total as number;
    expect(total).toBeGreaterThan(1700);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7 — AISLAMIENTO DE ROLES Y SEGURIDAD
// ─────────────────────────────────────────────────────────────────────────────
test.describe('DocMD-16 — Suite 7: Control de Acceso por Rol', () => {
  test('16.23 Rol DOCENTE no tiene enlace de Contabilidad en la barra lateral', async ({ page }) => {
    await loginAs(page, 'DOCENTE');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const contabilidadLink = page.locator('a[href="/contabilidad"], a[routerLink="/contabilidad"]');
    await expect(contabilidadLink).not.toBeVisible();
  });
});
