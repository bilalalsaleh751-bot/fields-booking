// backend/routes/fieldRoutes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { authorizeFieldOwner } from "../middleware/authorizeFieldOwner.js";
import { upload } from "../utils/upload.js";
import {
  searchFields,
  getFieldById,
  addFieldReview,
  getFieldReviews,
  seedFields,
  createField,
  getFieldsByOwner, // PDR 2.3 Phase 1
  updateField, // PDR 2.3 Phase 2
  uploadFieldImages, // PDR 2.3 Phase 2
  getFieldImages, // PDR 2.3 Phase 2
  deleteFieldImage, // PDR 2.3 Phase 2
  activateField, // PDR 2.3 Phase 2
  deactivateField, // PDR 2.3 Phase 2
} from "../controllers/fieldController.js";

import {
  blockFieldDates,
  unblockFieldDates,
  blockFieldTimeSlots,
  unblockFieldTimeSlots,
  getFieldBlockedAvailability,
} from "../controllers/fieldAvailabilityController.js";

const router = express.Router();

// =================================================
// CREATE FIELD (PDR 2.3 Phase 1 - Field Management)
// =================================================
router.post("/", createField);

// =================================================
// GET FIELDS BY OWNER (PDR 2.3 Phase 1)
// =================================================
router.get("/", getFieldsByOwner);

// =================================================
// SEED PDR FIELDS (dev only)
// =================================================
router.post("/seed", seedFields);

// =================================================
// SEARCH FIELDS (used by Discover)
// =================================================
router.get("/search", searchFields);

// =================================================
// GET ONE FIELD DETAILS
// =================================================
router.get("/:id", getFieldById);

// =================================================
// REVIEWS
// =================================================
router.post("/:id/reviews", addFieldReview);
router.get("/:id/reviews", getFieldReviews);

// =================================================
// FIELD MODIFICATION ROUTES (PDR 2.3 Phase 2 - Authorization)
// All routes require authentication and field ownership verification
// =================================================

// UPDATE FIELD
router.put("/:id", auth, authorizeFieldOwner, updateField);

// GET FIELD IMAGES (public - no auth required)
router.get("/:id/images", getFieldImages);

// UPLOAD FIELD IMAGES (owner only)
router.post(
  "/:id/images",
  auth,
  authorizeFieldOwner,
  upload.array("images", 10),
  uploadFieldImages
);

// DELETE FIELD IMAGE (owner only)
router.delete("/:id/images", auth, authorizeFieldOwner, deleteFieldImage);

// ACTIVATE FIELD
router.post("/:id/activate", auth, authorizeFieldOwner, activateField);

// DEACTIVATE FIELD
router.post("/:id/deactivate", auth, authorizeFieldOwner, deactivateField);

// =================================================
// AVAILABILITY BLOCKING (PDR 2.3)
// =================================================
router.get("/:id/blocked", auth, authorizeFieldOwner, getFieldBlockedAvailability);
router.post("/:id/block-dates", auth, authorizeFieldOwner, blockFieldDates);
router.post("/:id/unblock-dates", auth, authorizeFieldOwner, unblockFieldDates);
router.post("/:id/block-slots", auth, authorizeFieldOwner, blockFieldTimeSlots);
router.post("/:id/unblock-slots", auth, authorizeFieldOwner, unblockFieldTimeSlots);

export default router;
