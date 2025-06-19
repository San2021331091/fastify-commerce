import nodemailer from 'nodemailer';

export async function sendInvoiceEmail(to: string, filePath: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to,
    subject: '🧾 Your Order Invoice',
    text: 'Attached is your invoice for the recent order. Thank you!',
    attachments: [
      {
        filename: 'invoice.pdf',
        path: filePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}
