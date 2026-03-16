import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variables for production, or provide basic fallback for development testing
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendStudentLoginCredentials = async (studentName: string, enrollment: string, email: string, password: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Campus Living Portal – Login Credentials',
            text: `Dear ${studentName},

Your hostel application has been approved. Please find your login credentials below:

Enrollment No: ${enrollment}
Password: ${password}

Please keep your login credentials confidential and do not share them with anyone.

Regards,
Hostel Administration Team
Campus Living Portal
Government Polytechnic Awasari (Kh.)`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${email}: ${info.response}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return false;
    }
};
