import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title', async ({ page }) => {
    await expect(page.getByText('Cuentas Claras')).toBeVisible();
    await expect(page.getByText('Chocolate Espeso')).toBeVisible();
  });

  test('should have a join plan input', async ({ page }) => {
    const input = page.getByPlaceholder('XXXX-XXXX-XXXX');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should have a create plan form', async ({ page }) => {
    const input = page.getByPlaceholder('Ej: Paseo a Melgar');
    await expect(input).toBeVisible();
    
    const button = page.getByRole('button', { name: 'Crear Plan' });
    await expect(button).toBeVisible();
  });

  test('should show error when joining invalid plan code', async ({ page }) => {
    await page.getByPlaceholder('XXXX-XXXX-XXXX').fill('ABCD-1234-EFGH');
    await page.getByPlaceholder('XXXX-XXXX-XXXX').press('Enter');
    
    // Wait for error toast
    await expect(page.getByText('Plan no encontrado')).toBeVisible({ timeout: 5000 });
  });

  test('should require plan name to create', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Crear Plan' });
    
    // Button should be disabled when input is empty
    await expect(button).toBeDisabled();
    
    // After typing, button should be enabled
    await page.getByPlaceholder('Ej: Paseo a Melgar').fill('Test Plan');
    await expect(button).toBeEnabled();
  });

  test('should format join code input to uppercase', async ({ page }) => {
    const input = page.getByPlaceholder('XXXX-XXXX-XXXX');
    await input.fill('abcd-efgh-ijkl');
    
    await expect(input).toHaveValue('ABCD-EFGH-IJKL');
  });
});

test.describe('Navigation', () => {
  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');
    
    await expect(page.getByText('Página no encontrada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();
  });

  test('should navigate back to home from 404', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.getByRole('link', { name: 'Ir al inicio' }).click();
    
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Cuentas Claras')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // All elements should be visible and usable
    await expect(page.getByText('Cuentas Claras')).toBeVisible();
    await expect(page.getByPlaceholder('XXXX-XXXX')).toBeVisible();
    await expect(page.getByPlaceholder('Ej: Paseo a Melgar')).toBeVisible();
  });
});
