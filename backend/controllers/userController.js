import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ============================================================
// AUTH: REGISTER
// ============================================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone: phone || "",
      password: hashed,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "jwtsecret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// AUTH: LOGIN
// ============================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "jwtsecret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// PROFILE: GET
// ============================================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// PROFILE: UPDATE
// ============================================================
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// BOOKINGS: GET USER BOOKINGS
// ============================================================
export const getUserBookings = async (req, res) => {
  try {
    const { status, type } = req.query; // type: upcoming, past, all
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Find bookings by user ID or email (for backwards compatibility)
    const query = {
      $or: [{ user: userId }, { userEmail: userEmail }],
    };

    if (status) {
      query.status = status;
    }

    let bookings = await Booking.find(query)
      .populate({
        path: "field",
        select: "name city area address pricePerHour images mainImage owner",
      })
      .sort({ date: -1, startTime: -1 });

    // Filter by type (upcoming or past)
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (type === "upcoming") {
      bookings = bookings.filter((b) => {
        if (b.status === "cancelled") return false;
        if (b.date > today) return true;
        if (b.date === today && b.startTime > currentTime) return true;
        return false;
      });
      // Sort upcoming by ascending date
      bookings.sort((a, b) => {
        if (a.date === b.date) return a.startTime.localeCompare(b.startTime);
        return a.date.localeCompare(b.date);
      });
    } else if (type === "past") {
      bookings = bookings.filter((b) => {
        if (b.date < today) return true;
        if (b.date === today && b.endTime <= currentTime) return true;
        return false;
      });
    }

    res.json({ bookings });
  } catch (err) {
    console.error("Get user bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// BOOKINGS: GET SINGLE BOOKING
// ============================================================
export const getUserBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "field",
      select: "name city area address pricePerHour images mainImage owner openingHours",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    const isOwner =
      booking.user?.toString() === req.user._id.toString() ||
      booking.userEmail === req.user.email;

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json({ booking });
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// BOOKINGS: CANCEL
// ============================================================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    const isOwner =
      booking.user?.toString() === req.user._id.toString() ||
      booking.userEmail === req.user.email;

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    // Check if booking is in the future
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const isFuture =
      booking.date > today || (booking.date === today && booking.startTime > currentTime);

    if (!isFuture) {
      return res.status(400).json({ message: "Cannot cancel past or ongoing bookings" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REVIEWS: ADD REVIEW TO BOOKING
// ============================================================
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(req.params.id).populate("field");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    const isOwner =
      booking.user?.toString() === req.user._id.toString() ||
      booking.userEmail === req.user.email;

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to review this booking" });
    }

    // Check if booking is completed (in the past)
    const today = new Date().toISOString().split("T")[0];
    const isPast = booking.date < today;

    if (!isPast) {
      return res.status(400).json({ message: "Can only review completed bookings" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot review cancelled bookings" });
    }

    if (booking.review?.rating) {
      return res.status(400).json({ message: "Booking already reviewed" });
    }

    // Add review to booking
    booking.review = {
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date(),
    };
    await booking.save();

    // Also add review to field
    if (booking.field) {
      const field = await Field.findById(booking.field._id || booking.field);
      if (field) {
        field.reviews = field.reviews || [];
        field.reviews.push({
          rating: Number(rating),
          comment: comment || "",
          userName: booking.userName,
          createdAt: new Date(),
        });
        field.reviewCount = field.reviews.length;
        field.averageRating =
          field.reviews.reduce((sum, r) => sum + r.rating, 0) / field.reviews.length;
        await field.save();
      }
    }

    res.json({ message: "Review added successfully", booking });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// RECEIPT: GENERATE RECEIPT DATA
// ============================================================
export const getReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "field",
      select: "name city area address pricePerHour owner",
      populate: { path: "owner", select: "fullName businessName email phone" },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    const isOwner =
      booking.user?.toString() === req.user._id.toString() ||
      booking.userEmail === req.user.email;

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Generate receipt data
    const receipt = {
      receiptNumber: `RCP-${booking._id.toString().slice(-8).toUpperCase()}`,
      bookingId: booking._id,
      date: booking.date,
      time: `${booking.startTime} - ${booking.endTime}`,
      duration: booking.duration,
      field: {
        name: booking.field?.name,
        address: `${booking.field?.city}, ${booking.field?.area}`,
        owner: booking.field?.owner?.businessName || booking.field?.owner?.fullName,
      },
      customer: {
        name: booking.userName,
        email: booking.userEmail,
        phone: booking.userPhone,
      },
      payment: {
        subtotal: booking.totalPrice,
        total: booking.totalPrice,
        status: booking.paymentStatus || "paid",
      },
      status: booking.status,
      createdAt: booking.createdAt,
    };

    res.json({ receipt });
  } catch (err) {
    console.error("Get receipt error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
