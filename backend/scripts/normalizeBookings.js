// backend/scripts/normalizeBookings.js
// ============================================================
// DATABASE CLEANUP SCRIPT
// Normalizes old booking records to ensure range-based consistency
// Run once: node backend/scripts/normalizeBookings.js
// ============================================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ============================================================
// IMPORTANT: Import ALL models that may be referenced
// This ensures Mongoose schemas are registered before any queries
// The imports register the schemas with Mongoose even if not directly used
// ============================================================
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";    // Required for populate("field")
import Owner from "../models/Owner.js";    // May be referenced by Field

// Suppress unused variable warnings - these imports register Mongoose schemas
void Field;
void Owner;

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fields-booking";

// Helper: Convert time string to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hour, minutes = "0"] = timeStr.split(":");
  const h = parseInt(hour, 10);
  const m = parseInt(minutes, 10);
  if (isNaN(h)) return null;
  return h * 60 + m;
};

// Helper: Convert minutes to time string
const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Helper: Check if two ranges overlap
const rangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

async function normalizeBookings() {
  console.log("🔄 Starting booking normalization...\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Fetch all bookings
    const allBookings = await Booking.find({}).populate("field", "name");
    console.log(`📊 Total bookings found: ${allBookings.length}\n`);

    let normalized = 0;
    let skipped = 0;
    let errors = 0;
    let overlapsDetected = [];

    for (const booking of allBookings) {
      try {
        // 1. Validate startTime format
        const startMin = timeToMinutes(booking.startTime);
        if (startMin === null) {
          console.log(`⚠️  Invalid startTime: ${booking._id} - "${booking.startTime}"`);
          errors++;
          continue;
        }

        // 2. Normalize startTime to HH:00 format (round down to nearest hour)
        const normalizedStartMin = Math.floor(startMin / 60) * 60;
        const normalizedStartTime = minutesToTime(normalizedStartMin);

        // 3. Validate duration
        let duration = Number(booking.duration);
        if (isNaN(duration) || duration <= 0) {
          console.log(`⚠️  Invalid duration: ${booking._id} - "${booking.duration}", defaulting to 1`);
          duration = 1;
        }

        // 4. Calculate end time (for reference)
        const endMin = normalizedStartMin + (duration * 60);

        // 5. Update if needed
        let needsUpdate = false;
        const updates = {};

        if (booking.startTime !== normalizedStartTime) {
          updates.startTime = normalizedStartTime;
          needsUpdate = true;
          console.log(`  📝 Normalizing startTime: "${booking.startTime}" → "${normalizedStartTime}"`);
        }

        if (booking.duration !== duration) {
          updates.duration = duration;
          needsUpdate = true;
          console.log(`  📝 Normalizing duration: "${booking.duration}" → "${duration}"`);
        }

        if (needsUpdate) {
          await Booking.updateOne({ _id: booking._id }, { $set: updates });
          normalized++;
        } else {
          skipped++;
        }

      } catch (err) {
        console.log(`❌ Error processing booking ${booking._id}: ${err.message}`);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 NORMALIZATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Normalized: ${normalized}`);
    console.log(`⏭️  Skipped (already valid): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    // 6. Detect overlapping bookings (informational only)
    console.log("\n🔍 Checking for overlapping bookings...\n");

    // Group by field and date
    const bookingsByFieldDate = {};
    for (const b of allBookings) {
      const key = `${b.field?._id || b.field}:${b.date}`;
      if (!bookingsByFieldDate[key]) {
        bookingsByFieldDate[key] = [];
      }
      bookingsByFieldDate[key].push(b);
    }

    for (const [key, bookings] of Object.entries(bookingsByFieldDate)) {
      if (bookings.length < 2) continue;

      // Check each pair
      for (let i = 0; i < bookings.length; i++) {
        for (let j = i + 1; j < bookings.length; j++) {
          const a = bookings[i];
          const b = bookings[j];

          // Skip cancelled bookings
          if (a.status === "cancelled" || b.status === "cancelled") continue;

          const aStart = timeToMinutes(a.startTime);
          const aEnd = aStart + (Number(a.duration) || 1) * 60;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = bStart + (Number(b.duration) || 1) * 60;

          if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
            overlapsDetected.push({
              field: a.field?.name || a.field,
              date: a.date,
              booking1: { id: a._id, time: a.startTime, duration: a.duration, status: a.status },
              booking2: { id: b._id, time: b.startTime, duration: b.duration, status: b.status },
            });
          }
        }
      }
    }

    if (overlapsDetected.length > 0) {
      console.log("⚠️  OVERLAPPING BOOKINGS DETECTED:");
      console.log("=".repeat(50));
      for (const overlap of overlapsDetected) {
        console.log(`\n  Field: ${overlap.field}`);
        console.log(`  Date: ${overlap.date}`);
        console.log(`  Booking 1: ${overlap.booking1.time} (${overlap.booking1.duration}hr) [${overlap.booking1.status}] - ID: ${overlap.booking1.id}`);
        console.log(`  Booking 2: ${overlap.booking2.time} (${overlap.booking2.duration}hr) [${overlap.booking2.status}] - ID: ${overlap.booking2.id}`);
      }
      console.log("\n⚠️  Manual review required for overlapping bookings.");
      console.log("   Consider cancelling one of each pair.");
    } else {
      console.log("✅ No overlapping bookings detected.");
    }

    console.log("\n✅ Normalization complete!\n");

  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

normalizeBookings();

