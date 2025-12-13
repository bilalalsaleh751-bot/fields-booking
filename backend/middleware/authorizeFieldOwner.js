// backend/middleware/authorizeFieldOwner.js
import mongoose from "mongoose";
import Field from "../models/Field.js";

/**
 * Middleware to authorize field owner
 * Verifies that the authenticated user owns the field being accessed
 * 
 * Requirements:
 * - req.user must be set by auth middleware (contains id)
 * - req.params.fieldId or req.params.id must contain the field ID
 * 
 * Returns 403 if user is not the owner
 * Returns 404 if field doesn't exist
 */
export const authorizeFieldOwner = async (req, res, next) => {
  try {
    // Get authenticated user from req.user (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Get fieldId from params (support both :fieldId and :id)
    const fieldId = req.params.fieldId || req.params.id;

    if (!fieldId) {
      return res.status(400).json({
        message: "Field ID is required",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        message: "Invalid field ID format",
      });
    }

    // Fetch the field
    const field = await Field.findById(fieldId);

    if (!field) {
      return res.status(404).json({
        message: "Field not found",
      });
    }

    // Verify ownership - compare field.owner with req.user.id
    const ownerId = field.owner.toString();
    const userId = req.user.id.toString();

    if (ownerId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to perform this action on this field",
      });
    }

    // Attach field to request for use in controllers
    req.field = field;
    next();
  } catch (err) {
    console.error("Authorization Error:", err);
    res.status(500).json({
      message: "Server error during authorization",
    });
  }
};

