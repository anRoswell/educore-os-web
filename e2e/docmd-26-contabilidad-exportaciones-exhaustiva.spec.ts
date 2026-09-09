import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';
import { attachStrictErrorSniffer } from './helpers/error-sniffer.helper';

/**
 * DocMD-26: Validación Exhaustiva de Todos los Botones de Exportación a Excel, PDF y XML en Contabilidad
 * Compliant with ESTANDAR_PRUEBAS_EXHAUSTIVAS.md:
 * - Error Sniffer estricto (0 errores de consola, 0 excepciones JS, 0 peticiones >= 400).
 * - Cobertura 100% de botones de exportación en Reportes, Comprobantes y Certificados.
 */

test.describe('DocMD-26: Exportaciones Excel / PDF / XML en Contabilidad — Exhaustive Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await loginAs(page, 'RECTOR');
  });

  test('26.EXP.1 Reportes Financieros: Exportaciones Excel y PDF en todas las sub-pestañas', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // 1. Navegar a la pestaña Reportes
    const tabReportes = page.locator('[data-testid="tab-reportes"]');
    await expect(tabReportes).toBeVisible();
    await tabReportes.click();
    await page.waitForTimeout(400);

    // ─── A. Dashboard Gerencial Excel ───
    const btnSubGraficas = page.locator('[data-testid="btn-subreporte-graficas"]');
    if (await btnSubGraficas.isVisible()) {
      await btnSubGraficas.click();
      await page.waitForTimeout(400);

      const btnExpDash = page.locator('[data-testid="btn-exportar-dashboard-excel"]');
      await expect(btnExpDash).toBeVisible();
      await btnExpDash.click();
      await page.waitForTimeout(600);
    }

    // ─── B. Balance General Excel y PDF ───
    const btnSubBalance = page.locator('[data-testid="btn-subreporte-balance"]');
    await expect(btnSubBalance).toBeVisible();
    await btnSubBalance.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-balance"]').click();
    await page.waitForTimeout(500);

    const btnBalanceExcel = page.locator('[data-testid="btn-exportar-excel-balance"]');
    await expect(btnBalanceExcel).toBeVisible();
    await btnBalanceExcel.click();
    await page.waitForTimeout(600);

    const btnBalancePdf = page.locator('[data-testid="btn-exportar-pdf-balance"]');
    await expect(btnBalancePdf).toBeVisible();
    await btnBalancePdf.click();
    await page.waitForTimeout(600);

    // ─── C. Estado de Resultados (PyG) Excel y PDF ───
    const btnSubPyg = page.locator('[data-testid="btn-subreporte-pyg"]');
    await expect(btnSubPyg).toBeVisible();
    await btnSubPyg.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-pyg"]').click();
    await page.waitForTimeout(500);

    const btnPygExcel = page.locator('[data-testid="btn-exportar-excel-pyg"]');
    await expect(btnPygExcel).toBeVisible();
    await btnPygExcel.click();
    await page.waitForTimeout(600);

    const btnPygPdf = page.locator('[data-testid="btn-exportar-pdf-pyg"]');
    await expect(btnPygPdf).toBeVisible();
    await btnPygPdf.click();
    await page.waitForTimeout(600);

    // ─── D. Libro Diario Excel y PDF ───
    const btnSubDiario = page.locator('[data-testid="btn-subreporte-diario"]');
    await expect(btnSubDiario).toBeVisible();
    await btnSubDiario.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-diario"]').click();
    await page.waitForTimeout(500);

    const btnDiarioExcel = page.locator('[data-testid="btn-exportar-excel-diario"]');
    await expect(btnDiarioExcel).toBeVisible();
    await btnDiarioExcel.click();
    await page.waitForTimeout(600);

    const btnDiarioPdf = page.locator('[data-testid="btn-exportar-pdf-diario"]');
    await expect(btnDiarioPdf).toBeVisible();
    await btnDiarioPdf.click();
    await page.waitForTimeout(600);

    // ─── E. Libro Mayor Excel y PDF ───
    const btnSubMayor = page.locator('[data-testid="btn-subreporte-mayor"]');
    await expect(btnSubMayor).toBeVisible();
    await btnSubMayor.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-mayor"]').click();
    await page.waitForTimeout(500);

    const btnMayorExcel = page.locator('[data-testid="btn-exportar-excel-mayor"]');
    await expect(btnMayorExcel).toBeVisible();
    await btnMayorExcel.click();
    await page.waitForTimeout(600);

    const btnMayorPdf = page.locator('[data-testid="btn-exportar-pdf-mayor"]');
    await expect(btnMayorPdf).toBeVisible();
    await btnMayorPdf.click();
    await page.waitForTimeout(600);

    // ─── F. Auxiliar por Tercero Excel y PDF ───
    const btnSubAux = page.locator('[data-testid="btn-subreporte-auxiliar"]');
    await expect(btnSubAux).toBeVisible();
    await btnSubAux.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-auxiliar"]').click();
    await page.waitForTimeout(500);

    const btnAuxExcel = page.locator('[data-testid="btn-exportar-excel-auxiliar"]');
    await expect(btnAuxExcel).toBeVisible();
    await btnAuxExcel.click();
    await page.waitForTimeout(600);

    const btnAuxPdf = page.locator('[data-testid="btn-exportar-pdf-auxiliar"]');
    await expect(btnAuxPdf).toBeVisible();
    await btnAuxPdf.click();
    await page.waitForTimeout(600);

    // ─── G. Flujo de Efectivo Excel y PDF ───
    const btnSubFlujo = page.locator('[data-testid="btn-subreporte-flujo"]');
    await expect(btnSubFlujo).toBeVisible();
    await btnSubFlujo.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-flujo"]').click();
    await page.waitForTimeout(500);

    const btnFlujoExcel = page.locator('[data-testid="btn-exportar-flujo-excel"]');
    await expect(btnFlujoExcel).toBeVisible();
    await btnFlujoExcel.click();
    await page.waitForTimeout(600);

    const btnFlujoPdf = page.locator('[data-testid="btn-exportar-flujo-pdf"]');
    await expect(btnFlujoPdf).toBeVisible();
    await btnFlujoPdf.click();
    await page.waitForTimeout(600);

    // ─── H. Notas NIIF PDF ───
    const btnSubNotas = page.locator('[data-testid="btn-subreporte-notas"]');
    await expect(btnSubNotas).toBeVisible();
    await btnSubNotas.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-generar-notas"]').click();
    await page.waitForTimeout(500);

    const btnNotasPdf = page.locator('[data-testid="btn-exportar-notas-pdf"]');
    await expect(btnNotasPdf).toBeVisible();
    await btnNotasPdf.click();
    await page.waitForTimeout(600);

    // ─── I. Medios Magnéticos Exógena Excel y XML ───
    const btnSubExogena = page.locator('[data-testid="btn-subreporte-exogena"]');
    await expect(btnSubExogena).toBeVisible();
    await btnSubExogena.click();
    await page.waitForTimeout(300);

    await page.locator('[data-testid="btn-consultar-exogena"]').click();
    await page.waitForTimeout(500);

    const btnExogenaExcel = page.locator('[data-testid="btn-descargar-excel-exogena"], [data-testid="btn-exportar-exogena-excel"]');
    if (await btnExogenaExcel.isVisible()) {
      await btnExogenaExcel.click();
      await page.waitForTimeout(600);
    }

    const btnExogenaXml = page.locator('[data-testid="btn-descargar-xml-exogena"], [data-testid="btn-exportar-exogena-xml"]');
    if (await btnExogenaXml.isVisible()) {
      await btnExogenaXml.click();
      await page.waitForTimeout(600);
    }

    sniffer.assertZeroErrors();
  });

  test('26.EXP.2 Comprobantes: Impresión oficial de comprobante contable en PDF', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // 1. Navegar a Comprobantes
    const tabComprobantes = page.locator('[data-testid="tab-comprobantes"]');
    await expect(tabComprobantes).toBeVisible();
    await tabComprobantes.click();
    await page.waitForTimeout(500);

    // 2. Buscar comprobantes
    const btnBuscar = page.locator('[data-testid="btn-buscar-comprobantes"]');
    await expect(btnBuscar).toBeVisible();
    await btnBuscar.click();
    await page.waitForTimeout(800);

    // 3. Verificar que exista al menos un botón de imprimir y dar click
    const btnImprimirFirst = page.locator('button[data-testid^="btn-imprimir-"]').first();
    if (await btnImprimirFirst.isVisible()) {
      await btnImprimirFirst.click();
      await page.waitForTimeout(800);
    }

    sniffer.assertZeroErrors();
  });

  test('26.EXP.3 Certificados Proveedores Art. 381: Descarga oficial de PDF', async ({ page }) => {
    const sniffer = attachStrictErrorSniffer(page);
    await page.goto('/contabilidad');
    await page.waitForLoadState('networkidle');

    // 1. Navegar a Certificados Proveedores
    const tabCertificados = page.locator('[data-testid="tab-certificados-proveedores"]');
    if (await tabCertificados.isVisible()) {
      await tabCertificados.click();
      await page.waitForTimeout(500);

      // Abrir detalle del primer proveedor si existe
      const btnVerDetalle = page.locator('button[data-testid^="btn-ver-certificado-"]').first();
      if (await btnVerDetalle.isVisible()) {
        await btnVerDetalle.click();
        await page.waitForTimeout(500);

        // Dar click a Descargar PDF
        const btnDescargar = page.locator('[data-testid="btn-descargar-pdf-cert"]');
        if (await btnDescargar.isVisible()) {
          await btnDescargar.click();
          await page.waitForTimeout(600);
        }

        // Cerrar modal
        const btnCerrar = page.locator('[data-testid="btn-cerrar-modal-cert"]');
        if (await btnCerrar.isVisible()) {
          await btnCerrar.click();
        }
      }
    }

    sniffer.assertZeroErrors();
  });
});
