import nodemailer from 'nodemailer';

// @desc    Submit contact form & send email via Nodemailer
// @route   POST /api/v1/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All form fields are required.' });
  }

  try {
    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for port 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_USER || 'yourhackbuddy@gmail.com',
        pass: process.env.EMAIL_PASS || 'mytizghyausfgvwc',
      },
    });

    // Email content mapping details
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ClaimLens Support" <yourhackbuddy@gmail.com>',
      to: 'yourhackbuddy@gmail.com', // Sending to itself as requested
      subject: `[ClaimLens Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #c7c4d7; border-radius: 12px; background-color: #fcf9f8;">
          <h2 style="color: #4648d4; margin-top: 0;">New Contact Form Submission</h2>
          <hr style="border: 0; border-top: 1px solid #c7c4d7; margin: 20px 0;" />
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #1c1b1b; width: 30%;">Sender Name:</td>
              <td style="padding: 8px 0; color: #464554;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #1c1b1b;">Sender Email:</td>
              <td style="padding: 8px 0; color: #464554;"><a href="mailto:${email}" style="color: #4648d4; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #1c1b1b;">Subject:</td>
              <td style="padding: 8px 0; color: #464554;">${subject}</td>
            </tr>
          </table>

          <hr style="border: 0; border-top: 1px solid #c7c4d7; margin: 20px 0;" />
          
          <h3 style="color: #1c1b1b; margin-bottom: 10px;">Message Body:</h3>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #c7c4d7; color: #1c1b1b; white-space: pre-wrap; line-height: 1.6;">${message}</div>
          
          <p style="font-size: 11px; color: #767586; margin-top: 30px; text-align: center;">
            This email was sent automatically from the ClaimLens contact form integration.
          </p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    res.status(500).json({ message: 'Failed to send secure email. Please try again later.' });
  }
};
