import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyearproject';
const client = new MongoClient(uri);

const main = async () => {
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    const email = process.env.SEED_TECH_EMAIL || 'tech+local@example.com';

    const existing = await users.findOne({ email });
    if (existing) {
      console.log('Technician already exists:', existing._id.toString());
      const token = jwt.sign({ id: existing._id.toString() }, process.env.JWT_SECRET || 'test_jwt_secret', { expiresIn: '7d' });
      console.log('JWT:', token);
      process.exit(0);
    }

    const password = process.env.SEED_TECH_PASSWORD || 'Password123!';
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      name: 'Local Technician',
      email,
      password: hashed,
      role: 'Technician',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
    };

    const res = await users.insertOne(user);
    console.log('Inserted technician id:', res.insertedId.toString());
    const token = jwt.sign({ id: res.insertedId.toString() }, process.env.JWT_SECRET || 'test_jwt_secret', { expiresIn: '7d' });
    console.log('JWT:', token);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.close();
  }
};

main();