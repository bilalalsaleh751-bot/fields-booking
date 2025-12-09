// backend/routes/availabilityRoutes.js
import express from "express";
import { getFieldAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

// FINAL CORRECT ROUTE:
// GET /api/fields/:fieldId/availability?date=YYYY-MM-DD
router.get("/:fieldId/availability", getFieldAvailability);

export default router;
