import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
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

// الاتصال بقاعدة البيانات
connectDB();

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
  allowedHeaders: ['Content-Type', 'Authorization']
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

// --- تحديث الـ Port والـ Host ليتوافق مع بيئة Render ---
// Render يحتاج أن يعمل السيرفر على 0.0.0.0 ليكون متاحاً خارجياً
const PORT = process.env.PORT || 10000; 

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running and accessible on port ${PORT}`);
});