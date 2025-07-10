// api-e2e.test.js - End-to-end API workflow tests
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('API End-to-End Workflows', () => {
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

  test('complete customer lifecycle', async () => {
    // 1. Create a customer
    const customerData = TestHelpers.generateRandomCustomer();
    const createResponse = await request.post('/customers', {
      data: customerData
    });
    
    expect(createResponse.status()).toBe(201);
    const customer = await createResponse.json();
    createdCustomerIds.push(customer.id);
    
    TestHelpers.validateCustomerStructure(customer, customerData);
    
    // 2. Retrieve the customer by ID
    const getResponse = await request.get(`/customers/${customer.id}`);
    expect(getResponse.status()).toBe(200);
    
    const retrievedCustomer = await getResponse.json();
    expect(retrievedCustomer).toEqual(customer);
    
    // 3. Update the customer
    const updateData = {
      name: 'Updated Customer Name',
      email: 'updated.email@example.com'
    };
    
    const updateResponse = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(updateResponse.status()).toBe(200);
    const updatedCustomer = await updateResponse.json();
    
    expect(updatedCustomer.id).toBe(customer.id);
    expect(updatedCustomer.name).toBe(updateData.name);
    expect(updatedCustomer.email).toBe(updateData.email);
    
    // 4. Verify update in customer list
    const listResponse = await request.get('/customers');
    expect(listResponse.status()).toBe(200);
    
    const customers = await listResponse.json();
    const foundCustomer = customers.find(c => c.id === customer.id);
    expect(foundCustomer).toBeDefined();
    expect(foundCustomer.name).toBe(updateData.name);
    expect(foundCustomer.email).toBe(updateData.email);
    
    // 5. Delete the customer
    const deleteResponse = await request.delete(`/customers/${customer.id}`);
    expect(deleteResponse.status()).toBe(200);
    
    const deleteResult = await deleteResponse.json();
    expect(deleteResult.message).toBe('Customer deleted successfully');
    
    // 6. Verify customer is deleted
    const getDeletedResponse = await request.get(`/customers/${customer.id}`);
    expect(getDeletedResponse.status()).toBe(404);
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('multiple customers management', async () => {
    const customersData = TestHelpers.generateRandomCustomers(5);
    const customers = [];
    
    // Create multiple customers
    for (const customerData of customersData) {
      const response = await request.post('/customers', { data: customerData });
      expect(response.status()).toBe(201);
      
      const customer = await response.json();
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Verify all customers exist in the list
    const listResponse = await request.get('/customers');
    expect(listResponse.status()).toBe(200);
    
    const allCustomers = await listResponse.json();
    for (const customer of customers) {
      const foundCustomer = allCustomers.find(c => c.id === customer.id);
      expect(foundCustomer).toBeDefined();
    }
    
    // Update each customer
    for (let i = 0; i < customers.length; i++) {
      const updateData = {
        name: `Updated Customer ${i}`,
        email: `updated.${i}@example.com`
      };
      
      const updateResponse = await request.put(`/customers/${customers[i].id}`, {
        data: updateData
      });
      
      expect(updateResponse.status()).toBe(200);
    }
    
    // Delete customers one by one and verify list shrinks
    for (const customer of customers) {
      const deleteResponse = await request.delete(`/customers/${customer.id}`);
      expect(deleteResponse.status()).toBe(200);
      
      // Verify customer is gone
      const getResponse = await request.get(`/customers/${customer.id}`);
      expect(getResponse.status()).toBe(404);
    }
    
    // Clear cleanup list
    createdCustomerIds = [];
  });

  test('error handling workflow', async () => {
    // Try to get non-existent customer
    const nonExistentId = '99999999-9999-9999-9999-999999999999';
    
    const getResponse = await request.get(`/customers/${nonExistentId}`);
    expect(getResponse.status()).toBe(404);
    
    // Try to update non-existent customer
    const updateResponse = await request.put(`/customers/${nonExistentId}`, {
      data: { name: 'Test', email: 'test@example.com' }
    });
    expect(updateResponse.status()).toBe(404);
    
    // Try to delete non-existent customer
    const deleteResponse = await request.delete(`/customers/${nonExistentId}`);
    expect(deleteResponse.status()).toBe(404);
    
    // Try to create customer with invalid data
    const invalidCreateResponse = await request.post('/customers', {
      data: { name: '', email: 'invalid-email' }
    });
    expect(invalidCreateResponse.status()).toBe(400);
  });

  test('concurrent operations stress test', async () => {
    // Create customers concurrently
    const customerPromises = Array.from({ length: 10 }, () =>
      request.post('/customers', {
        data: TestHelpers.generateRandomCustomer()
      })
    );
    
    const createResponses = await Promise.all(customerPromises);
    const customers = [];
    
    for (const response of createResponses) {
      expect(response.status()).toBe(201);
      const customer = await response.json();
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Read all customers concurrently
    const readPromises = customers.map(customer =>
      request.get(`/customers/${customer.id}`)
    );
    
    const readResponses = await Promise.all(readPromises);
    for (const response of readResponses) {
      expect(response.status()).toBe(200);
    }
    
    // Update all customers concurrently
    const updatePromises = customers.map((customer, index) =>
      request.put(`/customers/${customer.id}`, {
        data: {
          name: `Stress Test Customer ${index}`,
          email: `stress.${index}@example.com`
        }
      })
    );
    
    const updateResponses = await Promise.all(updatePromises);
    for (const response of updateResponses) {
      expect(response.status()).toBe(200);
    }
    
    // Delete all customers concurrently
    const deletePromises = customers.map(customer =>
      request.delete(`/customers/${customer.id}`)
    );
    
    const deleteResponses = await Promise.all(deletePromises);
    for (const response of deleteResponses) {
      expect(response.status()).toBe(200);
    }
    
    // Clear cleanup list
    createdCustomerIds = [];
  });

  test('data persistence and consistency', async () => {
    // Create a customer
    const customerData = TestHelpers.generateRandomCustomer();
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    // Update multiple times with different data
    const updates = [
      { name: 'First Update', email: 'first@example.com' },
      { name: 'Second Update', email: 'second@example.com' },
      { name: 'Final Update', email: 'final@example.com' }
    ];
    
    for (const updateData of updates) {
      const updateResponse = await request.put(`/customers/${customer.id}`, {
        data: updateData
      });
      expect(updateResponse.status()).toBe(200);
      
      // Immediately verify the update
      const verifyResponse = await request.get(`/customers/${customer.id}`);
      expect(verifyResponse.status()).toBe(200);
      
      const verifiedCustomer = await verifyResponse.json();
      expect(verifiedCustomer.name).toBe(updateData.name);
      expect(verifiedCustomer.email).toBe(updateData.email);
    }
    
    // Verify final state in customer list
    const listResponse = await request.get('/customers');
    const customers = await listResponse.json();
    const finalCustomer = customers.find(c => c.id === customer.id);
    
    expect(finalCustomer.name).toBe('Final Update');
    expect(finalCustomer.email).toBe('final@example.com');
    
    // Clean up
    await request.delete(`/customers/${customer.id}`);
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('API health and availability', async () => {
    // Test basic connectivity
    const healthResponse = await request.get('/customers');
    expect(healthResponse.status()).toBe(200);
    
    // Test that CORS headers are present
    const headers = healthResponse.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    
    // Test response time (should be reasonable)
    const startTime = Date.now();
    const timeTestResponse = await request.get('/customers');
    const endTime = Date.now();
    
    expect(timeTestResponse.status()).toBe(200);
    expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
  });
});