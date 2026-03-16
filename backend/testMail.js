require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'test@example.com',
    subject: 'Test',
    text: 'Test Email'
};

transporter.sendMail(mailOptions).then(console.log).catch(console.error);
