// backend/routes/fieldRoutes.js
import express from "express";
import {
  searchFields,
  getFieldById,
  addFieldReview,
  getFieldReviews,
  seedFields,
} from "../controllers/fieldController.js";

const router = express.Router();

// SEED PDR FIELDS (dev only)
router.post("/seed", seedFields);

// SEARCH FIELDS (used by Discover)
router.get("/search", searchFields);

// GET ONE FIELD DETAILS
router.get("/:id", getFieldById);

// REVIEWS
router.post("/:id/reviews", addFieldReview);
router.get("/:id/reviews", getFieldReviews);

export default router;
