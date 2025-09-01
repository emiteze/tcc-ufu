// test-helpers.js
const { expect } = require('@playwright/test');

/**
 * Test data generators and utilities
 */
class TestHelpers {
  
  /**
   * Get the API base URL from environment or config
   */
  static getApiBaseUrl() {
    return process.env.API_BASE_URL || 'http://localhost:8080';
  }
  
  /**
   * Generate a random customer for testing
   */
  static generateRandomCustomer() {
    const timestamp = Date.now();
    return {
      name: `Test Customer ${timestamp}`,
      email: `test.customer.${timestamp}@example.com`,
      telephone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    };
  }

  /**
   * Generate multiple random customers
   */
  static generateRandomCustomers(count = 3) {
    return Array.from({ length: count }, () => this.generateRandomCustomer());
  }

  /**
   * Create a customer via API and return the created customer
   */
  static async createCustomer(request, customerData = null) {
    const customer = customerData || this.generateRandomCustomer();
    
    const response = await request.post('/customers', {
      data: customer
    });
    
    expect(response.status()).toBe(201);
    const createdCustomer = await response.json();
    expect(createdCustomer).toHaveProperty('id');
    expect(createdCustomer.name).toBe(customer.name);
    expect(createdCustomer.email).toBe(customer.email);
    if (customer.telephone !== undefined) {
      expect(createdCustomer.telephone).toBe(customer.telephone);
    }
    
    return createdCustomer;
  }

  /**
   * Delete a customer via API
   */
  static async deleteCustomer(request, customerId) {
    const response = await request.delete(`/customers/${customerId}`);
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('message');
    expect(result.message).toBe('Customer deleted successfully');
    
    return result;
  }

  /**
   * Verify customer structure
   */
  static validateCustomerStructure(customer, expectedData = null) {
    expect(customer).toHaveProperty('id');
    expect(customer).toHaveProperty('name');
    expect(customer).toHaveProperty('email');
    expect(customer).toHaveProperty('telephone');
    
    expect(typeof customer.id).toBe('string');
    expect(customer.id).toBeTruthy();
    
    expect(typeof customer.name).toBe('string');
    expect(customer.name).toBeTruthy();
    
    expect(typeof customer.email).toBe('string');
    expect(customer.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    
    expect(typeof customer.telephone).toBe('string');
    // Telephone field is optional, can be empty string
    
    if (expectedData) {
      expect(customer.name).toBe(expectedData.name);
      expect(customer.email).toBe(expectedData.email);
      if (expectedData.telephone !== undefined) {
        expect(customer.telephone).toBe(expectedData.telephone);
      }
    }
  }

  /**
   * Validate error response structure
   */
  static validateErrorResponse(errorResponse) {
    expect(errorResponse).toHaveProperty('error');
    expect(typeof errorResponse.error).toBe('string');
    expect(errorResponse.error).toBeTruthy();
  }

  /**
   * Clean up customers created during tests
   */
  static async cleanupTestCustomers(request) {
    try {
      const response = await request.get('/customers');
      if (response.ok()) {
        const customers = await response.json();
        
        for (const customer of customers) {
          if (customer.name && customer.name.includes('Test') || 
              customer.email && customer.email.includes('test')) {
            await request.delete(`/customers/${customer.id}`);
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup warning:', error.message);
    }
  }

  /**
   * Wait for a condition with timeout
   */
  static async waitFor(condition, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Generate invalid customer data for negative testing
   */
  static getInvalidCustomerData() {
    return {
      missingName: {
        email: 'test@example.com'
      },
      missingEmail: {
        name: 'Test Customer'
      },
      emptyName: {
        name: '',
        email: 'test@example.com'
      },
      emptyEmail: {
        name: 'Test Customer',
        email: ''
      },
      invalidEmail: {
        name: 'Test Customer',
        email: 'invalid-email'
      },
      nullValues: {
        name: null,
        email: null
      },
      undefinedValues: {
        name: undefined,
        email: undefined
      }
    };
  }

  /**
   * Generate test customer with specific properties
   */
  static generateCustomerWithProperties(overrides = {}) {
    const base = this.generateRandomCustomer();
    return { ...base, ...overrides };
  }
}

module.exports = TestHelpers;