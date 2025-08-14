// create-customer.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('POST /customers - Create Customer', () => {
  let request;
  let createdCustomerIds = [];

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: TestHelpers.getApiBaseUrl()
    });
  });

  test.afterAll(async () => {
    // Clean up created customers
    for (const customerId of createdCustomerIds) {
      try {
        await request.delete(`/customers/${customerId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await request.dispose();
  });

  test('should create a customer with valid data', async () => {
    const customerData = TestHelpers.generateRandomCustomer();
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    TestHelpers.validateCustomerStructure(customer, customerData);
  });

  test('should generate UUID for new customer', async () => {
    const customerData = TestHelpers.generateRandomCustomer();
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    // Validate UUID format (basic check)
    expect(customer.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('should reject request with missing name', async () => {
    const invalidData = TestHelpers.getInvalidCustomerData().missingName;
    
    const response = await request.post('/customers', {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject request with missing email', async () => {
    const invalidData = TestHelpers.getInvalidCustomerData().missingEmail;
    
    const response = await request.post('/customers', {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject request with empty name', async () => {
    const invalidData = TestHelpers.getInvalidCustomerData().emptyName;
    
    const response = await request.post('/customers', {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject request with empty email', async () => {
    const invalidData = TestHelpers.getInvalidCustomerData().emptyEmail;
    
    const response = await request.post('/customers', {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject request with invalid email format', async () => {
    const invalidData = TestHelpers.getInvalidCustomerData().invalidEmail;
    
    const response = await request.post('/customers', {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject request with malformed JSON', async () => {
    const response = await request.post('/customers', {
      data: 'invalid json string'
    });

    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should handle special characters in name', async () => {
    const customerData = {
      name: 'José María O\'Brien-Smith',
      email: 'jose.maria@example.com'
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.name).toBe(customerData.name);
    expect(customer.email).toBe(customerData.email);
  });

  test('should handle long customer name', async () => {
    const customerData = {
      name: 'A'.repeat(100), // Very long name
      email: 'long.name@example.com'
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.name).toBe(customerData.name);
    expect(customer.email).toBe(customerData.email);
  });

  test('should handle email with plus addressing', async () => {
    const customerData = {
      name: 'Test Customer',
      email: 'test+tag@example.com'
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.name).toBe(customerData.name);
    expect(customer.email).toBe(customerData.email);
  });

  test('should handle concurrent customer creation', async () => {
    const customers = TestHelpers.generateRandomCustomers(3);
    
    // Create customers concurrently
    const promises = customers.map(customerData =>
      request.post('/customers', { data: customerData })
    );
    
    const responses = await Promise.all(promises);
    
    // Verify all succeeded
    for (const response of responses) {
      expect(response.status()).toBe(201);
      const customer = await response.json();
      createdCustomerIds.push(customer.id);
      TestHelpers.validateCustomerStructure(customer);
    }
    
    // Verify all have unique IDs
    const ids = [];
    for (const response of responses) {
      const customer = await response.json();
      expect(ids).not.toContain(customer.id);
      ids.push(customer.id);
    }
  });
});