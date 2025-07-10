// get-customer-by-id.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('GET /customers/:id - Get Customer by ID', () => {
  let request;
  let createdCustomerIds = [];

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:8080'
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

  test('should return customer by valid ID', async () => {
    // Create a test customer
    const customerData = TestHelpers.generateRandomCustomer();
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const retrievedCustomer = await response.json();
    TestHelpers.validateCustomerStructure(retrievedCustomer, customerData);
    expect(retrievedCustomer.id).toBe(customer.id);
  });

  test('should return 404 for non-existent customer ID', async () => {
    const nonExistentId = '99999999-9999-9999-9999-999999999999';
    
    const response = await request.get(`/customers/${nonExistentId}`);
    
    expect(response.status()).toBe(404);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should return 404 for invalid UUID format', async () => {
    const invalidId = 'invalid-uuid-format';
    
    const response = await request.get(`/customers/${invalidId}`);
    
    // Should return 404 or 400 depending on implementation
    expect([400, 404]).toContain(response.status());
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should return customer with special characters', async () => {
    // Create customer with special characters
    const customerData = {
      name: 'José María O\'Brien-Smith',
      email: 'jose.maria+test@example.com'
    };
    
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const retrievedCustomer = await response.json();
    expect(retrievedCustomer.name).toBe(customerData.name);
    expect(retrievedCustomer.email).toBe(customerData.email);
  });

  test('should handle concurrent requests for same customer', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Make multiple concurrent requests for the same customer
    const concurrentRequests = 5;
    const promises = Array.from({ length: concurrentRequests }, () =>
      request.get(`/customers/${customer.id}`)
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // All should return the same customer data
    for (const response of responses) {
      const retrievedCustomer = await response.json();
      expect(retrievedCustomer.id).toBe(customer.id);
      expect(retrievedCustomer.name).toBe(customer.name);
      expect(retrievedCustomer.email).toBe(customer.email);
    }
  });

  test('should handle requests for different customer IDs', async () => {
    // Create multiple test customers
    const customers = [];
    const customerCount = 3;
    
    for (let i = 0; i < customerCount; i++) {
      const customer = await TestHelpers.createCustomer(request);
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Request each customer by ID
    for (const customer of customers) {
      const response = await request.get(`/customers/${customer.id}`);
      
      expect(response.status()).toBe(200);
      
      const retrievedCustomer = await response.json();
      expect(retrievedCustomer.id).toBe(customer.id);
      expect(retrievedCustomer.name).toBe(customer.name);
      expect(retrievedCustomer.email).toBe(customer.email);
    }
  });

  test('should return consistent data across multiple requests', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Make multiple requests for the same customer
    const responses = await Promise.all([
      request.get(`/customers/${customer.id}`),
      request.get(`/customers/${customer.id}`),
      request.get(`/customers/${customer.id}`)
    ]);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // Parse responses
    const retrievedCustomers = await Promise.all(
      responses.map(response => response.json())
    );
    
    // All should return identical data
    for (const retrievedCustomer of retrievedCustomers) {
      expect(retrievedCustomer.id).toBe(customer.id);
      expect(retrievedCustomer.name).toBe(customer.name);
      expect(retrievedCustomer.email).toBe(customer.email);
    }
  });

  test('should include correct CORS headers', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
  });

  test('should return JSON content type', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should handle very long invalid ID', async () => {
    const veryLongId = 'a'.repeat(1000);
    
    const response = await request.get(`/customers/${veryLongId}`);
    
    // Should return 404 or 400
    expect([400, 404]).toContain(response.status());
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should verify customer data immediately after creation', async () => {
    // Create a customer and immediately fetch it
    const customerData = TestHelpers.generateRandomCustomer();
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    // Immediately fetch the customer
    const response = await request.get(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const retrievedCustomer = await response.json();
    expect(retrievedCustomer).toEqual(customer);
  });
});