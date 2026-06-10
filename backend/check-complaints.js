import mongoose from 'mongoose';
import Complaint from './models/Complaint.js';

mongoose.connect('mongodb://localhost:27017/estates_management_db')
  .then(async () => {
    const count = await Complaint.countDocuments();
    console.log('Total complaints:', count);
    
    const sample = await Complaint.find().limit(5).select('complaintId title status priority slaDeadline createdAt');
    if(sample.length > 0) {
      console.log('\nSample complaints:');
      sample.forEach(c => {
        console.log(`  ${c.complaintId}`);
        console.log(`    Title: ${c.title}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Priority: ${c.priority}`);
      });
    } else {
      console.log('No complaints found in database');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
