// update-customer.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('PUT /customers/:id - Update Customer', () => {
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

  test('should update customer with valid data', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Update data
    const updateData = {
      name: 'Updated Test Customer',
      email: 'updated.test@example.com'
    };
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    
    const updatedCustomer = await response.json();
    expect(updatedCustomer.id).toBe(customer.id);
    expect(updatedCustomer.name).toBe(updateData.name);
    expect(updatedCustomer.email).toBe(updateData.email);
    
    TestHelpers.validateCustomerStructure(updatedCustomer, updateData);
  });

  test('should return 404 for non-existent customer ID', async () => {
    const nonExistentId = '99999999-9999-9999-9999-999999999999';
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };
    
    const response = await request.put(`/customers/${nonExistentId}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(404);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject update with missing name', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const invalidData = TestHelpers.getInvalidCustomerData().missingName;
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject update with missing email', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const invalidData = TestHelpers.getInvalidCustomerData().missingEmail;
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject update with empty name', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const invalidData = TestHelpers.getInvalidCustomerData().emptyName;
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject update with empty email', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const invalidData = TestHelpers.getInvalidCustomerData().emptyEmail;
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should reject update with invalid email format', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const invalidData = TestHelpers.getInvalidCustomerData().invalidEmail;
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should handle special characters in updated data', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const updateData = {
      name: 'José María & François O\'Brien',
      email: 'jose.francois+test@example.com'
    };
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    
    const updatedCustomer = await response.json();
    expect(updatedCustomer.name).toBe(updateData.name);
    expect(updatedCustomer.email).toBe(updateData.email);
  });

  test('should preserve customer ID after update', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const originalId = customer.id;
    
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    
    const updatedCustomer = await response.json();
    expect(updatedCustomer.id).toBe(originalId);
  });

  test('should verify update persistence', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const updateData = {
      name: 'Persistently Updated Name',
      email: 'persistent.update@example.com'
    };
    
    // Update the customer
    const updateResponse = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(updateResponse.status()).toBe(200);
    
    // Fetch the customer to verify the update persisted
    const getResponse = await request.get(`/customers/${customer.id}`);
    
    expect(getResponse.status()).toBe(200);
    
    const fetchedCustomer = await getResponse.json();
    expect(fetchedCustomer.name).toBe(updateData.name);
    expect(fetchedCustomer.email).toBe(updateData.email);
  });

  test('should handle concurrent updates to different customers', async () => {
    // Create multiple test customers
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const customer = await TestHelpers.createCustomer(request);
      customers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // Update all customers concurrently
    const updatePromises = customers.map((customer, index) =>
      request.put(`/customers/${customer.id}`, {
        data: {
          name: `Concurrent Update ${index}`,
          email: `concurrent.${index}@example.com`
        }
      })
    );
    
    const responses = await Promise.all(updatePromises);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
    
    // Verify all updates
    for (let i = 0; i < customers.length; i++) {
      const updatedCustomer = await responses[i].json();
      expect(updatedCustomer.name).toBe(`Concurrent Update ${i}`);
      expect(updatedCustomer.email).toBe(`concurrent.${i}@example.com`);
    }
  });

  test('should reject malformed JSON in update', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: 'invalid json string'
    });
    
    expect(response.status()).toBe(400);
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should handle invalid UUID format in path', async () => {
    const invalidId = 'invalid-uuid-format';
    const updateData = {
      name: 'Test Name',
      email: 'test@example.com'
    };
    
    const response = await request.put(`/customers/${invalidId}`, {
      data: updateData
    });
    
    // Should return 404 or 400 depending on implementation
    expect([400, 404]).toContain(response.status());
    
    const errorResponse = await response.json();
    TestHelpers.validateErrorResponse(errorResponse);
  });

  test('should include correct CORS headers', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    const updateData = {
      name: 'CORS Test',
      email: 'cors.test@example.com'
    };
    
    const response = await request.put(`/customers/${customer.id}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    
    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('PUT');
  });

  test('should handle multiple updates to same customer', async () => {
    // Create a test customer
    const customer = await TestHelpers.createCustomer(request);
    createdCustomerIds.push(customer.id);
    
    // Perform multiple sequential updates
    const updates = [
      { name: 'First Update', email: 'first@example.com' },
      { name: 'Second Update', email: 'second@example.com' },
      { name: 'Third Update', email: 'third@example.com' }
    ];
    
    for (const updateData of updates) {
      const response = await request.put(`/customers/${customer.id}`, {
        data: updateData
      });
      
      expect(response.status()).toBe(200);
      
      const updatedCustomer = await response.json();
      expect(updatedCustomer.name).toBe(updateData.name);
      expect(updatedCustomer.email).toBe(updateData.email);
    }
    
    // Verify final state
    const finalResponse = await request.get(`/customers/${customer.id}`);
    const finalCustomer = await finalResponse.json();
    expect(finalCustomer.name).toBe('Third Update');
    expect(finalCustomer.email).toBe('third@example.com');
  });
});