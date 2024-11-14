const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ibham913@gmail.com',
    pass: 'wgiujcvxhjkdpdbb'
  }
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'ibham913@gmail.com',
    to: to,
    subject: subject,
    text: text
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
