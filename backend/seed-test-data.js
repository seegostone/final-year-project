import { MongoClient, ObjectId } from 'mongodb';
import bcryptjs from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/estates_management_db';
const DB_NAME = 'estates_management_db';

async function seedTestData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Step 1: Create test resident user
    const residentEmail = 'john.resident@gmail.com';
    const usersCollection = db.collection('users');
    let resident = await usersCollection.findOne({ email: residentEmail });

    if (!resident) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('TestPass@123', salt);
      
      const result = await usersCollection.insertOne({
        name: 'John Resident',
        email: residentEmail,
        password: hashedPassword,
        role: 'Resident Staff',
        normalizedRole: 'resident_staff',
        phoneNumber: '0701234567',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      resident = await usersCollection.findOne({ _id: result.insertedId });
      console.log('✓ Created resident: john.resident@gmail.com');
    } else {
      await usersCollection.updateOne(
        { _id: resident._id },
        { 
          $set: { 
            emailVerified: true,
            isActive: true,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✓ Updated resident: john.resident@gmail.com');
    }

    // Step 2: Create test complaints
    const complaintsCollection = db.collection('complaints');
    
    // Delete existing test complaints
    await complaintsCollection.deleteMany({ complaintId: { $in: ['C-001', 'C-002', 'C-003', 'C-004', 'C-005'] } });
    
    const complaints = [
      {
        complaintId: 'C-001',
        title: 'Leaking tap in Block A',
        description: 'The kitchen tap in room 101 is leaking continuously for the past week and needs immediate repair.',
        location: 'Block A, Floor 1, Room 101',
        category: 'Plumbing',
        urgency: 'High',
        priority: 'HIGH',
        status: 'pending',
        submittedBy: {
          userId: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phoneNumber
        },
        createdAt: new Date(Date.now() - 3*24*60*60*1000),
        slaDeadline: new Date(Date.now() + 4*24*60*60*1000)
      },
      {
        complaintId: 'C-002',
        title: 'Broken window pane',
        description: 'One of the window panes in the study room is cracked and needs replacement to prevent weather damage.',
        location: 'Block B, Floor 2, Room 205',
        category: 'Carpentry',
        urgency: 'Medium',
        priority: 'MEDIUM',
        status: 'pending',
        submittedBy: {
          userId: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phoneNumber
        },
        createdAt: new Date(Date.now() - 2*24*60*60*1000),
        slaDeadline: new Date(Date.now() + 5*24*60*60*1000)
      },
      {
        complaintId: 'C-003',
        title: 'Non-functional light fixture',
        description: 'The ceiling light in the common room stopped working. Please repair or replace the light fixture.',
        location: 'Block C, Ground Floor, Common Room',
        category: 'Electrical',
        urgency: 'Critical',
        priority: 'CRITICAL',
        status: 'pending',
        submittedBy: {
          userId: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phoneNumber
        },
        createdAt: new Date(Date.now() - 1*24*60*60*1000),
        slaDeadline: new Date(Date.now() + 1*24*60*60*1000)
      },
      {
        complaintId: 'C-004',
        title: 'Dirty corridor',
        description: 'The corridor on floor 3 has not been cleaned in several days and poses hygiene concerns.',
        location: 'Block A, Floor 3, Corridor',
        category: 'Cleaning',
        urgency: 'Low',
        priority: 'LOW',
        status: 'pending',
        submittedBy: {
          userId: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phoneNumber
        },
        createdAt: new Date(Date.now() - 5*24*60*60*1000),
        slaDeadline: new Date(Date.now() + 8*24*60*60*1000)
      },
      {
        complaintId: 'C-005',
        title: 'Door lock jamming',
        description: 'The main entrance door lock is jammed and difficult to open, affecting building access for residents.',
        location: 'Block D, Ground Floor, Main Entrance',
        category: 'Carpentry',
        urgency: 'Critical',
        priority: 'CRITICAL',
        status: 'pending',
        submittedBy: {
          userId: resident._id,
          name: resident.name,
          email: resident.email,
          phone: resident.phoneNumber
        },
        createdAt: new Date(),
        slaDeadline: new Date(Date.now() + 2*24*60*60*1000)
      }
    ];

    const result = await complaintsCollection.insertMany(complaints);
    console.log(`✓ Created ${result.insertedIds.length} test complaints\n`);

    complaints.forEach((c) => {
      console.log(`  📌 ${c.complaintId}: ${c.title}`);
      console.log(`     Priority: ${c.priority} | Status: ${c.status.toUpperCase()}`);
    });

    console.log('\n✨ Test data seeding complete!');
    console.log('\n🚀 Next steps:');
    console.log('  1. Go to http://localhost:5173');
    console.log('  2. Login as: john.resident@gmail.com / TestPass@123');
    console.log('  3. You should see 5 test complaints in the dashboard queue');
    console.log('  4. Try clicking on them and test the modals!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedTestData();
