import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
const workerId = process.env.JEST_WORKER_ID || '1';
process.env.MONGODB_URI = `mongodb://localhost:27017/finalyearproject_test_${workerId}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});
