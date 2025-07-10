// global-setup.js
async function globalSetup(config) {
  console.log('🚀 Starting global setup for integration tests...');
  
  // Wait for the API server to be ready
  const { request } = require('@playwright/test');
  const requestContext = await request.newContext({
    baseURL: config.projects[0].use.baseURL
  });

  let retries = 10;
  while (retries > 0) {
    try {
      const response = await requestContext.get('/customers');
      if (response.status() === 200) {
        console.log('✅ API server is ready');
        break;
      }
    } catch (error) {
      console.log(`⏳ Waiting for API server... (${retries} retries left)`);
      retries--;
      if (retries === 0) {
        throw new Error('API server failed to start within timeout period');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await requestContext.dispose();
  console.log('✅ Global setup completed');
}

module.exports = globalSetup;