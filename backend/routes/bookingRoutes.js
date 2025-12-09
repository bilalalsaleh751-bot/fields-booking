// backend/routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getBookingById,
  getBookingsForField,
} from "../controllers/bookingController.js";

const router = express.Router();

// CREATE booking
router.post("/", createBooking);

// GET booking info by ID
router.get("/:id", getBookingById);

// GET all bookings for a specific field
router.get("/field/:fieldId", getBookingsForField);

export default router;
