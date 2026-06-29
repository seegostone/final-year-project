import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const findBackendRoot = () => {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), 'backend'),
    path.resolve(process.cwd(), '..', 'backend'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, '.env')) && fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }

  return process.cwd();
};

const appRoot = findBackendRoot();
dotenv.config({ path: path.resolve(appRoot, '.env') });

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

  const auth = { user, pass };

  if (service) {
    return nodemailer.createTransport({
      service,
      auth,
    });
  }

  if (!host || !port) {
    if (user.toLowerCase().endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth,
      });
    }

    console.warn(
      'Email service is not configured. Set EMAIL_SERVICE, or EMAIL_HOST and EMAIL_PORT.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth,
  });
};

const renderTemplate = (template, data) => {
  const compiled = handlebars.compile(template);
  return compiled(data);
};

const getDefaultFrom = () =>
  process.env.EMAIL_FROM || `Estates Complaint <${process.env.EMAIL_USER}>`;

const verifyTransporter = async (transporter, timeoutMs) => {
  if (!transporter || typeof transporter.verify !== 'function') {
    return true;
  }

  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Email transporter verification timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);

    return true;
  } catch (err) {
    console.warn('Email transporter verification failed:', {
      error: err instanceof Error ? err.message : String(err),
      code: err?.code,
      response: err?.response,
    });
    return false;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransport();

  if (!transporter) {
    console.warn('Skipping email because transporter is not configured.');
    return null;
  }

  if (!to) {
    console.warn('No recipient specified for email; skipping send.');
    return null;
  }

  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  let recipients = [];
  if (Array.isArray(to)) {
    recipients = to.filter(isValidEmail);
  } else {
    recipients = String(to)
      .split(',')
      .map((s) => s.trim())
      .filter(isValidEmail);
  }

  if (recipients.length === 0) {
    console.warn('No valid recipient emails; skipping send. Original to:', to);
    return null;
  }

  const message = {
    from: getDefaultFrom(),
    to: recipients.join(', '),
    subject,
    html,
    text,
  };

  const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS || process.env.SMTP_TIMEOUT_MS || 20000);

  const transporterVerified = await verifyTransporter(transporter, timeoutMs);
  if (!transporterVerified) {
    console.warn('Email transporter was not verified. Skipping email send.');
    return null;
  }

  try {
    const info = await Promise.race([
      transporter.sendMail(message),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Email send timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    console.info('Email sent:', {
      to: recipients.join(', '),
      subject,
      messageId: info.messageId,
    });
    return info;
  } catch (err) {
    console.warn('Email send failed:', {
      error: err instanceof Error ? err.message : String(err),
      to: recipients.join(', '),
      subject,
    });
    return null;
  }
};

const buildBaseTemplate = ({ title, body, bodyHtml, actionLabel, actionUrl }) => {
  const template = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h1 style="font-size: 22px; margin-bottom: 16px; color: #111827;">{{title}}</h1>
        <div style="font-size: 16px; margin-bottom: 24px; color: #374151;">{{{bodyHtml}}}{{^bodyHtml}}{{body}}{{/bodyHtml}}</div>
        {{#if actionUrl}}
          <a href="{{actionUrl}}" style="display: inline-block; padding: 12px 18px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px;">{{actionLabel}}</a>
        {{/if}}
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">If you did not expect this email, please ignore it.</p>
      </div>
    </div>
  `;

  return renderTemplate(template, { title, body, bodyHtml, actionLabel, actionUrl });
};

const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email/${encodeURIComponent(token)}`;
  const subject = 'Verify your EstatesComplaint email';
  const body = `Please verify your email by using the code below or clicking the button.\n\nVerification code: ${token}\n\nIf you did not create an account, you can ignore this email.`;
  const html = buildBaseTemplate({
    title: 'Verify your email',
    bodyHtml: `Thank you for registering. Use the code below to verify your email address and continue to EstatesComplaint.<br/><br/><strong>Verification code:</strong><br/>${token}`,
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

const sendResetPasswordEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(token)}`;
  const subject = 'Reset your EstatesComplaint password';
  const body = `Use the link below or the token to reset your password. This token will expire in 10 minutes.\n\nReset token: ${token}`;
  const html = buildBaseTemplate({
    title: 'Reset your password',
    bodyHtml:
      `A password reset was requested for your EstatesComplaint account. Use the token below or click the button to set a new password. If you did not request this, ignore this email.<br/><br/><strong>Reset token:</strong><br/>${token}`,
    actionLabel: 'Reset Password',
    actionUrl: resetUrl,
  });

  return sendEmail({
    to: email,
    subject,
    html,
    text: `${body}\n\n${resetUrl}`,
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
  sendResetPasswordEmail,
  sendNotificationEmail,
};
