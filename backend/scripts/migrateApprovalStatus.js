/**
 * MIGRATE APPROVAL STATUS SCRIPT
 * Sets approvalStatus for existing fields and owners that don't have one
 * 
 * Usage: node scripts/migrateApprovalStatus.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Import models
import Field from "../models/Field.js";
import Owner from "../models/Owner.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fields-booking";

async function migrateApprovalStatus() {
  console.log("🔌 Connecting to MongoDB...");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // ============================================
    // MIGRATE FIELDS
    // ============================================
    console.log("\n📋 Migrating Fields...");
    
    // Find fields without approvalStatus or with null/undefined
    const fieldsWithoutStatus = await Field.find({
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: null },
        { approvalStatus: "" }
      ]
    });
    
    console.log(`   Found ${fieldsWithoutStatus.length} fields without approvalStatus`);
    
    let fieldsUpdated = 0;
    for (const field of fieldsWithoutStatus) {
      // If field is active and was created before admin system, assume approved
      const status = field.isActive ? "approved" : "pending";
      
      await Field.findByIdAndUpdate(field._id, {
        $set: { approvalStatus: status }
      });
      fieldsUpdated++;
    }
    
    console.log(`   ✅ Updated ${fieldsUpdated} fields`);
    
    // ============================================
    // MIGRATE OWNERS
    // ============================================
    console.log("\n📋 Migrating Owners...");
    
    // Find owners with old status values
    const ownersToUpdate = await Owner.find({
      status: { $in: ["incomplete", ""] }
    });
    
    console.log(`   Found ${ownersToUpdate.length} owners with incomplete status`);
    
    // Note: We don't auto-approve these, just leave them as-is
    // They need to complete registration
    
    // ============================================
    // SUMMARY
    // ============================================
    const totalFields = await Field.countDocuments();
    const approvedFields = await Field.countDocuments({ approvalStatus: "approved" });
    const pendingFields = await Field.countDocuments({ approvalStatus: "pending" });
    
    const totalOwners = await Owner.countDocuments();
    const approvedOwners = await Owner.countDocuments({ status: "approved" });
    const pendingOwners = await Owner.countDocuments({ status: { $in: ["pending", "pending_review"] } });
    
    console.log("\n═══════════════════════════════════════");
    console.log("MIGRATION COMPLETE");
    console.log("═══════════════════════════════════════");
    console.log(`   Fields: ${totalFields} total`);
    console.log(`      - Approved: ${approvedFields}`);
    console.log(`      - Pending: ${pendingFields}`);
    console.log(`   Owners: ${totalOwners} total`);
    console.log(`      - Approved: ${approvedOwners}`);
    console.log(`      - Pending: ${pendingOwners}`);
    console.log("═══════════════════════════════════════");
    console.log("");
    
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

migrateApprovalStatus();

