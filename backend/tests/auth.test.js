import request from 'supertest';
import { MongoClient } from 'mongodb';
import app from '../server.js';

describe('Authentication', () => {
  let db;
  let client;

  beforeAll(async () => {
    // Connect to test database
    const uri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/finalyearproject_test';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    app.locals.db = db;
  });

  afterAll(async () => {
    // Close database connection
    await client.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await db.collection('users').deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@mak.ac.ug',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      await db.collection('users').insertOne({
        name: 'Test User',
        email: 'test@mak.ac.ug',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        emailVerified: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should login user with correct credentials', async () => {
      const loginData = {
        email: 'test@mak.ac.ug',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'test@mak.ac.ug',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});
