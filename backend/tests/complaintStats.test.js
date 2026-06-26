import { MongoClient, ObjectId } from 'mongodb';
import { complaintOperations } from '../utils/database.js';

describe('complaintOperations.getComplaintStats', () => {
  let client;
  let db;

  beforeAll(async () => {
    const uri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/finalyearproject_test';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.collection('complaints').deleteMany({});
  });

  it('returns only the calling user stats for a regular user', async () => {
    const userId = new ObjectId();
    const otherUserId = new ObjectId();

    await db.collection('complaints').insertMany([
      { userId, status: 'pending', createdAt: new Date() },
      { userId, status: 'in-progress', createdAt: new Date() },
      { userId, status: 'resolved', createdAt: new Date() },
      { userId: otherUserId, status: 'resolved', createdAt: new Date() },
    ]);

    const stats = await complaintOperations.getComplaintStats(
      db,
      userId.toString(),
      'user',
      'all'
    );

    expect(stats).toEqual({
      total: 3,
      pending: 1,
      inProgress: 1,
      resolved: 1,
    });
  });

  it('returns overall stats for an admin user', async () => {
    const userId = new ObjectId();
    const otherUserId = new ObjectId();

    await db.collection('complaints').insertMany([
      { userId, status: 'pending', createdAt: new Date() },
      { userId, status: 'in-progress', createdAt: new Date() },
      { userId, status: 'resolved', createdAt: new Date() },
      { userId: otherUserId, status: 'resolved', createdAt: new Date() },
    ]);

    const stats = await complaintOperations.getComplaintStats(
      db,
      userId.toString(),
      'admin',
      'all'
    );

    expect(stats).toEqual({
      total: 4,
      pending: 1,
      inProgress: 1,
      resolved: 2,
    });
  });
});
