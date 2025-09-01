// customer-list.test.js - Tests for customer list functionality
const { test, expect } = require('@playwright/test');
const FrontendHelpers = require('./utils/frontend-helpers');

test.describe('Customer List Page', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new FrontendHelpers(page);
    
    // Clear any existing routes and set up fresh mocking
    await helpers.clearAllRoutes();
    
    // Mock initial customer data
    await helpers.mockApiResponse('/customers', [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ]);
    
    await helpers.navigateToHome();
  });

  test('should display customer list', async ({ page }) => {
    await expect(page.locator('.customer-list')).toBeVisible();
    
    const customerCount = await helpers.getCustomerCount();
    expect(customerCount).toBe(2);
  });

  test('should display customer information correctly', async ({ page }) => {
    const firstCustomer = await helpers.getCustomerByIndex(0);
    expect(firstCustomer.name).toBe('John Doe');
    expect(firstCustomer.email).toBe('john@example.com');
  });

  test('should show empty state when no customers', async ({ page }) => {
    await helpers.clearAllRoutes();
    await helpers.mockApiResponse('/customers', []);
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('p:has-text("Não foram encontrados clientes")')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await helpers.clearAllRoutes();
    await helpers.mockApiError('/customers', 500);
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // React app shows error text when API fails
    await expect(page.locator('.error')).toBeVisible();
  });

  test('should allow navigation to add customer form', async ({ page }) => {
    await page.click('button:has-text("Adicionar novo cliente")');
    await expect(page.locator('.customer-form')).toBeVisible();
  });
});