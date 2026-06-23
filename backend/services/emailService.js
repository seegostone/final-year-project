import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

const getTransport = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT && parseInt(process.env.EMAIL_PORT, 10);
  const secure = process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_SECURE === '1';

  if (!user || !pass) {
    console.warn(
      'Email service is not configured. Set EMAIL_USER and EMAIL_PASS or EMAIL_APP_PASSWORD.'
    );
    return null;
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: {
        user,
        pass,
      },
    });
  }

  if (!host || !port) {
    console.warn(
      'Email service is not configured. Set EMAIL_SERVICE, or EMAIL_HOST and EMAIL_PORT.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const renderTemplate = (template, data) => {
  const compiled = handlebars.compile(template);
  return compiled(data);
};

const getDefaultFrom = () =>
  process.env.EMAIL_FROM || `Estates Complaint <${process.env.EMAIL_USER}>`;

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransport();

  if (!transporter) {
    console.warn('Skipping email because transporter is not configured.');
    return null;
  }

  const message = {
    from: getDefaultFrom(),
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(message);
  console.info('Email sent:', info.messageId);
  return info;
};

const buildBaseTemplate = ({ title, body, actionLabel, actionUrl }) => {
  const template = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h1 style="font-size: 22px; margin-bottom: 16px; color: #111827;">{{title}}</h1>
        <div style="font-size: 16px; margin-bottom: 24px; color: #374151;">{{body}}</div>
        {{#if actionUrl}}
          <a href="{{actionUrl}}" style="display: inline-block; padding: 12px 18px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px;">{{actionLabel}}</a>
        {{/if}}
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">If you did not expect this email, please ignore it.</p>
      </div>
    </div>
  `;

  return renderTemplate(template, { title, body, actionLabel, actionUrl });
};

const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email/${encodeURIComponent(token)}`;
  const subject = 'Verify your EstatesComplaint email';
  const body = 'Please verify your email by clicking the button below.\n\nIf you did not create an account, you can ignore this email.';
  const html = buildBaseTemplate({
    title: 'Verify your email',
    body:
      'Thank you for registering. Click the button below to verify your email address and continue to EstatesComplaint.',
    actionLabel: 'Verify Email',
    actionUrl: verificationUrl,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    text: `${body}\n\n${verificationUrl}`,
  });
};

const sendNotificationEmail = async (email, subject, message, options = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const actionUrl = options.route ? `${frontendUrl}${options.route}` : null;
  const html = buildBaseTemplate({
    title: subject,
    body: message,
    actionLabel: actionUrl ? 'View details' : '',
    actionUrl,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    text: `${message}${actionUrl ? `\n\n${actionUrl}` : ''}`,
  });
};

export default {
  sendVerificationEmail,
  sendNotificationEmail,
};
