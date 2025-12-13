import express from "express";
import multer from "multer";
import {
  registerStep1,
  registerStep2,
  registerStep3,
  ownerLogin,
} from "../controllers/ownerController.js";

import {
  getOwnerDashboardOverview,
  getOwnerLatestReviews,
} from "../controllers/ownerDashboardController.js";

import {
  getOwnerBookings,
  getOwnerBookingById,
  updateBookingStatus,
} from "../controllers/ownerBookingController.js";

import {
  getOwnerReviews,
  respondToReview,
} from "../controllers/ownerReviewController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// STEP 1 – basic info
router.post("/register", registerStep1);

// STEP 2 – business details
router.put("/register/details/:id", registerStep2);

// STEP 3 – upload documents
router.put(
  "/register/upload/:id",
  upload.fields([
    { name: "idCard", maxCount: 1 },
    { name: "businessProof", maxCount: 1 },
  ]),
  registerStep3
);

// LOGIN
router.post("/login", ownerLogin);

// ===============================
// 📌 OWNER DASHBOARD ROUTES
// ===============================

// Overview (stats + financial + upcoming)
router.get("/dashboard/overview", getOwnerDashboardOverview);

// Latest reviews only
router.get("/dashboard/reviews", getOwnerLatestReviews);

// ===============================
// 📌 BOOKING MANAGEMENT (PDR 2.4)
// ===============================
router.get("/bookings", getOwnerBookings);
router.get("/bookings/:bookingId", getOwnerBookingById);
router.put("/bookings/:bookingId/status", updateBookingStatus);

// ===============================
// 📌 REVIEW MANAGEMENT (PDR 2.6)
// ===============================
router.get("/reviews", getOwnerReviews);
router.post("/reviews/respond", respondToReview);

export default router;
