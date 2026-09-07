const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4201';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/manual/images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Iniciando captura de pantallas para el Manual de Usuario...');
  console.log(`URL base: ${BASE_URL}`);
  console.log(`Directorio de salida: ${OUTPUT_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    deviceScaleFactor: 2 // HiDPI retina crisp screenshots
  });

  const page = await context.newPage();

  // Helper para guardar captura
  async function take(name, waitTime = 1000) {
    await page.waitForTimeout(waitTime);
    const dest = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`✓ Capturado: ${name}`);
  }

  try {
    // 00. Pantalla de Login
    console.log('Navegando a /login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await take('00_login.png', 1200);

    // Click en el rol RECTOR para ingresar
    const rectorBtn = page.locator('.role-btn.rector');
    if (await rectorBtn.isVisible()) {
      console.log('Iniciando sesión como RECTOR...');
      await rectorBtn.click();
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    }

    // 01. Dashboard Principal
    console.log('Capturando /dashboard...');
    await page.waitForLoadState('networkidle');
    await take('01_dashboard.png', 1500);

    // 02. Académico & Decreto 1290
    console.log('Capturando /academico...');
    await page.goto(`${BASE_URL}/academico`, { waitUntil: 'networkidle' });
    await take('02_academico.png', 1500);

    // 03. Matrículas & Ficha 360°
    console.log('Capturando /matriculas...');
    await page.goto(`${BASE_URL}/matriculas`, { waitUntil: 'networkidle' });
    await take('03_matriculas.png', 1500);

    // 04. Tesorería - Tab 1: Estado de Cuenta
    console.log('Capturando /tesoreria (Estado de Cuenta)...');
    await page.goto(`${BASE_URL}/tesoreria`, { waitUntil: 'networkidle' });
    await take('04_tesoreria_estado_cuenta.png', 1500);

    // 05. Tesorería - Tab 2: Facturas & Cobros
    console.log('Capturando /tesoreria (Facturas)...');
    const tabFacturas = page.locator('button:has-text("Cuentas de Cobro"), button:has-text("Facturas"), .tab-btn:nth-child(2)').first();
    if (await tabFacturas.isVisible()) {
      await tabFacturas.click();
      await take('05_tesoreria_facturas.png', 1000);
    }

    // 06. Tesorería - Tab 3: Recaudos
    console.log('Capturando /tesoreria (Recaudos)...');
    const tabRecaudos = page.locator('button:has-text("Recaudos"), .tab-btn:nth-child(3)').first();
    if (await tabRecaudos.isVisible()) {
      await tabRecaudos.click();
      await take('06_tesoreria_recaudos.png', 1000);
    }

    // 07. Tesorería - Tab 4: Acuerdos de Pago
    console.log('Capturando /tesoreria (Acuerdos)...');
    const tabAcuerdos = page.locator('button:has-text("Acuerdos"), .tab-btn:nth-child(4)').first();
    if (await tabAcuerdos.isVisible()) {
      await tabAcuerdos.click();
      await take('07_tesoreria_acuerdos.png', 1000);
    }

    // 08. Modal Configuración Financiera
    console.log('Abriendo modal de Configuración Financiera...');
    const btnConfig = page.locator('button:has-text("Configurar Parámetros")').first();
    if (await btnConfig.isVisible()) {
      await btnConfig.click();
      await take('08_tesoreria_modal_config.png', 1000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    const remainingPages = [
      { url: '/convivencia', file: '09_convivencia.png', name: 'Convivencia' },
      { url: '/asistencia', file: '10_asistencia.png', name: 'Asistencia' },
      { url: '/lms', file: '11_lms.png', name: 'LMS & Aula Virtual' },
      { url: '/gobierno-escolar', file: '12_gobierno_escolar.png', name: 'Gobierno Escolar' },
      { url: '/inclusion', file: '13_inclusion_piar.png', name: 'Inclusión & PIAR' },
      { url: '/habeas-data', file: '14_habeas_data.png', name: 'Habeas Data' },
      { url: '/comunicaciones', file: '15_comunicaciones.png', name: 'Comunicaciones' },
      { url: '/documental', file: '16_documental.png', name: 'Gestión Documental' },
      { url: '/importador', file: '17_importador.png', name: 'Importador SIMAT' },
      { url: '/porteria', file: '18_porteria.png', name: 'Portería' },
      { url: '/talento-humano', file: '19_talento_humano.png', name: 'Talento Humano' },
      { url: '/transporte-restaurante', file: '20_transporte_restaurante.png', name: 'Transporte & Restaurante' },
      { url: '/educore-ai', file: '21_educore_ai.png', name: 'EduCore AI' },
      { url: '/public/firmar-matricula', file: '22_firma_matricula_publica.png', name: 'Firma Matrícula Pública' },
      { url: '/public/firmar-acta', file: '23_firma_acta_disciplinaria.png', name: 'Firma Acta Pública' }
    ];

    for (const item of remainingPages) {
      try {
        console.log(`Capturando ${item.url} (${item.name})...`);
        await page.goto(`${BASE_URL}${item.url}`, { waitUntil: 'networkidle', timeout: 20000 });
        await take(item.file, 1200);
      } catch (err) {
        console.warn(`Advertencia al capturar ${item.url}:`, err.message);
        try {
          await take(item.file, 500);
        } catch (_) {}
      }
    }

    console.log('✓ ¡Todas las capturas de pantalla fueron completadas exitosamente!');
  } catch (error) {
    console.error('Error durante la captura:', error);
  } finally {
    await browser.close();
  }
}

capture();
