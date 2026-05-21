import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Reusable utility function to send transactional emails using Nodemailer.
 * Supports both plain-text and HTML formatting.
 * 
 * @param {object} options - Email configuration options
 * @param {string} options.email - Recipient's email address (or 'to')
 * @param {string} options.subject - Email subject line
 * @param {string} [options.message] - Plain-text email body
 * @param {string} [options.html] - Optional HTML email body
 * @returns {Promise<object>} Nodemailer send result info
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === "465", // true for 465, false for 587/2525
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"ClaimLens Support" <${process.env.EMAIL_USER}>`,
    to: options.email || options.to,
    subject: options.subject,
    text: options.message || options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Nodemailer]: Email successfully sent. Message ID: ${info.messageId}`);
  return info;
};

export default sendEmail;
