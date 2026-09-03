const nodemailer = require('nodemailer');

// 1. Initialize the transporter using Gmail's SMTP service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send 6-digit OTP email to any destination user
 * @param {string} toEmail - Recipient's email address
 * @param {string} resetCode - 6-digit verification code
 */
const sendPasswordResetEmail = async (toEmail, resetCode) => {
  const mailOptions = {
    from: `"PocketTrainer" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your PocketTrainer Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 28px; border-radius: 12px; max-width: 460px; margin: auto;">
        <h2 style="color: #22c55e; margin: 0 0 10px 0;">Pocket Trainer</h2>
        <h3 style="margin: 0 0 16px 0; color: #f4f4f5;">Password Reset Verification</h3>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
          Use the 6-digit verification code below to reset your account password. This code will expire in 10 minutes.
        </p>
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #22c55e;">
            ${resetCode}
          </span>
        </div>
        <p style="color: #71717a; font-size: 12px; margin: 0;">
          If you did not request this, please disregard this email. Your account remains secure.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };