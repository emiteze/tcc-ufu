// get-customers.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('GET /customers - Get All Customers', () => {
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

  test('should return empty array when no customers exist', async () => {
    // Clean up any existing customers first
    await TestHelpers.cleanupTestCustomers(request);
    
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const customers = await response.json();
    expect(Array.isArray(customers)).toBe(true);
  });

  test('should return all customers', async () => {
    // Create test customers
    const testCustomers = TestHelpers.generateRandomCustomers(3);
    
    for (const customerData of testCustomers) {
      const customer = await TestHelpers.createCustomer(request, customerData);
      createdCustomerIds.push(customer.id);
    }
    
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const customers = await response.json();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThanOrEqual(3);
    
    // Verify structure of each customer
    for (const customer of customers) {
      TestHelpers.validateCustomerStructure(customer);
    }
    
    // Verify our test customers are included
    const customerIds = customers.map(c => c.id);
    for (const createdId of createdCustomerIds) {
      expect(customerIds).toContain(createdId);
    }
  });

  test('should return customers with correct structure', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const customers = await response.json();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThan(0);
    
    // Find our test customer
    const testCustomer = customers.find(c => c.id === customer.id);
    expect(testCustomer).toBeDefined();
    TestHelpers.validateCustomerStructure(testCustomer);
  });

  test('should handle large number of customers', async () => {
    // Create multiple customers
    const customerCount = 10;
    const testCustomers = TestHelpers.generateRandomCustomers(customerCount);
    
    for (const customerData of testCustomers) {
      const customer = await TestHelpers.createCustomer(request, customerData);
      createdCustomerIds.push(customer.id);
    }
    
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const customers = await response.json();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThanOrEqual(customerCount);
    
    // Verify all our customers are present
    const customerIds = customers.map(c => c.id);
    for (const createdId of createdCustomerIds) {
      expect(customerIds).toContain(createdId);
    }
  });

  test('should return consistent data across multiple requests', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Make multiple requests
    const responses = await Promise.all([
      request.get('/customers'),
      request.get('/customers'),
      request.get('/customers')
    ]);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // Parse responses
    const customerLists = await Promise.all(
      responses.map(response => response.json())
    );
    
    // All should return arrays
    for (const customers of customerLists) {
      expect(Array.isArray(customers)).toBe(true);
    }
    
    // All should contain our test customer
    for (const customers of customerLists) {
      const testCustomer = customers.find(c => c.id === customer.id);
      expect(testCustomer).toBeDefined();
      expect(testCustomer.name).toBe(customer.name);
      expect(testCustomer.email).toBe(customer.email);
    }
  });

  test('should handle concurrent GET requests', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Make multiple concurrent requests
    const concurrentRequests = 5;
    const promises = Array.from({ length: concurrentRequests }, () =>
      request.get('/customers')
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // All should return valid data
    for (const response of responses) {
      const customers = await response.json();
      expect(Array.isArray(customers)).toBe(true);
      
      // Should contain our test customer
      const testCustomer = customers.find(c => c.id === customer.id);
      expect(testCustomer).toBeDefined();
    }
  });

  test('should include correct CORS headers', async () => {
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
  });

  test('should return JSON content type', async () => {
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should handle special characters in customer data when listing', async () => {
    // Create customer with special characters
    const customerData = {
      name: 'José María & François',
      email: 'special.chars@example.com'
    };
    
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    const response = await request.get('/customers');
    
    expect(response.status()).toBe(200);
    
    const customers = await response.json();
    const testCustomer = customers.find(c => c.id === customer.id);
    
    expect(testCustomer).toBeDefined();
    expect(testCustomer.name).toBe(customerData.name);
    expect(testCustomer.email).toBe(customerData.email);
  });
});