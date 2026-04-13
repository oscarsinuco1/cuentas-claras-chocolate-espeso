import { test, expect } from '@playwright/test';

test.describe('Plan Flow', () => {
  test('complete expense flow', async ({ page, context }) => {
    // This test requires the backend to be running
    test.skip(process.env.CI !== undefined, 'Skipping in CI - requires backend');

    // Create a new plan
    await page.goto('/');
    await page.getByPlaceholder('Ej: Paseo a Melgar').fill('Test E2E Plan');
    await page.getByRole('button', { name: 'Crear Plan' }).click();

    // Should redirect to plan page
    await expect(page).toHaveURL(/\/plan\/[A-Z0-9]{4}-[A-Z0-9]{4}/);

    // Get the plan code from URL
    const url = page.url();
    const code = url.split('/plan/')[1];
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // Should display plan title
    await expect(page.getByText('Test E2E Plan')).toBeVisible();

    // Add an expense quickly
    await page.getByPlaceholder('Nombre').fill('Oscar');
    await page.locator('input[placeholder="0"]').fill('100000');
    await page.getByRole('button', { name: '+' }).last().click();

    // Should show success toast
    await expect(page.getByText('+$100,000')).toBeVisible({ timeout: 3000 });

    // Should update total
    await expect(page.getByText('$100,000')).toBeVisible();

    // Add another participant expense
    await page.getByPlaceholder('Nombre').fill('Juan');
    await page.locator('input[placeholder="0"]').fill('50000');
    await page.getByRole('button', { name: '+' }).last().click();

    // Should update total
    await expect(page.getByText('$150,000')).toBeVisible();

    // Open calculation modal
    await page.getByRole('button', { name: 'Calcular' }).click();

    // Should show calculation results
    await expect(page.getByText('Cálculo de cuentas')).toBeVisible();
    await expect(page.getByText('Total gastos')).toBeVisible();
    await expect(page.getByText('$150,000')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /close/i }).click();

    // Open another browser context and join the same plan
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.getByPlaceholder('XXXX-XXXX').fill(code!);
    await page2.getByRole('button').filter({ has: page2.locator('svg') }).first().click();

    // Should see the same plan
    await expect(page2.getByText('Test E2E Plan')).toBeVisible();
    await expect(page2.getByText('$150,000')).toBeVisible();

    // Add expense from second browser
    await page2.getByPlaceholder('Nombre').fill('Maria');
    await page2.locator('input[placeholder="0"]').fill('75000');
    await page2.getByRole('button', { name: '+' }).last().click();

    // First browser should see real-time update
    await expect(page.getByText('$225,000')).toBeVisible({ timeout: 5000 });
  });

  test('copy plan code', async ({ page }) => {
    test.skip(process.env.CI !== undefined, 'Skipping in CI - requires backend');

    await page.goto('/');
    await page.getByPlaceholder('Ej: Paseo a Melgar').fill('Copy Test');
    await page.getByRole('button', { name: 'Crear Plan' }).click();

    await expect(page).toHaveURL(/\/plan\//);

    // Click copy button
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-copy') }).click();

    // Should show success toast
    await expect(page.getByText('Código copiado')).toBeVisible();
  });
});
