// backend/routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getBookingById,
  getBookingsForField,
  seedBookings, // Development/Testing
} from "../controllers/bookingController.js";

const router = express.Router();

// CREATE booking
router.post("/", createBooking);

// SEED BOOKINGS (Development/Testing)
// POST /api/bookings/seed?ownerId=...
router.post("/seed", seedBookings);

// GET booking info by ID
router.get("/:id", getBookingById);

// GET all bookings for a specific field
router.get("/field/:fieldId", getBookingsForField);

export default router;
