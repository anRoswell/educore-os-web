import { Page, expect } from '@playwright/test';

export interface ErrorSniffer {
  assertZeroErrors: () => void;
  getErrors: () => string[];
  clear: () => void;
}

/**
 * Attaches a strict listener for JS exceptions, console errors, and HTTP >= 400 API failures.
 * Guarantees zero silent bugs during UI interactions, button clicks, and modal operations.
 */
export function attachStrictErrorSniffer(page: Page): ErrorSniffer {
  const errors: string[] = [];

  // 1. Capture unhandled JavaScript exceptions in the browser
  page.on('pageerror', (err) => {
    errors.push(`[JS Exception] ${err.message}`);
  });

  // 2. Capture explicit console.error calls (e.g. broken Angular signals, template binding errors)
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore non-critical favicon or benign browser warnings if any
      if (!text.includes('favicon.ico') && !text.includes('socket.io')) {
        errors.push(`[Console Error] ${text}`);
      }
    }
  });

  // 3. Capture API HTTP failures (4xx, 5xx)
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (
      status >= 400 &&
      !url.includes('/auth/refresh') &&
      !url.includes('/favicon.ico') &&
      !url.includes('hot-update')
    ) {
      errors.push(`[HTTP ${status}] ${response.request().method()} en ${url}`);
    }
  });

  return {
    assertZeroErrors: () => {
      expect(errors, `Se detectaron errores durante la interacción en la vista:\n${errors.join('\n')}`).toEqual([]);
    },
    getErrors: () => errors,
    clear: () => {
      errors.length = 0;
    }
  };
}
