// global-teardown.js
async function globalTeardown(config) {
  console.log('🧹 Starting global teardown for integration tests...');
  
  // Clean up any remaining test data
  const { request } = require('@playwright/test');
  const requestContext = await request.newContext({
    baseURL: config.projects[0].use.baseURL
  });

  try {
    // Get all customers and clean up test data
    const response = await requestContext.get('/customers');
    if (response.ok()) {
      const customers = await response.json();
      
      // Delete customers that look like test data
      for (const customer of customers) {
        if (customer.name && customer.name.includes('Test') || 
            customer.email && customer.email.includes('test')) {
          await requestContext.delete(`/customers/${customer.id}`);
          console.log(`🗑️ Cleaned up test customer: ${customer.name}`);
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Error during cleanup (this is usually fine):', error.message);
  }

  await requestContext.dispose();
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown;