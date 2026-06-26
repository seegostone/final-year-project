import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testEmail = async () => {
  try {
    // Option 1: Use service
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_APP_PASSWORD,
    //   },
    // });

    // Option 2: Explicit config (more reliable)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    console.log('📧 Sending test email...');

    const info = await transporter.sendMail({
      from: `"EstatesComplaint" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ Email Service Working!',
      html: `
        <h2 style="color: #1e3a5f;">Email Service is Active</h2>
        <p>Your Gmail SMTP + Nodemailer setup is working perfectly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #64748b; font-size: 12px;">EstatesComplaint System</p>
      `,
    });

    console.log('✅ Email sent! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

testEmail();