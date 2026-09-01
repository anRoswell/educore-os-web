/**
 * Utilidad universal para imprimir elementos HTML de forma 100% aislada.
 * Crea un iframe temporal oculto que inyecta únicamente el contenido del documento
 * con estilos limpios y profesionales, evitando hojas en blanco o elementos de la interfaz web.
 */
export function imprimirElementoHtml(
  selectorOElemento: string | HTMLElement,
  tituloDocumento: string = 'Documento Oficial EduCoreOS'
): void {
  let elemento: HTMLElement | null = null;

  if (typeof selectorOElemento === 'string') {
    // 1. Intentar por ID directo
    elemento = document.getElementById(selectorOElemento);
    // 2. Intentar por selector tal cual (ej. '#id' o '.class')
    if (!elemento) {
      elemento = document.querySelector<HTMLElement>(selectorOElemento);
    }
    // 3. Intentar agregando prefijo '#'
    if (!elemento && !selectorOElemento.startsWith('#') && !selectorOElemento.startsWith('.')) {
      elemento = document.querySelector<HTMLElement>(`#${selectorOElemento}`);
    }
  } else {
    elemento = selectorOElemento;
  }

  if (!elemento) {
    console.error(`[imprimirElementoHtml] No se encontró el elemento a imprimir:`, selectorOElemento);
    return;
  }

  // Clonar hojas de estilo existentes en el documento
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((styleNode) => styleNode.outerHTML)
    .join('\n');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('[imprimirElementoHtml] No se pudo acceder al documento del iframe de impresión.');
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>${tituloDocumento}</title>
      ${styles}
      <style>
        @page {
          size: auto;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        th, td {
          padding: 5px 8px !important;
        }
        h1, h2, h3, h4, h5, p {
          margin-top: 0 !important;
        }
        .btn, .no-print, button, .close-btn, .modal-backdrop, .modal-header, .modal-footer {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div style="width: 100%; padding: 10px; background: #ffffff;">
        ${elemento.innerHTML}
      </div>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error al ejecutar impresión en iframe:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 300);
}
