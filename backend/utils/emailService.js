const nodemailer = require('nodemailer');

const sendReceipt = async (to, bookingDetails) => {
    // For demo purposes, we use a test account or log to console
    // In a real app, you'd use your SMTP credentials
    console.log(`Sending receipt to ${to} for booking #${bookingDetails.id}`);

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'demo@ethereal.email', // Replace with real credentials
                pass: 'demo_pass'
            }
        });

        // If you don't have real credentials, this will fail.
        // For this task, I'll implement a fallback log if it fails.

        const mailOptions = {
            from: '"EventHub" <no-reply@eventhub.com>',
            to: to,
            subject: `Payment Receipt - ${bookingDetails.event_title}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">Payment Successful!</h2>
                    <p>Hi ${bookingDetails.user_name},</p>
                    <p>Thank you for your booking. Your payment has been confirmed.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <h3>Booking Details</h3>
                    <p><strong>Event:</strong> ${bookingDetails.event_title}</p>
                    <p><strong>Package:</strong> ${bookingDetails.package_name}</p>
                    <p><strong>Amount Paid:</strong> ₹${bookingDetails.total_amount}</p>
                    <p><strong>Transaction ID:</strong> ${bookingDetails.transaction_id}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #666;">This is an automated receipt. If you have any questions, please contact support.</p>
                </div>
            `
        };

        // For now, let's just log it to ensure it doesn't crash the server if SMTP is not set up
        console.log('--- MOCK EMAIL SENT ---');
        console.log(mailOptions.html.replace(/<[^>]*>?/gm, ' '));
        console.log('-----------------------');

        // Uncomment to send real email
        // await transporter.sendMail(mailOptions);

        return true;
    } catch (err) {
        console.error('Email error:', err);
        return false;
    }
};

module.exports = { sendReceipt };
