import express from "express";
import { protectUser } from "../middleware/userAuth.js";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getUserBookings,
  getUserBooking,
  cancelBooking,
  addReview,
  getReceipt,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/userController.js";

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (No auth required)
// ============================================================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);

// ============================================================
// PROTECTED ROUTES (Require user auth)
// ============================================================
router.use(protectUser);

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Bookings
router.get("/bookings", getUserBookings);
router.get("/bookings/:id", getUserBooking);
router.put("/bookings/:id/cancel", cancelBooking);
router.post("/bookings/:id/review", addReview);
router.get("/bookings/:id/receipt", getReceipt);

export default router;
