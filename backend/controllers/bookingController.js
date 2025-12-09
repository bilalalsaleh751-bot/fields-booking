// backend/controllers/bookingController.js
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

// 1. CREATE BOOKING
export const createBooking = async (req, res) => {
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

    if (
      !fieldId ||
      !userName ||
      !userEmail ||
      !userPhone ||
      !date ||
      !startTime ||
      !duration
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch field price
    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    const totalPrice = (field.pricePerHour || 0) * duration;

    // Prevent double booking on same startTime
    const existing = await Booking.findOne({
      field: fieldId,
      date,
      startTime,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked" });
    }

    const booking = await Booking.create({
      field: fieldId,
      userName,
      userEmail,
      userPhone,
      date,
      startTime,
      duration,
      totalPrice,
    });

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. GET BOOKING BY ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("field");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. GET BOOKINGS FOR A FIELD (raw list)
export const getBookingsForField = async (req, res) => {
  try {
    const bookings = await Booking.find({
      field: req.params.fieldId,
    });

    res.json(bookings);
  } catch (err) {
    console.error("Get bookings for field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
