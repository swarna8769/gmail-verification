// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 📧 Nodemailer config (ඔයාගේ Gmail එකෙන් email යැවීම)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL@gmail.com', // ඔබේ Gmail එක
    pass: 'YOUR_APP_PASSWORD' // Gmail App Password එක
  }
});

// 📩 POST request එක handle කරනවා
app.post('/send-code', (req, res) => {
  const { email, code } = req.body;

  const mailOptions = {
    from: 'YOUR_GMAIL@gmail.com',
    to: email,
    subject: 'Your Verification Code',
    text: `ඔබේ Gmail තහවුරු කිරීමේ code එක: ${code}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ success: false, error });
    } else {
      return res.status(200).json({ success: true, info });
    }
  });
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
