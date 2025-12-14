// backend/controllers/bookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import {
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  getBookingRange,
  isValidTimeFormat,
  normalizeToHour,
  BLOCKED_SLOT_DURATION_MINUTES,
} from "../utils/timeUtils.js";

// -------------------------------------------------------------
// 1) CREATE BOOKING
// SINGLE SOURCE OF TRUTH for booking validation
// Uses ATOMIC operations to prevent race conditions
// All times treated as RANGES: [start, end) 
// -------------------------------------------------------------
export const createBooking = async (req, res) => {
  // Start a MongoDB session for atomic operations
  const session = await mongoose.startSession();
  
  try {
    const {
      fieldId,
      userName,
      userEmail,
      userPhone,
      date,
      startTime,
      duration,
    } = req.body;

    // ============================================================
    // VALIDATION LAYER (Backend is single source of truth)
    // ============================================================

    // 1️⃣ Required fields validation
    if (!fieldId || !userName || !userEmail || !userPhone || !date || !startTime || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 2️⃣ Time format validation
    if (!isValidTimeFormat(startTime)) {
      return res.status(400).json({ message: "Invalid time format. Use HH:MM" });
    }

    // 3️⃣ Duration validation
    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 12) {
      return res.status(400).json({ message: "Invalid duration. Must be between 0 and 12 hours" });
    }

    // 4️⃣ Date format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // ============================================================
    // ATOMIC BOOKING CREATION WITH RACE CONDITION PROTECTION
    // Uses MongoDB session to ensure atomicity
    // ============================================================
    
    session.startTransaction();

    try {
      // Fetch field info (within transaction)
      const field = await Field.findById(fieldId).session(session);
      if (!field) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Field not found" });
      }

      if (!field.isActive) {
        await session.abortTransaction();
        return res.status(400).json({ message: "This field is not active" });
      }

      // Calculate booking time range
      const newRange = getBookingRange(startTime, durationNum);
      
      // Validate time is within opening hours
      const openHour = parseInt(field.openingHours?.open?.split(":")[0] || "8", 10);
      const closeHour = parseInt(field.openingHours?.close?.split(":")[0] || "23", 10);
      const openMin = openHour * 60;
      const closeMin = closeHour * 60;

      if (newRange.start < openMin || newRange.end > closeMin) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Booking must be within operating hours (${openHour}:00 - ${closeHour}:00)` 
        });
      }

      // ============================================================
      // RANGE-BASED OVERLAP CHECKS
      // ============================================================

      // 5️⃣ Check if entire date is blocked
      if ((field.blockedDates || []).includes(date)) {
        await session.abortTransaction();
        return res.status(409).json({
          message: "This date is blocked and not available for booking",
        });
      }

      // 6️⃣ Check blocked time slots (30-min granularity)
      const blockedEntry = (field.blockedTimeSlots || []).find(
        (entry) => entry.date === date
      );
      if (blockedEntry?.timeSlots?.length > 0) {
        for (const blockedTime of blockedEntry.timeSlots) {
          const blockedStart = timeToMinutes(blockedTime);
          const blockedEnd = blockedStart + BLOCKED_SLOT_DURATION_MINUTES;
          
          if (timeRangesOverlap(newRange.start, newRange.end, blockedStart, blockedEnd)) {
            await session.abortTransaction();
            return res.status(409).json({
              message: "Selected time range overlaps with a blocked period",
            });
          }
        }
      }

      // 7️⃣ ATOMIC CHECK: Find any overlapping bookings
      // This query runs within the transaction to prevent race conditions
      const existingBookings = await Booking.find({
        field: fieldId,
        date,
        status: { $ne: "cancelled" },
      }).session(session);

      for (const existing of existingBookings) {
        const existingRange = getBookingRange(existing.startTime, existing.duration);
        
        if (timeRangesOverlap(newRange.start, newRange.end, existingRange.start, existingRange.end)) {
          await session.abortTransaction();
          return res.status(409).json({
            message: "Selected time range overlaps with an existing booking",
          });
        }
      }

      // ============================================================
      // CREATE BOOKING (within transaction)
      // Store as explicit time range: startTime + endTime
      // ============================================================
      
      const totalPrice = (field.pricePerHour || 0) * durationNum;
      
      // Normalize start time to hour boundary for consistency
      const normalizedStartTime = normalizeToHour(startTime);
      
      // Calculate explicit end time from start + duration
      const startMinutes = timeToMinutes(normalizedStartTime);
      const endMinutes = startMinutes + (durationNum * 60);
      const calculatedEndTime = minutesToTime(endMinutes);

      const [booking] = await Booking.create([{
        field: fieldId,
        userName,
        userEmail,
        userPhone,
        date,
        startTime: normalizedStartTime,
        endTime: calculatedEndTime, // Explicit end time for clarity
        duration: durationNum,
        totalPrice,
        status: "pending",
      }], { session });

      // Commit the transaction
      await session.commitTransaction();

      return res.status(201).json({
        message: "Booking created successfully",
        bookingId: booking._id,
      });

    } catch (txError) {
      // Abort transaction on any error
      await session.abortTransaction();
      throw txError;
    }

  } catch (err) {
    console.error("Booking error:", err);
    
    // Handle duplicate key errors (additional safety)
    if (err.code === 11000) {
      return res.status(409).json({ message: "Booking conflict. Please try again." });
    }
    
    return res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};

// -------------------------------------------------------------
// 2) GET BOOKING BY ID
// -------------------------------------------------------------
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("field");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------------------------
// 3) GET BOOKINGS FOR SPECIFIC FIELD
// -------------------------------------------------------------
export const getBookingsForField = async (req, res) => {
  try {
    const bookings = await Booking.find({
      field: req.params.fieldId,
    });

    res.json(bookings);
  } catch (err) {
    console.error("Booking fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------------------------
// 4) SEED BOOKINGS FOR OWNER (Development/Testing)
// Creates realistic booking data for dashboard testing
// -------------------------------------------------------------
export const seedBookings = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId query parameter is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find all fields owned by this owner
    const fields = await Field.find({ owner: ownerObjectId, isActive: true });

    if (fields.length === 0) {
      return res.status(404).json({
        message: "No active fields found for this owner. Please create fields first.",
      });
    }

    // Helper: Format date as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Helper: Get random time between open and close hours
    const getRandomTime = (openHour = 8, closeHour = 22) => {
      const hour = Math.floor(Math.random() * (closeHour - openHour)) + openHour;
      return `${String(hour).padStart(2, "0")}:00`;
    };

    // Helper: Calculate end time from start time and duration
    const calculateEndTime = (startTime, duration) => {
      const startHour = parseInt(startTime.split(":")[0], 10);
      const endHour = startHour + Math.ceil(duration);
      return `${String(endHour).padStart(2, "0")}:00`;
    };

    // Sample user data
    const sampleUsers = [
      { name: "Ahmed Ali", email: "ahmed.ali@example.com", phone: "+961 3 123456" },
      { name: "Sarah Khoury", email: "sarah.khoury@example.com", phone: "+961 3 234567" },
      { name: "Mohammad Fadel", email: "mohammad.fadel@example.com", phone: "+961 3 345678" },
      { name: "Layla Mansour", email: "layla.mansour@example.com", phone: "+961 3 456789" },
      { name: "Omar Nasser", email: "omar.nasser@example.com", phone: "+961 3 567890" },
      { name: "Nour Saad", email: "nour.saad@example.com", phone: "+961 3 678901" },
      { name: "Karim Youssef", email: "karim.youssef@example.com", phone: "+961 3 789012" },
      { name: "Maya Tannous", email: "maya.tannous@example.com", phone: "+961 3 890123" },
    ];

    const now = new Date();
    const bookingsToCreate = [];

    // Generate bookings for each field
    fields.forEach((field) => {
      const openHour = parseInt(field.openingHours?.open?.split(":")[0] || "8", 10);
      const closeHour = parseInt(field.openingHours?.close?.split(":")[0] || "22", 10);

      // TODAY - Confirmed bookings (2-3 bookings)
      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
        const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        const duration = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)];
        const startTime = getRandomTime(openHour, closeHour - Math.ceil(duration));
        const endTime = calculateEndTime(startTime, duration);
        const totalPrice = field.pricePerHour * duration;

        bookingsToCreate.push({
          field: field._id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          date: formatDate(now),
          startTime,
          endTime,
          duration,
          totalPrice: Math.round(totalPrice * 100) / 100,
          status: "confirmed",
        });
      }

      // UPCOMING (next 3-7 days) - Mix of confirmed and pending
      for (let day = 1; day <= 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        
        const numBookings = Math.floor(Math.random() * 3); // 0-2 bookings per day
        for (let i = 0; i < numBookings; i++) {
          const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
          const duration = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)];
          const startTime = getRandomTime(openHour, closeHour - Math.ceil(duration));
          const endTime = calculateEndTime(startTime, duration);
          const totalPrice = field.pricePerHour * duration;
          const status = Math.random() > 0.3 ? "confirmed" : "pending"; // 70% confirmed, 30% pending

          bookingsToCreate.push({
            field: field._id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            date: formatDate(date),
            startTime,
            endTime,
            duration,
            totalPrice: Math.round(totalPrice * 100) / 100,
            status,
          });
        }
      }

      // PAST (last 5 days) - Mostly confirmed, some cancelled
      for (let day = 1; day <= 5; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        
        const numBookings = Math.floor(Math.random() * 2) + 1; // 1-2 bookings per day
        for (let i = 0; i < numBookings; i++) {
          const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
          const duration = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)];
          const startTime = getRandomTime(openHour, closeHour - Math.ceil(duration));
          const endTime = calculateEndTime(startTime, duration);
          const totalPrice = field.pricePerHour * duration;
          const status = Math.random() > 0.15 ? "confirmed" : "cancelled"; // 85% confirmed, 15% cancelled

          bookingsToCreate.push({
            field: field._id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            date: formatDate(date),
            startTime,
            endTime,
            duration,
            totalPrice: Math.round(totalPrice * 100) / 100,
            status,
          });
        }
      }

      // LAST MONTH - Confirmed bookings for earnings calculation
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Generate 10-15 bookings spread across last month
      const lastMonthBookings = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < lastMonthBookings; i++) {
        const date = new Date(
          lastMonth.getTime() + 
          Math.random() * (lastMonthEnd.getTime() - lastMonth.getTime())
        );
        
        const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        const duration = [1, 1.5, 2, 2.5, 3][Math.floor(Math.random() * 5)];
        const startTime = getRandomTime(openHour, closeHour - Math.ceil(duration));
        const endTime = calculateEndTime(startTime, duration);
        const totalPrice = field.pricePerHour * duration;

        bookingsToCreate.push({
          field: field._id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          date: formatDate(date),
          startTime,
          endTime,
          duration,
          totalPrice: Math.round(totalPrice * 100) / 100,
          status: "confirmed", // All last month bookings are confirmed
        });
      }
    });

    // Insert all bookings
    const created = await Booking.insertMany(bookingsToCreate);

    res.status(201).json({
      message: "Bookings seeded successfully",
      count: created.length,
      breakdown: {
        fields: fields.length,
        today: created.filter(b => b.date === formatDate(now)).length,
        upcoming: created.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate > now && bookingDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }).length,
        past: created.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate < now;
        }).length,
        confirmed: created.filter(b => b.status === "confirmed").length,
        pending: created.filter(b => b.status === "pending").length,
        cancelled: created.filter(b => b.status === "cancelled").length,
      },
    });
  } catch (err) {
    console.error("Seed Bookings Error:", err);
    res.status(500).json({
      message: "Server error while seeding bookings",
      error: err.message,
    });
  }
};
