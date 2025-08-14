// delete-customer.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('DELETE /customers/:id - Delete Customer', () => {
  let request;
  let createdCustomerIds = [];

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: TestHelpers.getApiBaseUrl()
    });
  });

  test.afterAll(async () => {
    // Clean up any remaining customers (though they should be deleted by tests)
    for (const customerId of createdCustomerIds) {
      try {
        await request.delete(`/customers/${customerId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await request.dispose();
  });

  test('should delete customer with valid ID', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.delete(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('message');
    expect(result.message).toBe('Customer deleted successfully');
    
    // Remove from cleanup list since it's already deleted
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should return 404 for non-existent customer ID', async () => {
    const nonExistentId = '99999999-9999-9999-9999-999999999999';
    
    const response = await request.delete(`/customers/${nonExistentId}`);
    
    expect(response.status()).toBe(404);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should verify customer is actually deleted', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Verify customer exists
    const getResponse1 = await request.get(`/customers/${customer.id}`);
    expect(getResponse1.status()).toBe(200);
    
    // Delete the customer
    const deleteResponse = await request.delete(`/customers/${customer.id}`);
    expect(deleteResponse.status()).toBe(200);
    
    // Verify customer no longer exists
    const getResponse2 = await request.get(`/customers/${customer.id}`);
    expect(getResponse2.status()).toBe(404);
    
    // Remove from cleanup list since it's already deleted
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should handle deletion of customer with special characters', async () => {
    // Create customer with special characters
    const customerData = {
      name: 'José María & François',
      email: 'special.chars@example.com'
    };
    
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    const response = await request.delete(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.message).toBe('Customer deleted successfully');
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should not allow deletion of already deleted customer', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Delete the customer
    const firstDeleteResponse = await request.delete(`/customers/${customer.id}`);
    expect(firstDeleteResponse.status()).toBe(200);
    
    // Try to delete again
    const secondDeleteResponse = await request.delete(`/customers/${customer.id}`);
    expect(secondDeleteResponse.status()).toBe(404);
    
    const errorResponse = await secondDeleteResponse.json();
    TestHelpers.validateErrorResponse(errorResponse);
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should handle invalid UUID format', async () => {
    const invalidId = 'invalid-uuid-format';
    
    const response = await request.delete(`/customers/${invalidId}`);
    
    // Should return 404 or 400 depending on implementation
    expect([400, 404]).toContain(response.status());
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should handle concurrent deletions of different customers', async () => {
    // Create multiple test customers
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const customer = await TestHelpers.createCustomer(request);
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Delete all customers concurrently
    const deletePromises = customers.map(customer =>
      request.delete(`/customers/${customer.id}`)
    );
    
    const responses = await Promise.all(deletePromises);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.message).toBe('Customer deleted successfully');
    }
    
    // Clear cleanup list since all are deleted
    createdCustomerIds = createdCustomerIds.filter(id => 
      !customers.some(customer => customer.id === id)
    );
  });

  test('should verify deletion removes customer from list', async () => {
    // Create multiple test customers
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const customer = await TestHelpers.createCustomer(request);
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Get initial list
    const initialResponse = await request.get('/customers');
    const initialCustomers = await initialResponse.json();
    const initialIds = initialCustomers.map(c => c.id);
    
    // Verify all our customers are in the list
    for (const customer of customers) {
      expect(initialIds).toContain(customer.id);
    }
    
    // Delete one customer
    const deleteResponse = await request.delete(`/customers/${customers[0].id}`);
    expect(deleteResponse.status()).toBe(200);
    
    // Get updated list
    const updatedResponse = await request.get('/customers');
    const updatedCustomers = await updatedResponse.json();
    const updatedIds = updatedCustomers.map(c => c.id);
    
    // Verify deleted customer is no longer in the list
    expect(updatedIds).not.toContain(customers[0].id);
    
    // Verify other customers are still in the list
    expect(updatedIds).toContain(customers[1].id);
    expect(updatedIds).toContain(customers[2].id);
    
    // Clean up remaining customers
    await request.delete(`/customers/${customers[1].id}`);
    await request.delete(`/customers/${customers[2].id}`);
    
    // Clear cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => 
      !customers.some(customer => customer.id === id)
    );
  });

  test('should include correct CORS headers', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.delete(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('DELETE');
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should return JSON content type', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.delete(`/customers/${customer.id}`);
    
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });

  test('should handle empty string as customer ID', async () => {
    const response = await request.delete('/customers/');
    
    // Should return 404 as the route doesn't match
    expect(response.status()).toBe(404);
  });

  test('should handle very long invalid ID', async () => {
    const veryLongId = 'a'.repeat(1000);
    
    const response = await request.delete(`/customers/${veryLongId}`);
    
    // Should return 404 or 400
    expect([400, 404]).toContain(response.status());
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should handle deletion workflow', async () => {
    // Create -> Read -> Update -> Read -> Delete -> Verify deletion
    
    // Create
    const customerData = TestHelpers.generateRandomCustomer();
    const customer = await TestHelpers.createCustomer(request, customerData);
    createdCustomerIds.push(customer.id);
    
    // Read
    const getResponse1 = await request.get(`/customers/${customer.id}`);
    expect(getResponse1.status()).toBe(200);
    
    // Update
    const updateData = { name: 'Updated Name', email: 'updated@example.com' };
    const updateResponse = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    expect(updateResponse.status()).toBe(200);
    
    // Read again
    const getResponse2 = await request.get(`/customers/${customer.id}`);
    expect(getResponse2.status()).toBe(200);
    const updatedCustomer = await getResponse2.json();
    expect(updatedCustomer.name).toBe(updateData.name);
    
    // Delete
    const deleteResponse = await request.delete(`/customers/${customer.id}`);
    expect(deleteResponse.status()).toBe(200);
    
    // Verify deletion
    const getResponse3 = await request.get(`/customers/${customer.id}`);
    expect(getResponse3.status()).toBe(404);
    
    // Remove from cleanup list
    createdCustomerIds = createdCustomerIds.filter(id => id !== customer.id);
  });
});