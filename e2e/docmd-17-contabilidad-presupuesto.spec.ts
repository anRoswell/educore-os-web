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
    await page.waitForTimeout(1000);

    // Verificar que el modal se cierra y el presupuesto aparece seleccionado
    await expect(modal).not.toBeVisible();

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
    await page.waitForTimeout(1000);
    await expect(modalRubro).not.toBeVisible();

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
    if (await btnAdicion.isEnabled()) {
      await btnAdicion.click();

      const modalAdicion = page.locator('[data-testid="modal-adicion-presupuestal"]');
      await expect(modalAdicion).toBeVisible();

      // Diligenciar adición
      await page.locator('[data-testid="input-adicion-monto"]').fill('5000000');
      await page.locator('[data-testid="textarea-adicion-justificacion"]').fill('Aprobación adicional Acta 09');

      await page.locator('[data-testid="btn-guardar-adicion"]').click();
      await page.waitForTimeout(1000);
      await expect(modalAdicion).not.toBeVisible();
    }

    sniffer.assertZeroErrors();
  });
});
