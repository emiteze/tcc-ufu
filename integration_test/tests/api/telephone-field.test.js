// telephone-field.test.js
const { test, expect } = require('@playwright/test');
const TestHelpers = require('./utils/test-helpers');

test.describe('Customer Telephone Field - Integration Tests', () => {
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

  test('should create customer with telephone field', async () => {
    const customerData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      telephone: '+1-555-0123'
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.telephone).toBe(customerData.telephone);
    TestHelpers.validateCustomerStructure(customer, customerData);
  });

  test('should create customer without telephone field (optional)', async () => {
    const customerData = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
      // No telephone field
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.telephone).toBe(''); // Should default to empty string
    TestHelpers.validateCustomerStructure(customer);
  });

  test('should create customer with empty telephone field', async () => {
    const customerData = {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      telephone: ''
    };
    
    const response = await request.post('/customers', {
      data: customerData
    });

    expect(response.status()).toBe(201);
    
    const customer = await response.json();
    createdCustomerIds.push(customer.id);
    
    expect(customer.telephone).toBe('');
    TestHelpers.validateCustomerStructure(customer, customerData);
  });

  test('should accept various telephone formats', async () => {
    const telephoneFormats = [
      '+1-555-0123',
      '(555) 123-4567',
      '555.123.4567',
      '5551234567',
      '+34-91-555-0789',
      '123-456-7890 ext. 123',
      '1234567890123456789' // Very long number
    ];

    for (let i = 0; i < telephoneFormats.length; i++) {
      const customerData = {
        name: `Test Customer ${i + 1}`,
        email: `test${i + 1}@example.com`,
        telephone: telephoneFormats[i]
      };
      
      const response = await request.post('/customers', {
        data: customerData
      });

      expect(response.status()).toBe(201);
      
      const customer = await response.json();
      createdCustomerIds.push(customer.id);
      
      expect(customer.telephone).toBe(telephoneFormats[i]);
      TestHelpers.validateCustomerStructure(customer, customerData);
    }
  });

  test('should retrieve customer with telephone field', async () => {
    // Create a customer first
    const customerData = {
      name: 'Retrieve Test Customer',
      email: 'retrieve.test@example.com',
      telephone: '+1-555-9999'
    };
    
    const createResponse = await request.post('/customers', {
      data: customerData
    });
    
    const createdCustomer = await createResponse.json();
    createdCustomerIds.push(createdCustomer.id);
    
    // Now retrieve the customer
    const getResponse = await request.get(`/customers/${createdCustomer.id}`);
    expect(getResponse.status()).toBe(200);
    
    const retrievedCustomer = await getResponse.json();
    expect(retrievedCustomer.telephone).toBe(customerData.telephone);
    TestHelpers.validateCustomerStructure(retrievedCustomer, customerData);
  });

  test('should update customer telephone field', async () => {
    // Create a customer first
    const customerData = {
      name: 'Update Test Customer',
      email: 'update.test@example.com',
      telephone: '+1-555-1111'
    };
    
    const createResponse = await request.post('/customers', {
      data: customerData
    });
    
    const createdCustomer = await createResponse.json();
    createdCustomerIds.push(createdCustomer.id);
    
    // Update the telephone
    const updateData = {
      name: customerData.name,
      email: customerData.email,
      telephone: '+1-555-2222'
    };
    
    const updateResponse = await request.put(`/customers/${createdCustomer.id}`, {
      data: updateData
    });
    
    expect(updateResponse.status()).toBe(200);
    
    const updatedCustomer = await updateResponse.json();
    expect(updatedCustomer.telephone).toBe(updateData.telephone);
    TestHelpers.validateCustomerStructure(updatedCustomer, updateData);
  });

  test('should update customer to remove telephone (empty string)', async () => {
    // Create a customer with telephone
    const customerData = {
      name: 'Remove Telephone Test',
      email: 'remove.telephone.test@example.com',
      telephone: '+1-555-3333'
    };
    
    const createResponse = await request.post('/customers', {
      data: customerData
    });
    
    const createdCustomer = await createResponse.json();
    createdCustomerIds.push(createdCustomer.id);
    
    // Update to remove telephone
    const updateData = {
      name: customerData.name,
      email: customerData.email,
      telephone: ''
    };
    
    const updateResponse = await request.put(`/customers/${createdCustomer.id}`, {
      data: updateData
    });
    
    expect(updateResponse.status()).toBe(200);
    
    const updatedCustomer = await updateResponse.json();
    expect(updatedCustomer.telephone).toBe('');
    TestHelpers.validateCustomerStructure(updatedCustomer, updateData);
  });

  test('should list all customers with telephone fields', async () => {
    // Create multiple customers with different telephone formats
    const customers = [
      { name: 'List Test 1', email: 'list1@example.com', telephone: '+1-555-4444' },
      { name: 'List Test 2', email: 'list2@example.com', telephone: '555-5555' },
      { name: 'List Test 3', email: 'list3@example.com', telephone: '' }
    ];
    
    // Create customers
    const createdCustomers = [];
    for (const customerData of customers) {
      const response = await request.post('/customers', { data: customerData });
      expect(response.status()).toBe(201);
      const customer = await response.json();
      createdCustomers.push(customer);
      createdCustomerIds.push(customer.id);
    }
    
    // List all customers
    const listResponse = await request.get('/customers');
    expect(listResponse.status()).toBe(200);
    
    const allCustomers = await listResponse.json();
    
    // Verify our created customers are in the list with correct telephone fields
    for (const createdCustomer of createdCustomers) {
      const foundCustomer = allCustomers.find(c => c.id === createdCustomer.id);
      expect(foundCustomer).toBeDefined();
      expect(foundCustomer.telephone).toBe(createdCustomer.telephone);
      TestHelpers.validateCustomerStructure(foundCustomer);
    }
  });

  test('should handle special characters in telephone field', async () => {
    const specialTelephoneNumbers = [
      '+1-555-0123',
      '(555) 123-4567',
      '555.123.4567',
      '+33 1 23 45 67 89',
      '+49 (0) 123 456789',
      '123-456-7890 ext. 123',
      '555-CALL-NOW',
      '+1 (555) 123-4567 x890'
    ];

    for (let i = 0; i < specialTelephoneNumbers.length; i++) {
      const customerData = {
        name: `Special Chars Test ${i + 1}`,
        email: `special${i + 1}@example.com`,
        telephone: specialTelephoneNumbers[i]
      };
      
      const response = await request.post('/customers', {
        data: customerData
      });

      expect(response.status()).toBe(201);
      
      const customer = await response.json();
      createdCustomerIds.push(customer.id);
      
      expect(customer.telephone).toBe(specialTelephoneNumbers[i]);
      TestHelpers.validateCustomerStructure(customer, customerData);
    }
  });

  test('should handle concurrent operations with telephone field', async () => {
    const customersData = [
      { name: 'Concurrent Test 1', email: 'concurrent1@example.com', telephone: '+1-555-7777' },
      { name: 'Concurrent Test 2', email: 'concurrent2@example.com', telephone: '555-8888' },
      { name: 'Concurrent Test 3', email: 'concurrent3@example.com', telephone: '' }
    ];
    
    // Create customers concurrently
    const promises = customersData.map(customerData =>
      request.post('/customers', { data: customerData })
    );
    
    const responses = await Promise.all(promises);
    
    // Verify all succeeded and have correct telephone fields
    for (let i = 0; i < responses.length; i++) {
      expect(responses[i].status()).toBe(201);
      const customer = await responses[i].json();
      createdCustomerIds.push(customer.id);
      expect(customer.telephone).toBe(customersData[i].telephone);
      TestHelpers.validateCustomerStructure(customer, customersData[i]);
    }
  });
});