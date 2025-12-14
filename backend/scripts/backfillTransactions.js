/**
 * BACKFILL TRANSACTIONS SCRIPT
 * Creates Transaction records for existing completed bookings
 * 
 * Usage: node scripts/backfillTransactions.js
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
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import Owner from "../models/Owner.js";
import Transaction from "../models/Transaction.js";
import PlatformSettings from "../models/PlatformSettings.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fields-booking";

async function backfillTransactions() {
  console.log("🔌 Connecting to MongoDB...");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Get platform settings for commission rate
    const settings = await PlatformSettings.getSettings();
    const commissionRate = settings.commissionRate || 15;
    console.log(`📊 Using commission rate: ${commissionRate}%`);
    
    // Find all completed bookings
    const completedBookings = await Booking.find({ status: "completed" })
      .populate({
        path: "field",
        select: "name owner",
        populate: { path: "owner", select: "fullName" }
      });
    
    console.log(`📋 Found ${completedBookings.length} completed bookings`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const booking of completedBookings) {
      try {
        // Check if transaction already exists (idempotency)
        const existing = await Transaction.findOne({ bookingId: booking._id });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        if (!booking.field) {
          console.log(`⚠️  Skipping booking ${booking._id}: No field reference`);
          errors++;
          continue;
        }
        
        const commissionAmount = (booking.totalPrice * commissionRate) / 100;
        const netToOwner = booking.totalPrice - commissionAmount;
        
        await Transaction.create({
          bookingId: booking._id,
          fieldId: booking.field._id,
          ownerId: booking.field.owner?._id || booking.field.owner,
          userName: booking.userName,
          userEmail: booking.userEmail,
          userPhone: booking.userPhone,
          amountGross: booking.totalPrice,
          commissionRate,
          commissionAmount,
          netToOwner,
          status: "completed",
          bookingDate: booking.date,
          bookingStartTime: booking.startTime,
          bookingEndTime: booking.endTime,
          fieldName: booking.field.name,
        });
        
        created++;
      } catch (err) {
        console.log(`❌ Error processing booking ${booking._id}:`, err.message);
        errors++;
      }
    }
    
    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("BACKFILL COMPLETE");
    console.log("═══════════════════════════════════════");
    console.log(`   ✅ Created:  ${created}`);
    console.log(`   ⏭️  Skipped:  ${skipped} (already exist)`);
    console.log(`   ❌ Errors:   ${errors}`);
    console.log("═══════════════════════════════════════");
    console.log("");
    
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

backfillTransactions();

