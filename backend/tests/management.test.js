import request from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import app from '../server.js';

describe('Management approval request flow', () => {
  let client;
  let db;
  let officer;
  let officerToken;
  let resident;
  let complaintId;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyearproject_test';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    app.locals.db = db;
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.collection('users').deleteMany({});
    await db.collection('complaints').deleteMany({});

    const officerResult = await db.collection('users').insertOne({
      name: 'Officer User',
      email: 'officer@example.com',
      password: 'Password123!',
      role: 'Estates Officer',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    officer = await db.collection('users').findOne({ _id: officerResult.insertedId });
    officerToken = jwt.sign({ id: officer._id.toString() }, process.env.JWT_SECRET || 'test_jwt_secret', {
      expiresIn: '1h',
    });

    const residentResult = await db.collection('users').insertOne({
      name: 'Resident User',
      email: 'resident@example.com',
      password: 'Password123!',
      role: 'Resident',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    resident = await db.collection('users').findOne({ _id: residentResult.insertedId });

    const complaint = {
      title: 'Leaking ceiling needs approval',
      description: 'Work finished, ready for resident approval',
      location: 'Block B',
      category: 'Maintenance',
      status: 'scope_defined',
      userId: resident._id,
      tasks: [
        {
          _id: new ObjectId(),
          title: 'Inspect leak',
          status: 'done',
          priority: 'HIGH',
          assigneeId: officer._id,
          assigneeName: officer.name,
          createdAt: new Date(),
          updatedAt: new Date(),
          activityLog: [],
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const complaintInsert = await db.collection('complaints').insertOne(complaint);
    complaintId = complaintInsert.insertedId.toString();
  });

  it('auto-resolves scope_defined complaint with all tasks done when requesting resident approval', async () => {
    const response = await request(app)
      .post(`/api/management/${complaintId}/request-approval`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ message: 'Please approve the completed work' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('resolved');
    expect(response.body.data.residentValidation).toMatchObject({
      isPending: true,
      requestMessage: 'Please approve the completed work',
    });
    expect(response.body.data.resolvedAt).toBeDefined();

    const updatedComplaint = await db.collection('complaints').findOne({ _id: new ObjectId(complaintId) });
    expect(updatedComplaint.status).toBe('resolved');
    expect(updatedComplaint.resolvedAt).toBeTruthy();
    expect(updatedComplaint.residentValidation?.isPending).toBe(true);
  });

  it('rejects approval request when tasks are not all done', async () => {
    await db.collection('complaints').updateOne(
      { _id: new ObjectId(complaintId) },
      { $set: { 'tasks.0.status': 'in_progress', updatedAt: new Date() } }
    );

    const response = await request(app)
      .post(`/api/management/${complaintId}/request-approval`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ message: 'Please approve' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not ready for resident approval/i);
  });
});
