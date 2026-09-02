import { Page, expect } from '@playwright/test';

export type DemoRole = 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE';

/**
 * Log into EduCoreOS Web application using a specific role.
 */
export async function loginAs(page: Page, role: DemoRole = 'RECTOR', colegioIndex: number = 0) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  // Select school if needed
  const colegioSelect = page.locator('select.form-select');
  if (await colegioSelect.isVisible()) {
    await colegioSelect.selectOption(String(colegioIndex));
  }

  // Click the role button
  const roleClassMap: Record<DemoRole, string> = {
    RECTOR: '.role-btn.rector',
    DOCENTE: '.role-btn.docente',
    TESORERO: '.role-btn.tesorero',
    COORDINADOR: '.role-btn.coordinador',
    ESTUDIANTE: '.role-btn.estudiante',
  };

  const roleBtn = page.locator(roleClassMap[role]);
  await expect(roleBtn).toBeVisible({ timeout: 10000 });
  await roleBtn.click();

  // Wait until redirected to dashboard or layout loaded
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page.locator('.sidebar').first()).toBeVisible({ timeout: 10000 });
}
