import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

// استيراد الروابط
import fieldRoutes from "./routes/fieldRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

// Print crashes clearly in the logs (Render -> Logs)
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason instanceof Error ? reason.stack : reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception, shutting down:", err?.stack || err);
  process.exit(1);
});

// Refuse to start without a real JWT secret (the code would otherwise fall back to a public default)
if (!process.env.JWT_SECRET) {
  console.error("❌ Config error: JWT_SECRET is not set.");
  console.error("   Set it in Render -> Environment, or in backend/.env when running locally.");
  process.exit(1);
}

// الاتصال بقاعدة البيانات
// Wait for the database before accepting requests, so the API never serves 500s while it is down
await connectDB();

// التأكد من وجود مجلد الرفع
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
  console.log("📁 Created uploads folder");
}

const app = express();

// --- تحديث إعدادات CORS لتكون شاملة ومرنة ---
app.use(cors({
  origin: '*', // يسمح لأي رابط بالوصول (يحل مشكلة عدم ظهور الملاعب)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Expected-Role'] // X-Expected-Role: sent by the auth check (AuthContext)
}));

app.use(express.json());

// تشغيل الملفات الثابتة (الصور)
app.use("/uploads", express.static("uploads"));

// --- ROUTES ---
app.use("/api/fields", fieldRoutes);
app.use("/api/fields", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running smoothly on Render...");
});

// Health check: open /api/health in the browser to see if the database is connected
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const db = states[mongoose.connection.readyState] || "unknown";
  res.status(db === "connected" ? 200 : 503).json({
    status: db === "connected" ? "ok" : "error",
    db,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Last-resort error handler: logs any unexpected route error with method + URL
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`❌ ${req.method} ${req.originalUrl} -> ${status}:`, status >= 500 ? err.stack || err : err.message);
  if (res.headersSent) return next(err);
  res.status(status).json({ message: status < 500 ? err.message : "Server error" });
});

// --- تحديث الـ Port والـ Host ليتوافق مع بيئة Render ---
// Render يحتاج أن يعمل السيرفر على 0.0.0.0 ليكون متاحاً خارجياً
const PORT = process.env.PORT || 10000; 

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running and accessible on port ${PORT}`);
});