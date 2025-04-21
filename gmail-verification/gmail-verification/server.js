/* ✅ server.js - OTP Email + Firebase Profile Photo Upload (CORS Free) */

/* 📦 අවශ්‍ය packages import කිරීම */
import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

/* ✅ Firebase Admin SDK JSON file import */
import serviceAccount from "./firebase-service-account.json" assert { type: "json" };

/* ✅ Express app initialize කිරීම */
const app = express();
app.use(cors());
app.use(bodyParser.json());
const upload = multer({ storage: multer.memoryStorage() });

/* 🔐 Firebase Admin initialize කිරීම */
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "latestbook-110fa.appspot.com" // ✅ ඔබේ Firebase Storage Bucket
});
const bucket = getStorage().bucket();

/* ✅ Gmail OTP Email Send API */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL@gmail.com', // 🔐 Gmail address
    pass: 'YOUR_APP_PASSWORD'     // 🔐 Gmail App Password
  }
});

/* 📩 OTP Email Send POST API */
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

/* 📤 Profile Photo Upload API */
app.post("/upload-profile-photo", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("❌ File not received");

  const uid = req.headers["x-user-id"];
  if (!uid) return res.status(400).send("❌ User ID missing");

  const fileName = `profile_images/${uid}.jpg`; // ✅ Storage path
  const file = bucket.file(fileName);

  await file.save(req.file.buffer, {
    contentType: req.file.mimetype,
    public: false
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030"
  });

  res.send({ url });
});

/* 🚀 Server Start */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
