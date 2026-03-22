import 'dotenv/config';

// Use a known API key for E2E tests if none is set
if (!process.env.API_KEY) {
  process.env.API_KEY = 'e2e-test-api-key';
}
