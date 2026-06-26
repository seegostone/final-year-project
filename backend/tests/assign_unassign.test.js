import request from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import app from '../server.js';

describe('Assign / Unassign task flow', () => {
  let client;
  let db;
  let officer;
  let officerToken;
  let technician;
  let complaintId;
  let taskId;

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

    const officerRes = await db.collection('users').insertOne({
      name: 'Officer One',
      email: 'officer@example.com',
      password: 'irrelevant',
      role: 'Estates Officer',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    officer = await db.collection('users').findOne({ _id: officerRes.insertedId });
    officerToken = jwt.sign({ id: officer._id.toString() }, process.env.JWT_SECRET || 'test_jwt_secret');

    const techRes = await db.collection('users').insertOne({
      name: 'Tech A',
      email: 'techa@example.com',
      password: 'irrelevant',
      role: 'Technician',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    technician = await db.collection('users').findOne({ _id: techRes.insertedId });

    const taskObjectId = new ObjectId();
    taskId = taskObjectId.toString();

    const complaint = {
      title: 'Test Complaint',
      description: 'Testing assign/unassign',
      location: 'Test',
      category: 'Maintenance',
      status: 'triaged',
      tasks: [
        {
          _id: taskObjectId,
          title: 'Test Task',
          description: 'Task to assign',
          status: 'open',
          priority: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await db.collection('complaints').insertOne(complaint);
    complaintId = inserted.insertedId.toString();
  });

  it('assigns a technician, prevents duplicate assign, and allows unassign', async () => {
    // Assign
    const assignRes = await request(app)
      .post(`/api/management/${complaintId}/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ technicianId: technician._id.toString(), technicianName: technician.name })
      .expect(200);

    expect(assignRes.body.success).toBe(true);
    const afterAssign = await db.collection('complaints').findOne({ _id: new ObjectId(complaintId) });
    const assignedTask = (afterAssign.tasks || []).find((t) => t._id.toString() === taskId);
    expect(assignedTask.assigneeId).toBeDefined();
    expect(assignedTask.assigneeName).toBe(technician.name);

    // Duplicate assign should be rejected
    await request(app)
      .post(`/api/management/${complaintId}/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ technicianId: technician._id.toString(), technicianName: technician.name })
      .expect(400);

    // Unassign
    const unassignRes = await request(app)
      .post(`/api/management/${complaintId}/tasks/${taskId}/unassign`)
      .set('Authorization', `Bearer ${officerToken}`)
      .expect(200);

    expect(unassignRes.body.success).toBe(true);
    const afterUnassign = await db.collection('complaints').findOne({ _id: new ObjectId(complaintId) });
    const unassignedTask = (afterUnassign.tasks || []).find((t) => t._id.toString() === taskId);
    expect(unassignedTask.assigneeId).toBeNull();
    expect(unassignedTask.assigneeName).toBeNull();
  });
});
