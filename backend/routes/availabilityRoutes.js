// backend/routes/availabilityRoutes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { authorizeFieldOwner } from "../middleware/authorizeFieldOwner.js";
import {
  getFieldAvailability,
  updateFieldAvailability, // PDR 2.3 Phase 2
} from "../controllers/availabilityController.js";

const router = express.Router();

// GET FIELD AVAILABILITY (public - no auth required)
// GET /api/fields/:fieldId/availability?date=YYYY-MM-DD
router.get("/:fieldId/availability", getFieldAvailability);

// UPDATE FIELD AVAILABILITY (PDR 2.3 Phase 2 - Authorization required)
// PUT /api/fields/:fieldId/availability
router.put("/:fieldId/availability", auth, authorizeFieldOwner, updateFieldAvailability);

export default router;
