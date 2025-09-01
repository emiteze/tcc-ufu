// frontend-helpers.js - Helper utilities for frontend tests
class FrontendHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation helpers
  async navigateToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCustomers() {
    await this.page.goto('/customers');
    await this.page.waitForLoadState('networkidle');
  }

  // Clear all routes and start fresh
  async clearAllRoutes() {
    await this.page.unrouteAll();
  }

  // Mock all API routes upfront to avoid real API calls
  async setupBasicMocking() {
    // Mock customers endpoint by default
    await this.page.route('**/customers', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.continue();
      }
    });
  }

  // Form helpers
  async fillCustomerForm(customerData) {
    if (customerData.name !== undefined) {
      await this.page.fill('input[name="name"]', customerData.name);
    }
    if (customerData.email !== undefined) {
      await this.page.fill('input[name="email"]', customerData.email);
    }
    if (customerData.telephone !== undefined) {
      await this.page.fill('input[name="telephone"]', customerData.telephone);
    }
  }

  async submitCustomerForm() {
    await this.page.click('button[type="submit"]');
  }

  // Wait helpers
  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text, timeout = 5000) {
    await this.page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      text,
      { timeout }
    );
  }

  // API mocking helpers
  async mockApiResponse(endpoint, response, method = 'GET') {
    await this.page.route(`**${endpoint}`, async (route) => {
      if (route.request().method() === method) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      } else {
        await route.continue();
      }
    });
  }

  async mockApiError(endpoint, statusCode = 500, method = 'GET') {
    await this.page.route(`**${endpoint}`, async (route) => {
      if (route.request().method() === method) {
        await route.fulfill({
          status: statusCode,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Mocked error' })
        });
      } else {
        await route.continue();
      }
    });
  }

  // Customer list helpers
  async getCustomerCount() {
    return await this.page.locator('.customer-table tbody tr').count();
  }

  async getCustomerByIndex(index) {
    const customerElement = this.page.locator('.customer-table tbody tr').nth(index);
    const name = await customerElement.locator('td').nth(1).textContent(); // Name is second column
    const email = await customerElement.locator('td').nth(2).textContent(); // Email is third column
    const telephone = await customerElement.locator('td').nth(3).textContent(); // Telephone is fourth column
    return {
      name: name?.trim(),
      email: email?.trim(),
      telephone: telephone?.trim()
    };
  }

  async clickEditCustomer(index) {
    await this.page.locator('.customer-table tbody tr').nth(index)
      .locator('.btn.btn-edit').click();
  }

  async clickDeleteCustomer(index) {
    await this.page.locator('.customer-table tbody tr').nth(index)
      .locator('.btn.btn-delete').click();
  }

  // Form validation helpers
  async getFormErrors() {
    // React app doesn't have client-side validation errors displayed
    // This would need to be implemented in the React app first
    const errorElements = await this.page.locator('.error, .validation-error').all();
    const errors = [];
    for (const element of errorElements) {
      errors.push(await element.textContent());
    }
    return errors;
  }

  // Screenshot helper
  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }
}

module.exports = FrontendHelpers;