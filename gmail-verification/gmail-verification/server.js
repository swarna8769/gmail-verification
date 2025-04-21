/* ✅ server.js - OTP Email + Firebase Profile Photo Upload (CORS Fixed) */

/* 📦 අවශ්‍ය packages import කිරීම */
import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

/* ✅ Firebase Admin SDK JSON file import (ඔබ GitHub එකට upload කළ JSON file එක) */
import serviceAccount from "./firebase-service-account.json" assert { type: "json" };

/* ✅ Express app initialize කිරීම */
const app = express();

/* ✅ CORS Middleware Setup - OPTIONS request සහ POST fix */
app.use(cors({
  origin: "*", // ✅ සියලු origin වලට allow කරනවා (CORS Fix)
  methods: ["GET", "POST", "OPTIONS"], // ✅ OPTIONS method එක දැමීම අවශ්‍යයි
  allowedHeaders: ["Content-Type", "x-user-id"] // ✅ custom header එක allow කරනවා
}));
app.options("*", cors()); // ✅ OPTIONS method සඳහා CORS middleware call කරනවා

/* ✅ JSON body parse කිරීම */
app.use(bodyParser.json());

/* ✅ File upload සඳහා multer memory storage එක */
const upload = multer({ storage: multer.memoryStorage() });

/* 🔐 Firebase Admin initialize කිරීම */
initializeApp({
  credential: cert(serviceAccount), // 🗝️ Firebase Admin SDK credentials
  storageBucket: "latestbook-110fa.appspot.com" // ✅ Firebase Storage bucket name
});

const bucket = getStorage().bucket(); // 🎯 Firebase Storage Bucket Object

/* ✅ Gmail OTP Email Send API (nodemailer) */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "latestbook1@gmail.com",     /* 📨 ඔබේ Gmail ලිපිනය */
    pass: "wpkdrbqbcdzktavz"           /* 🔐 Gmail App Password */
  }
});

/* 📩 POST request - OTP Gmail යැවීම */
app.post("/send-code", (req, res) => {
  const { email, code } = req.body; // 📨 client එකෙන් email සහ code එක ගන්නවා

  const mailOptions = {
    from: "latestbook1@gmail.com",
    to: email,
    subject: "Your Verification Code",
    text: `ඔබේ Gmail තහවුරු කිරීමේ code එක: ${code}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ success: false, error }); // ❌ email යැවීම fail උනොත්
    } else {
      return res.status(200).json({ success: true, info });   // ✅ email සාර්ථකව යවලා
    }
  });
});

/* 📤 Profile Photo Upload API (Firebase Storage) */
app.post("/upload-profile-photo", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("❌ File not received"); // ❌ file එකක් නැහැ

  const uid = req.headers["x-user-id"];
  if (!uid) return res.status(400).send("❌ User ID missing"); // ❌ user ID එක නැහැ

  try {
    const fileName = `profile_images/${uid}.jpg`; // 🔁 Firebase Storage path එක
    const file = bucket.file(fileName);           // 🎯 Firebase file object එක

    await file.save(req.file.buffer, {
      contentType: req.file.mimetype,  // 🔎 File type set
      public: false                    // 🔒 Private access only
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030" // 🗓️ Valid until 2030
    });

    res.send({ url }); // 🔁 URL එක client එකට යවන්න
  } catch (err) {
    console.error("🔥 Upload Error:", err);
    res.status(500).send("❌ Upload failed"); // ❌ Unexpected error
  }
});

/* 🚀 Server Start කිරීම */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
