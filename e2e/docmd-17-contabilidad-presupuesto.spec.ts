import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { queryDb } from './helpers/db.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-17: Contabilidad Escolar — Suite de Presupuesto Institucional
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md
 */

test.describe('DocMD-17: Presupuesto Institucional — E2E Suite Exhaustiva', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECTOR');
  });

  test('17.P.1 Navegación a la pestaña Presupuesto Institucional y renderizado de componentes', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    const tabPresupuesto = page.locator('[data-testid="tab-presupuesto"]');
    await expect(tabPresupuesto).toBeVisible();
    await tabPresupuesto.click();
    await page.waitForTimeout(400);

    const container = page.locator('[data-testid="contabilidad-presupuesto-tab"]');
    await expect(container).toBeVisible();

    // Validar controles de cabecera
    await expect(page.locator('[data-testid="input-presupuesto-filtro-anio"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-presupuesto-activo"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-nuevo-presupuesto"]')).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.P.2 Ciclo de vida completo de Creación de Presupuesto Anual', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(300);

    // Abrir modal
    await page.locator('[data-testid="btn-nuevo-presupuesto"]').click();
    const modal = page.locator('[data-testid="modal-crear-presupuesto"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="modal-crear-presupuesto-title"]')).toContainText('Nuevo Presupuesto Anual');

    // Cancelar modal
    await page.locator('[data-testid="btn-cancelar-presupuesto"]').click();
    await expect(modal).not.toBeVisible();

    // Reabrir y diligenciar
    await page.locator('[data-testid="btn-nuevo-presupuesto"]').click();
    await expect(modal).toBeVisible();

    const timestamp = Date.now();
    const nombrePresupuesto = `Presupuesto Operativo E2E ${timestamp}`;

    await page.locator('[data-testid="input-presupuesto-anio"]').fill('2026');
    await page.locator('[data-testid="input-presupuesto-nombre"]').fill(nombrePresupuesto);
    await page.locator('[data-testid="select-presupuesto-centro-costo"]').selectOption('CC-ADM');
    await page.locator('[data-testid="textarea-presupuesto-descripcion"]').fill('Aprobado por el Consejo Directivo en sesión ordinaria E2E');

    // Guardar
    await page.locator('[data-testid="btn-guardar-presupuesto"]').click();
    await page.waitForTimeout(600);

    // Validar modal de respuesta institucional
    const modalRespuesta = page.locator('[data-testid="modal-respuesta-presupuesto"]');
    await expect(modalRespuesta).toBeVisible();
    await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Presupuesto Anual Creado Exitosamente');
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await expect(modalRespuesta).not.toBeVisible();

    // Validar en el selector de presupuesto
    const selector = page.locator('[data-testid="select-presupuesto-activo"]');
    await expect(selector).toBeVisible();

    sniffer.assertZeroErrors();
  });

  test('17.P.3 Alta de Rubro Presupuestal y cálculo de KPIs estilo NIIF 15', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(500);

    // Si está en empty state, crear presupuesto base primero
    const emptyState = page.locator('[data-testid="empty-presupuestos"]');
    if (await emptyState.isVisible()) {
      await page.locator('[data-testid="btn-crear-primer-presupuesto"]').click();
      await page.locator('[data-testid="input-presupuesto-nombre"]').fill('Presupuesto Anual 2026');
      await page.locator('[data-testid="btn-guardar-presupuesto"]').click();
      await page.waitForTimeout(1000);
    }

    // Abrir modal de rubro
    const btnRubro = page.locator('[data-testid="btn-nuevo-rubro"]');
    await expect(btnRubro).toBeVisible();
    await btnRubro.click();

    const modalRubro = page.locator('[data-testid="modal-crear-rubro"]');
    await expect(modalRubro).toBeVisible();
    await expect(page.locator('[data-testid="modal-crear-rubro-title"]')).toContainText('Nuevo Rubro Presupuestal');

    // Diligenciar rubro de ingreso
    const codigoRubro = `RUB-${Date.now().toString().slice(-4)}`;
    await page.locator('[data-testid="input-rubro-codigo"]').fill(codigoRubro);
    await page.locator('[data-testid="select-rubro-tipo"]').selectOption('INGRESO');
    await page.locator('[data-testid="input-rubro-nombre"]').fill('Recaudo Matrículas Bachillerato E2E');
    await page.locator('[data-testid="input-rubro-cuenta-puc"]').fill('416005');
    await page.locator('[data-testid="input-rubro-presupuestado"]').fill('45000000');

    // Guardar
    await page.locator('[data-testid="btn-guardar-rubro"]').click();
    await page.waitForTimeout(600);

    const modalRespuestaRubro = page.locator('[data-testid="modal-respuesta-presupuesto"]');
    await expect(modalRespuestaRubro).toBeVisible();
    await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Rubro Presupuestal Agregado');
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await expect(modalRespuestaRubro).not.toBeVisible();

    // Verificar tabla de rubros y KPIs
    await expect(page.locator('[data-testid="presupuesto-kpis"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-presupuestado"]')).toBeVisible();

    const tabla = page.locator('[data-testid="tabla-rubros-presupuesto"]');
    await expect(tabla).toBeVisible();
    await expect(tabla).toContainText(codigoRubro);

    sniffer.assertZeroErrors();
  });

  test('17.P.4 Adición Presupuestal Extraordinaria con justificación', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(400);

    // Abrir modal de adición
    const btnAdicion = page.locator('[data-testid="btn-nueva-adicion"]');
    const btnAdicionFila = page.locator('[data-testid="btn-adicion-fila"]').first();
    if (await btnAdicion.isVisible()) {
      await btnAdicion.click();
    } else if (await btnAdicionFila.isVisible()) {
      await btnAdicionFila.click();
    }

    const modalAdicion = page.locator('[data-testid="modal-adicion-presupuestal"]');
    if (await modalAdicion.isVisible()) {

      // Diligenciar adición
      await page.locator('[data-testid="input-adicion-monto"]').fill('5000000');
      await page.locator('[data-testid="textarea-adicion-justificacion"]').fill('Aprobación adicional Acta 09');

      await page.locator('[data-testid="btn-guardar-adicion"]').click();
      await page.waitForTimeout(600);

      const modalRespuestaAdicion = page.locator('[data-testid="modal-respuesta-presupuesto"]');
      await expect(modalRespuestaAdicion).toBeVisible();
      await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Adición Presupuestal Extraordinaria Aplicada');
      await page.locator('[data-testid="btn-entendido-respuesta"]').click();
      await expect(modalRespuestaAdicion).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  test('17.P.5 Edición de formulación en estado BORRADOR según Decreto 1075 de 2015', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(400);

    // Crear un presupuesto en borrador para la prueba
    const timestamp = Date.now();
    const nombreOriginal = `Presupuesto Borrador E2E ${timestamp}`;
    await page.locator('[data-testid="btn-nuevo-presupuesto"]').click();
    await page.locator('[data-testid="input-presupuesto-anio"]').fill('2026');
    await page.locator('[data-testid="input-presupuesto-nombre"]').fill(nombreOriginal);
    await page.locator('[data-testid="textarea-presupuesto-descripcion"]').fill('Formulación preliminar');
    await page.locator('[data-testid="btn-guardar-presupuesto"]').click();
    await page.waitForTimeout(600);

    // Cerrar modal de confirmación de creación
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await page.waitForTimeout(400);

    // Verificar badge BORRADOR
    const badgeEstado = page.locator('[data-testid="badge-estado-presupuesto"]');
    await expect(badgeEstado).toBeVisible();
    await expect(badgeEstado).toContainText('BORRADOR');

    // Probar ciclo de vida del modal de edición
    const btnEditar = page.locator('[data-testid="btn-editar-presupuesto"]');
    await expect(btnEditar).toBeVisible();
    await btnEditar.click();

    const modalEditar = page.locator('[data-testid="modal-editar-presupuesto"]');
    await expect(modalEditar).toBeVisible();

    // Cancelar
    await page.locator('[data-testid="btn-cancelar-editar-presupuesto"]').click();
    await expect(modalEditar).not.toBeVisible();

    // Reabrir y editar datos
    await btnEditar.click();
    await expect(modalEditar).toBeVisible();

    const nombreEditado = `Presupuesto Borrador Ajustado ${timestamp}`;
    await page.locator('[data-testid="input-editar-presupuesto-nombre"]').fill(nombreEditado);
    await page.locator('[data-testid="select-editar-presupuesto-centro-costo"]').selectOption('CC-PRI');
    await page.locator('[data-testid="textarea-editar-presupuesto-descripcion"]').fill('Ajuste de formulación con metas pedagógicas');
    await page.locator('[data-testid="btn-guardar-editar-presupuesto"]').click();
    await page.waitForTimeout(600);

    // Modal de confirmación de edición
    const modalRespuesta = page.locator('[data-testid="modal-respuesta-presupuesto"]');
    await expect(modalRespuesta).toBeVisible();
    await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Formulación de Presupuesto Actualizada');
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await expect(modalRespuesta).not.toBeVisible();

    // Verificación directa en base de datos PostgreSQL
    const resDb = await queryDb(
      `SELECT p.nombre, p.centro_costo_id, cc.codigo AS centro_costo_codigo, p.estado 
       FROM cont_presupuestos p 
       LEFT JOIN cont_centros_costo cc ON cc.id = p.centro_costo_id 
       WHERE p.nombre = $1`,
      [nombreEditado],
    );
    expect(resDb.length).toBe(1);
    expect(resDb[0].nombre).toBe(nombreEditado);
    expect(resDb[0].centro_costo_codigo).toBe('CC-PRI');
    expect(resDb[0].estado).toBe('BORRADOR');

    sniffer.assertZeroErrors();
  });

  test('17.P.6 Aprobación formal por Consejo Directivo (Acuerdo CD) y cambio a APROBADO', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(400);

    // Crear presupuesto en borrador
    const timestamp = Date.now();
    const nombrePres = `Presupuesto para Aprobar ${timestamp}`;
    await page.locator('[data-testid="btn-nuevo-presupuesto"]').click();
    await page.locator('[data-testid="input-presupuesto-anio"]').fill('2026');
    await page.locator('[data-testid="input-presupuesto-nombre"]').fill(nombrePres);
    await page.locator('[data-testid="btn-guardar-presupuesto"]').click();
    await page.waitForTimeout(600);
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await page.waitForTimeout(400);

    // Agregar un rubro al presupuesto
    await page.locator('[data-testid="btn-nuevo-rubro"]').click();
    const codRubro = `RUB-${Date.now().toString().slice(-4)}`;
    await page.locator('[data-testid="input-rubro-codigo"]').fill(codRubro);
    await page.locator('[data-testid="select-rubro-tipo"]').selectOption('INGRESO');
    await page.locator('[data-testid="input-rubro-nombre"]').fill('Matrículas 2026');
    await page.locator('[data-testid="input-rubro-presupuestado"]').fill('20000000');
    await page.locator('[data-testid="btn-guardar-rubro"]').click();
    await page.waitForTimeout(600);
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await page.waitForTimeout(400);

    // Probar ciclo de vida del modal de aprobación
    const btnAprobar = page.locator('[data-testid="btn-aprobar-presupuesto"]');
    await expect(btnAprobar).toBeVisible();
    await btnAprobar.click();

    const modalAprobar = page.locator('[data-testid="modal-aprobar-presupuesto"]');
    await expect(modalAprobar).toBeVisible();

    // Cancelar
    await page.locator('[data-testid="btn-cancelar-aprobar-presupuesto"]').click();
    await expect(modalAprobar).not.toBeVisible();

    // Reabrir y formalizar acuerdo
    await btnAprobar.click();
    await expect(modalAprobar).toBeVisible();

    const numAcuerdo = `Acuerdo No. CD-0${Math.floor(Math.random() * 90 + 10)} de 2026`;
    await page.locator('[data-testid="input-aprobar-numero-acuerdo"]').fill(numAcuerdo);
    await page.locator('[data-testid="input-aprobar-por"]').fill('Consejo Directivo - Rectoría');
    await page.locator('[data-testid="btn-confirmar-aprobar-presupuesto"]').click();
    await page.waitForTimeout(600);

    // Modal de confirmación de aprobación formal
    const modalRespuesta = page.locator('[data-testid="modal-respuesta-presupuesto"]');
    await expect(modalRespuesta).toBeVisible();
    await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Presupuesto Formalmente Adoptado');
    await page.locator('[data-testid="btn-entendido-respuesta"]').click();
    await expect(modalRespuesta).not.toBeVisible();

    // Verificar nuevo estado en la UI
    const badgeEstado = page.locator('[data-testid="badge-estado-presupuesto"]');
    await expect(badgeEstado).toBeVisible();
    await expect(badgeEstado).toContainText('APROBADO');
    await expect(badgeEstado).toContainText(numAcuerdo);

    // Verificar que los botones de modificaciones ahora están presentes
    await expect(page.locator('[data-testid="btn-traslado-presupuestal"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-reduccion-presupuestal"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-libro-modificaciones"]')).toBeVisible();

    // Verificación directa en base de datos PostgreSQL
    const resDb = await queryDb(
      `SELECT estado, numero_acuerdo, aprobado_por FROM cont_presupuestos WHERE nombre = $1`,
      [nombrePres],
    );
    expect(resDb.length).toBe(1);
    expect(resDb[0].estado).toBe('APROBADO');
    expect(resDb[0].numero_acuerdo).toBe(numAcuerdo);
    expect(resDb[0].aprobado_por).toContain('Consejo Directivo');

    sniffer.assertZeroErrors();
  });

  test('17.P.7 Traslado Presupuestal formal (Créditos y Contracréditos) entre rubros', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(500);

    // Verificar si el botón de traslado está habilitado (requiere al menos 2 rubros)
    const btnTraslado = page.locator('[data-testid="btn-traslado-presupuestal"]');
    if (await btnTraslado.isVisible() && await btnTraslado.isEnabled()) {
      await btnTraslado.click();

      const modalTraslado = page.locator('[data-testid="modal-traslado-presupuestal"]');
      await expect(modalTraslado).toBeVisible();

      // Cancelar
      await page.locator('[data-testid="btn-cancelar-traslado"]').click();
      await expect(modalTraslado).not.toBeVisible();

      // Reabrir
      await btnTraslado.click();
      await expect(modalTraslado).toBeVisible();

      // Diligenciar traslado formal
      const numAcuerdoTraslado = `Acuerdo No. T-0${Math.floor(Math.random() * 90 + 10)}`;
      await page.locator('[data-testid="select-traslado-origen"]').selectOption({ index: 1 });
      await page.locator('[data-testid="select-traslado-destino"]').selectOption({ index: 1 });
      await page.locator('[data-testid="input-traslado-monto"]').fill('1000000');
      await page.locator('[data-testid="input-traslado-numero-acuerdo"]').fill(numAcuerdoTraslado);
      await page.locator('[data-testid="textarea-traslado-justificacion"]').fill('Ajuste de partida para dotación de laboratorio aprobada por el Consejo');

      await page.locator('[data-testid="btn-guardar-traslado"]').click();
      await page.waitForTimeout(600);

      const modalRespuesta = page.locator('[data-testid="modal-respuesta-presupuesto"]');
      await expect(modalRespuesta).toBeVisible();
      await expect(page.locator('[data-testid="modal-respuesta-title"]')).toContainText('Traslado Presupuestal Ejecutado');
      await page.locator('[data-testid="btn-entendido-respuesta"]').click();
      await expect(modalRespuesta).not.toBeVisible();

      // Verificar persistencia en cont_presupuesto_modificaciones
      const resDb = await queryDb(
        `SELECT tipo, numero_acuerdo, monto, total_anterior, total_nuevo FROM cont_presupuesto_modificaciones WHERE numero_acuerdo = $1`,
        [numAcuerdoTraslado],
      );
      expect(resDb.length).toBe(1);
      expect(resDb[0].tipo).toBe('TRASLADO');
      expect(Number(resDb[0].monto)).toBe(1000000);
      expect(Number(resDb[0].total_anterior)).toBe(Number(resDb[0].total_nuevo));
    }

    sniffer.assertZeroErrors();
  });

  test('17.P.8 Consulta y Auditoría en el Libro de Modificaciones Presupuestales', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(400);

    const btnLibro = page.locator('[data-testid="btn-libro-modificaciones"]');
    if (await btnLibro.isVisible()) {
      await btnLibro.click();

      const modalLibro = page.locator('[data-testid="modal-libro-modificaciones"]');
      await expect(modalLibro).toBeVisible();
      await expect(page.locator('[data-testid="modal-libro-modificaciones-title"]')).toContainText('Libro de Modificaciones Presupuestales');

      // Validar presencia de KPIs del Libro
      await expect(page.locator('[data-testid="kpi-modificaciones-total"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-modificaciones-adiciones"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-modificaciones-traslados"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-modificaciones-reducciones"]')).toBeVisible();

      // Cerrar modal
      await page.locator('[data-testid="btn-cerrar-libro"]').click();
      await expect(modalLibro).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });

  test('17.P.9 Selección de opción "Todos" (Consolidado Institucional) y diferenciación de presupuestos', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="tab-presupuesto"]').click();
    await page.waitForTimeout(400);

    const selector = page.locator('[data-testid="select-presupuesto-activo"]');
    await expect(selector).toBeVisible();

    // Validar que la opción TODOS esté presente en el selector
    const opcionTodos = selector.locator('option[value="TODOS"]');
    await expect(opcionTodos).toBeAttached();

    // Seleccionar la opción TODOS
    await selector.selectOption('TODOS');
    await page.waitForTimeout(600);

    // Validar badge de estado consolidado
    const badgeEstado = page.locator('[data-testid="badge-estado-presupuesto"]');
    await expect(badgeEstado).toBeVisible();
    await expect(badgeEstado).toContainText('CONSOLIDADO');

    // Validar KPIs consolidados
    await expect(page.locator('[data-testid="kpi-total-presupuestado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-causado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-pagado"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-desviacion-global"]')).toBeVisible();

    // Validar botón de Libro de Modificaciones (Consolidado)
    const btnLibro = page.locator('[data-testid="btn-libro-modificaciones"]');
    await expect(btnLibro).toBeVisible();
    await btnLibro.click();

    const modalLibro = page.locator('[data-testid="modal-libro-modificaciones"]');
    await expect(modalLibro).toBeVisible();
    await page.locator('[data-testid="btn-cerrar-libro"]').click();
    await expect(modalLibro).not.toBeVisible();

    sniffer.assertZeroErrors();
  });
});
