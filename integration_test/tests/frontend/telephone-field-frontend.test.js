// telephone-field-frontend.test.js - Frontend integration tests for telephone field
const { test, expect } = require('@playwright/test');
const FrontendHelpers = require('./utils/frontend-helpers');

test.describe('Frontend Telephone Field Integration', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new FrontendHelpers(page);
    await helpers.clearAllRoutes();
  });

  test.describe('Customer Form with Telephone', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.mockApiResponse('/customers', []);
      await helpers.navigateToHome();
      await page.click('button:has-text("Adicionar novo cliente")');
    });

    test('should display telephone input field', async ({ page }) => {
      await expect(page.locator('.customer-form')).toBeVisible();
      await expect(page.locator('input[name="telephone"]')).toBeVisible();
      await expect(page.locator('label[for="telephone"]')).toContainText('Telefone');
    });

    test('should create customer with telephone field', async ({ page }) => {
      const newCustomer = { 
        id: '1', 
        name: 'João Silva', 
        email: 'joao@example.com',
        telephone: '+55-11-99999-9999'
      };
      
      // Mock successful creation
      await helpers.mockApiResponse('/customers', newCustomer, 'POST');
      await helpers.mockApiResponse('/customers', [newCustomer]);
      
      await helpers.fillCustomerForm({ 
        name: 'João Silva', 
        email: 'joao@example.com',
        telephone: '+55-11-99999-9999'
      });
      
      await helpers.submitCustomerForm();
      
      // Should redirect to customer list
      await helpers.waitForElement('.customer-list');
    });

    test('should create customer without telephone field (optional)', async ({ page }) => {
      const newCustomer = { 
        id: '2', 
        name: 'Maria Santos', 
        email: 'maria@example.com',
        telephone: ''
      };
      
      // Mock successful creation
      await helpers.mockApiResponse('/customers', newCustomer, 'POST');
      await helpers.mockApiResponse('/customers', [newCustomer]);
      
      await helpers.fillCustomerForm({ 
        name: 'Maria Santos', 
        email: 'maria@example.com'
        // No telephone field
      });
      
      await helpers.submitCustomerForm();
      
      // Should redirect to customer list
      await helpers.waitForElement('.customer-list');
    });

    test('should accept various telephone formats', async ({ page }) => {
      const telephoneFormats = [
        '+55-11-99999-9999',
        '(11) 99999-9999',
        '11 99999-9999',
        '11999999999',
        '+1-555-123-4567',
        '555.123.4567'
      ];

      for (let i = 0; i < telephoneFormats.length; i++) {
        const customer = {
          id: `test-${i}`,
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          telephone: telephoneFormats[i]
        };

        // Mock API response
        await helpers.mockApiResponse('/customers', customer, 'POST');
        
        await helpers.fillCustomerForm({
          name: customer.name,
          email: customer.email,
          telephone: customer.telephone
        });

        // Verify the input accepts the value
        const telephoneInput = page.locator('input[name="telephone"]');
        await expect(telephoneInput).toHaveValue(telephoneFormats[i]);

        // Clear form for next iteration
        await telephoneInput.clear();
        await page.locator('input[name="name"]').clear();
        await page.locator('input[name="email"]').clear();
      }
    });
  });

  test.describe('Customer List with Telephone', () => {
    test('should display telephone column in customer list', async ({ page }) => {
      const customers = [
        { id: '1', name: 'João Silva', email: 'joao@example.com', telephone: '+55-11-99999-9999' },
        { id: '2', name: 'Maria Santos', email: 'maria@example.com', telephone: '11 88888-8888' },
        { id: '3', name: 'Pedro Costa', email: 'pedro@example.com', telephone: '' }
      ];
      
      await helpers.mockApiResponse('/customers', customers);
      await helpers.navigateToHome();
      
      // Wait for customer list to load
      await helpers.waitForElement('.customer-list');
      
      // Check telephone column header
      await expect(page.locator('.customer-table th')).toContainText(['ID', 'Nome', 'Email', 'Telefone', 'Ações']);
      
      // Verify customers are displayed with telephone
      const customerCount = await helpers.getCustomerCount();
      expect(customerCount).toBe(3);
      
      // Check first customer with telephone
      const firstCustomer = await helpers.getCustomerByIndex(0);
      expect(firstCustomer.telephone).toBe('+55-11-99999-9999');
      
      // Check second customer with different format
      const secondCustomer = await helpers.getCustomerByIndex(1);
      expect(secondCustomer.telephone).toBe('11 88888-8888');
      
      // Check third customer with empty telephone (should show '-')
      const thirdCustomer = await helpers.getCustomerByIndex(2);
      expect(thirdCustomer.telephone).toBe('-');
    });
  });

  test.describe('Edit Customer with Telephone', () => {
    test('should populate edit form with existing telephone', async ({ page }) => {
      const customers = [
        { id: '1', name: 'João Silva', email: 'joao@example.com', telephone: '+55-11-99999-9999' }
      ];
      
      await helpers.mockApiResponse('/customers', customers);
      await helpers.navigateToHome();
      
      // Wait for customer list and click edit
      await helpers.waitForElement('.customer-list');
      await helpers.clickEditCustomer(0);
      
      // Verify form is populated with existing data including telephone
      await expect(page.locator('input[name="name"]')).toHaveValue('João Silva');
      await expect(page.locator('input[name="email"]')).toHaveValue('joao@example.com');
      await expect(page.locator('input[name="telephone"]')).toHaveValue('+55-11-99999-9999');
      await expect(page.locator('.customer-form h2')).toContainText('Editar cliente');
    });

    test('should update customer telephone field', async ({ page }) => {
      const existingCustomer = { 
        id: '1', 
        name: 'João Silva', 
        email: 'joao@example.com', 
        telephone: '+55-11-99999-9999' 
      };
      
      const updatedCustomer = { 
        ...existingCustomer, 
        telephone: '+55-11-88888-8888' 
      };
      
      await helpers.mockApiResponse('/customers', [existingCustomer]);
      await helpers.navigateToHome();
      
      // Wait for customer list and click edit
      await helpers.waitForElement('.customer-list');
      await helpers.clickEditCustomer(0);
      
      // Mock update API call
      await helpers.mockApiResponse('/customers/1', updatedCustomer, 'PUT');
      await helpers.mockApiResponse('/customers', [updatedCustomer]);
      
      // Update telephone field
      await page.locator('input[name="telephone"]').clear();
      await page.locator('input[name="telephone"]').fill('+55-11-88888-8888');
      
      await helpers.submitCustomerForm();
      
      // Should redirect to customer list
      await helpers.waitForElement('.customer-list');
    });

    test('should clear telephone field on update', async ({ page }) => {
      const existingCustomer = { 
        id: '1', 
        name: 'João Silva', 
        email: 'joao@example.com', 
        telephone: '+55-11-99999-9999' 
      };
      
      const updatedCustomer = { 
        ...existingCustomer, 
        telephone: '' 
      };
      
      await helpers.mockApiResponse('/customers', [existingCustomer]);
      await helpers.navigateToHome();
      
      // Wait for customer list and click edit
      await helpers.waitForElement('.customer-list');
      await helpers.clickEditCustomer(0);
      
      // Mock update API call
      await helpers.mockApiResponse('/customers/1', updatedCustomer, 'PUT');
      await helpers.mockApiResponse('/customers', [updatedCustomer]);
      
      // Clear telephone field
      await page.locator('input[name="telephone"]').clear();
      
      await helpers.submitCustomerForm();
      
      // Should redirect to customer list
      await helpers.waitForElement('.customer-list');
    });
  });

  test.describe('Form Accessibility and UX', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.mockApiResponse('/customers', []);
      await helpers.navigateToHome();
      await page.click('button:has-text("Adicionar novo cliente")');
    });

    test('telephone field should have proper attributes', async ({ page }) => {
      const telephoneInput = page.locator('input[name="telephone"]');
      
      // Check input type
      await expect(telephoneInput).toHaveAttribute('type', 'tel');
      
      // Check that it's not required (optional field)
      const isRequired = await telephoneInput.getAttribute('required');
      expect(isRequired).toBeNull();
      
      // Check label association
      await expect(page.locator('label[for="telephone"]')).toBeVisible();
    });

    test('should handle long telephone numbers gracefully', async ({ page }) => {
      const longTelephone = '123456789012345678901234567890';
      
      await helpers.fillCustomerForm({
        name: 'Test User',
        email: 'test@example.com',
        telephone: longTelephone
      });
      
      // Verify the input accepts long numbers
      const telephoneInput = page.locator('input[name="telephone"]');
      await expect(telephoneInput).toHaveValue(longTelephone);
    });

    test('should handle special characters in telephone', async ({ page }) => {
      const specialTelephone = '+1 (555) 123-4567 ext. 890';
      
      await helpers.fillCustomerForm({
        name: 'Test User',
        email: 'test@example.com',
        telephone: specialTelephone
      });
      
      // Verify the input accepts special characters
      const telephoneInput = page.locator('input[name="telephone"]');
      await expect(telephoneInput).toHaveValue(specialTelephone);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully during customer creation with telephone', async ({ page }) => {
      await helpers.mockApiResponse('/customers', []);
      await helpers.navigateToHome();
      await page.click('button:has-text("Adicionar novo cliente")');
      
      // Mock API error
      await helpers.mockApiError('/customers', 500, 'POST');
      
      await helpers.fillCustomerForm({
        name: 'Test User',
        email: 'test@example.com',
        telephone: '+55-11-99999-9999'
      });
      
      await helpers.submitCustomerForm();
      
      // Should show error message
      await expect(page.locator('.error')).toBeVisible();
    });
  });
});