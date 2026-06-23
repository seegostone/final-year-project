import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyearproject';

async function e2eComplaintTest() {
  let client;
  try {
    // 1. Seed a test resident staff user
    console.log('\n🔷 [SETUP] Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    const testEmail = `resident_${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    console.log('🔷 [SETUP] Creating test resident staff user:', testEmail);
    await usersCollection.deleteOne({ email: testEmail });
    const userResult = await usersCollection.insertOne({
      name: 'Test Resident',
      email: testEmail,
      password: hashedPassword,
      role: 'Resident Staff',
      normalizedRole: 'resident_staff',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
    });

    const userId = userResult.insertedId.toString();
    console.log('✅ [SETUP] User created:', userId);

    // 2. Authenticate
    console.log('\n🔷 [AUTH] Logging in with credentials...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ [AUTH] Login successful, token:', token.substring(0, 20) + '...');

    // 3. Submit a complaint
    console.log('\n🔷 [COMPLAINT] Submitting test complaint...');
    const complaintResponse = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Test Water Leak',
        description: 'There is a water leak in Block C bathroom causing damage.',
        location: 'Block C, Floor 2, Bathroom',
        category: 'Plumbing',
        urgency: 'High',
      }),
    });

    if (!complaintResponse.ok) {
      throw new Error(`Complaint submission failed: ${complaintResponse.status} ${await complaintResponse.text()}`);
    }

    const complaintData = await complaintResponse.json();
    const complaintId = complaintData.data.id;
    console.log('✅ [COMPLAINT] Complaint created:', complaintId);
    console.log('   - Title:', complaintData.data.title);
    console.log('   - Status:', complaintData.data.status);
    console.log('   - Urgency:', complaintData.data.urgency);

    // 4. Retrieve the complaint
    console.log('\n🔷 [RETRIEVE] Fetching submitted complaint...');
    const getResponse = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!getResponse.ok) {
      throw new Error(`Fetch complaint failed: ${getResponse.status} ${await getResponse.text()}`);
    }

    const retrievedComplaint = await getResponse.json();
    console.log('✅ [RETRIEVE] Complaint fetched successfully');
    console.log('   - ID:', retrievedComplaint.data._id);
    console.log('   - Title:', retrievedComplaint.data.title);
    console.log('   - Status:', retrievedComplaint.data.status);
    console.log('   - Category:', retrievedComplaint.data.category);

    // 5. Get user's complaints list
    console.log('\n🔷 [LIST] Fetching user complaints list...');
    const listResponse = await fetch(`${BASE_URL}/complaints/my-complaints?page=1&limit=10`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!listResponse.ok) {
      throw new Error(`Fetch complaints list failed: ${listResponse.status} ${await listResponse.text()}`);
    }

    const listData = await listResponse.json();
    console.log('✅ [LIST] Complaints list fetched');
    console.log('   - Total found:', listData.count);
    console.log('   - Current page:', listData.pagination.currentPage);
    console.log('   - Total pages:', listData.pagination.totalPages);

    // 6. Verify stats endpoint
    console.log('\n🔷 [STATS] Fetching complaint stats...');
    const statsResponse = await fetch(`${BASE_URL}/complaints/stats?timeRange=all`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!statsResponse.ok) {
      throw new Error(`Fetch stats failed: ${statsResponse.status} ${await statsResponse.text()}`);
    }

    const statsData = await statsResponse.json();
    console.log('✅ [STATS] Complaint stats fetched');
    console.log('   - Total:', statsData.data.total);
    console.log('   - Pending:', statsData.data.pending);
    console.log('   - In Progress:', statsData.data.inProgress);
    console.log('   - Resolved:', statsData.data.resolved);

    console.log('\n✨ [SUCCESS] End-to-end complaint submission test passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [ERROR]', error.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

e2eComplaintTest();
