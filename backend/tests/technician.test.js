import request from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../server.js';

describe('Technician routes', () => {
  let client;
  let db;
  let technician;
  let token;
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

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const userRes = await db.collection('users').insertOne({
      name: 'Tech User',
      email: 'tech@gmail.com',
      password: hashedPassword,
      role: 'Technician',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    technician = await db.collection('users').findOne({ _id: userRes.insertedId });
    token = jwt.sign({ id: technician._id.toString() }, process.env.JWT_SECRET || 'test_jwt_secret', {
      expiresIn: '1h',
    });

    const complaint = {
      title: 'Leaking ceiling',
      description: 'Water dripping from ceiling in lecture hall',
      location: 'Block A',
      category: 'Maintenance',
      status: 'assigned',
      tasks: [
        {
          _id: new ObjectId(),
          title: 'Repair ceiling leak',
          description: 'Investigate and repair ceiling leak in classroom',
          status: 'open',
          priority: 'HIGH',
          assigneeId: technician._id,
          assigneeName: technician.name,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          activityLog: [],
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedComplaint = await db.collection('complaints').insertOne(complaint);
    complaintId = insertedComplaint.insertedId.toString();
    taskId = complaint.tasks[0]._id.toString();
  });

  describe('GET /api/technician/tasks', () => {
    it('returns tasks assigned to the technician', async () => {
      const response = await request(app)
        .get('/api/technician/tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        complaintId,
        taskId,
        title: 'Repair ceiling leak',
        status: 'open',
        priority: 'HIGH',
      });
    });
  });

  describe('GET /api/technician/tasks/:complaintId/:taskId', () => {
    it('returns the selected task detail', async () => {
      const response = await request(app)
        .get(`/api/technician/tasks/${complaintId}/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        complaintId,
        id: taskId,
        title: 'Repair ceiling leak',
        status: 'open',
        priority: 'HIGH',
      });
    });
  });

  describe('PATCH /api/technician/tasks/:complaintId/:taskId/status', () => {
    it('updates task status to in_progress', async () => {
      const response = await request(app)
        .patch(`/api/technician/tasks/${complaintId}/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('accepts a work report and sets status to done', async () => {
      const workReport = {
        actionsTaken: 'Replaced pipe seal and dried area',
        materialsUsed: ['Sealant', 'Cloth'],
        hoursSpent: 1.5,
      };

      const response = await request(app)
        .patch(`/api/technician/tasks/${complaintId}/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done', workReport })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('done');
      expect(response.body.data.workReport).toMatchObject({
        actionsTaken: workReport.actionsTaken,
        materialsUsed: workReport.materialsUsed,
        hoursSpent: workReport.hoursSpent,
      });
    });
  });
});
