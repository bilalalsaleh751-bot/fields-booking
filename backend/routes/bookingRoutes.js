// backend/routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getFieldBookingsForDay,
} from "../controllers/bookingController.js";

const router = express.Router();

// CREATE BOOKING
router.post("/", createBooking);

// GET BOOKINGS FOR FIELD IN A DAY
router.get("/field/:fieldId", getFieldBookingsForDay);

export default router;
