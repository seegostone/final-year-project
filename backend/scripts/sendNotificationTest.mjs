import dotenv from 'dotenv';
import emailService from '../services/emailService.js';

dotenv.config({ path: './.env' });

const run = async () => {
  try {
    const recipient = process.env.EMAIL_USER;
    const subject = 'Test: Notification CTA for complaint submitter';
    const message = 'This is a test notification to verify the CTA opens the complaint detail for submitters.';

    const options = {
      role: 'resident',
      route: '/complaints/TEST-COMP-123',
      actionLabel: 'View complaint',
      showActionButton: true,
    };

    console.log('Sending notification to', recipient, 'with options', options);
    const info = await emailService.sendNotificationEmail(recipient, subject, message, options);
    console.log('Result:', info);
  } catch (err) {
    console.error('Error sending notification test:', err && err.stack ? err.stack : err);
  }
};

run();
