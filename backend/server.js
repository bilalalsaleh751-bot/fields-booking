// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";

dotenv.config();          // 👈 لازم قبل connectDB

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// DB connect
connectDB();

// Simple test route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
