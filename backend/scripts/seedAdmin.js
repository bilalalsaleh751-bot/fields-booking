/**
 * SEED ADMIN SCRIPT
 * Creates the first super_admin user
 * 
 * Usage: node scripts/seedAdmin.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Import model
import Admin from "../models/Admin.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fields-booking";

async function seedAdmin() {
  console.log("🔌 Connecting to MongoDB...");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@sportlebanon.com" });
    
    if (existingAdmin) {
      console.log("⚠️  Admin already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log("");
      console.log("To reset, delete the admin manually from MongoDB.");
      await mongoose.disconnect();
      return;
    }
    
    // Create super_admin
    const hashedPassword = await bcrypt.hash("Admin123!", 10);
    
    const admin = await Admin.create({
      fullName: "Super Admin",
      email: "admin@sportlebanon.com",
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });
    
    console.log("");
    console.log("✅ SUPER ADMIN CREATED SUCCESSFULLY");
    console.log("═══════════════════════════════════════");
    console.log(`   Email:    admin@sportlebanon.com`);
    console.log(`   Password: Admin123!`);
    console.log(`   Role:     super_admin`);
    console.log(`   ID:       ${admin._id}`);
    console.log("═══════════════════════════════════════");
    console.log("");
    console.log("🔐 LOGIN URL: http://localhost:3000/admin/login");
    console.log("");
    console.log("⚠️  IMPORTANT: Change the password after first login!");
    console.log("");
    
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedAdmin();

