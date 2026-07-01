import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import request from 'supertest';
import { MongoClient } from 'mongodb';
import app from './server.js';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyearproject_test';
const client = new MongoClient(uri);
await client.connect();
const db = client.db();
app.locals.db = db;
await db.collection('users').deleteMany({ email: 'flowcheck@gmail.com' });

const response = await request(app)
  .post('/api/auth/register')
  .send({
    name: 'Flow Check',
    email: 'flowcheck@gmail.com',
    password: 'Password123!',
    role: 'Resident Staff',
    phoneNumber: '0712345678',
  });

console.log(JSON.stringify({ status: response.status, body: response.body }, null, 2));

await client.close();
