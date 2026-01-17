import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import connectDB from "./config/db.js";

import fieldRoutes from "./routes/fieldRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

// التأكد من وجود مجلد الرفع
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
  console.log("📁 Created uploads folder");
}

const app = express();

/** * الحل الجذري لمشكلة Windows و CORS 
 * قمنا بإضافة 127.0.0.1 لأن ويندوز أحياناً لا يتعرف على localhost بشكل صحيح
 */
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true 
}));

app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// ROUTES
app.use("/api/fields", fieldRoutes);
app.use("/api/fields", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));