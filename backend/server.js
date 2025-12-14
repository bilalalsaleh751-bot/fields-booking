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

dotenv.config();
connectDB();

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
  console.log("📁 Created uploads folder");
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// FIELD ROUTES
app.use("/api/fields", fieldRoutes);
app.use("/api/fields", availabilityRoutes);

// BOOKING ROUTES
app.use("/api/bookings", bookingRoutes);

// USER ROUTES
app.use("/api/users", userRoutes);

// OWNER ROUTES
app.use("/api/owner", ownerRoutes);

// ADMIN ROUTES
app.use("/api/admin", adminRoutes);

// PUBLIC CMS ROUTES (for frontend)
app.use("/api/public", publicRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
