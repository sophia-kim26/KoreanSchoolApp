import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTACredentials = async ({ first_name, email, pin }) => {
  await transporter.sendMail({
    from: `"Korean School" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your TA Account Has Been Created',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e40af; margin-top: 0;">Welcome, ${first_name}!</h2>
        <p>Your TA account has been created. Here are your login credentials:</p>
        <div style="background: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>PIN:</strong> <span style="font-size: 20px; font-weight: bold; letter-spacing: 4px;">${pin}</span></p>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Please keep your PIN secure. Contact your VP if you need it reset.</p>
      </div>
    `,
  });
};