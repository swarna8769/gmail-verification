/* ✅ server.js - OTP Email + Firebase Profile Photo Upload (CORS Free) */

/* 📦 අවශ්‍ය packages import කිරීම */
import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// ✅ Firebase Admin SDK JSON file import (ඔබ GitHub එකට upload කළ JSON file එක)
import serviceAccount from "./firebase-service-account.json" assert { type: "json" };

/* ✅ Express app initialize කිරීම */
const app = express();
app.use(cors()); // 🔓 Cross-Origin Resource Sharing enable
app.use(bodyParser.json()); // 📦 JSON data read කරන්න

// ✅ File upload සඳහා multer memory storage එක
const upload = multer({ storage: multer.memoryStorage() });

/* 🔐 Firebase Admin initialize කිරීම */
initializeApp({
  credential: cert(serviceAccount), // 🗝️ Service account credential එක භාවිතා කරනවා
  storageBucket: "latestbook-110fa.appspot.com" // ✅ ඔබේ Firebase storage bucket name එක
});
const bucket = getStorage().bucket(); // 🎯 Firebase Storage bucket එක object එකක් විදිහට ගන්නවා

/* ✅ Gmail OTP Email Send API (nodemailer) */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL@gmail.com', /* 🔑 ඔබේ Gmail ලිපිනය */
    pass: 'YOUR_APP_PASSWORD'     /* 🔐 Gmail App Password එක */
  }
});

/* 📩 POST request - OTP Gmail යැවීම */
app.post('/send-code', (req, res) => {
  const { email, code } = req.body; // 📨 client එකෙන් email සහ code එක ගන්නවා

  const mailOptions = {
    from: 'YOUR_GMAIL@gmail.com',
    to: email,
    subject: 'Your Verification Code',
    text: `ඔබේ Gmail තහවුරු කිරීමේ code එක: ${code}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ success: false, error }); // ❌ email යැවීම fail උනොත්
    } else {
      return res.status(200).json({ success: true, info }); // ✅ email සාර්ථකව යවලා
    }
  });
});

/* 📤 Profile Photo Upload API (Firebase Storage) */
app.post("/upload-profile-photo", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("❌ File not received"); // ❌ file එකක් නෑ

  const uid = req.headers["x-user-id"];
  if (!uid) return res.status(400).send("❌ User ID missing"); // ❌ user ID එක නෑ

  const fileName = `profile_images/${uid}.jpg`; // 🔁 Firebase Storage path එක
  const file = bucket.file(fileName); // 🎯 Firebase file object එක

  await file.save(req.file.buffer, {
    contentType: req.file.mimetype, // 🔎 File type එක set කරනවා (image/jpeg etc)
    public: false // 🔒 file එක public නෙවෙයි - private access only
  });

  // 🔁 Firebase storage වලින් signed URL එකක් ගන්නවා (expire නොවෙන)
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030" // 🗓️ URL එක use කරන්න පුලුවන් දවස
  });

  res.send({ url }); // 🔄 Client එකට URL එක එවනවා
});

/* 🚀 Server Start කිරීම */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
