require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

async function sendRegisterEmail(userEmail, username) {
    const subject = 'Your Account has been Created!';
    const text = `Hello ${username},\n\nThank you for registering with our service! We're excited to have you on board.\n\nBest regards,\nAdvance Banking System Team`;
    const html = `<p>Hello ${username},</p><p>Thank you for registering with our service! We're excited to have you on board.</p><p>Best regards,<br>Advance Banking System Team</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: subject,
        text: text,
        html: html
    });
}

async function sendTransactionEmail(userEmail, username, transactionDetails) {
    const subject = 'Transaction Confirmation';
    const text = `Hello ${username},\n\nYour transaction has been processed successfully. Here are the details:\n${transactionDetails}\n\nThank you for using our service!\n\nBest regards,\nAdvance Banking System Team`;
    const html = `<p>Hello ${username},</p><p>Your transaction has been processed successfully. Here are the details:</p><pre>${transactionDetails}</pre><p>Thank you for using our service!</p><p>Best regards,<br>Advance Banking System Team</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: subject,
        text: text,
        html: html
    });
}

module.exports = { sendRegisterEmail, sendTransactionEmail };