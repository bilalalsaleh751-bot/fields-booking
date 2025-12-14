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

import {
  getOwnerSettings,
  updateOwnerProfile,
  changeOwnerPassword,
  updateOwnerBusiness,
  updateOwnerNotifications,
} from "../controllers/ownerSettingsController.js";

import {
  getOwnerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

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

// ===============================
// 📌 OWNER SETTINGS (PDR)
// ===============================
router.get("/settings", getOwnerSettings);
router.put("/settings/profile/:ownerId", updateOwnerProfile);
router.put("/settings/password/:ownerId", changeOwnerPassword);
router.put("/settings/business/:ownerId", updateOwnerBusiness);
router.put("/settings/notifications/:ownerId", updateOwnerNotifications);

// ===============================
// 📌 NOTIFICATIONS (PDR)
// ===============================
router.get("/notifications", getOwnerNotifications);
router.put("/notifications/:notificationId/read", markNotificationRead);
router.put("/notifications/read-all", markAllNotificationsRead);

export default router;
