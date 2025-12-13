// backend/controllers/ownerReviewController.js
import mongoose from "mongoose";
import Field from "../models/Field.js";

// =================================================
// GET ALL REVIEWS FOR OWNER (PDR 2.6)
// =================================================
export const getOwnerReviews = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find all fields owned by this owner
    const fields = await Field.find({ owner: ownerObjectId });

    // Collect all reviews with field info
    const allReviews = [];
    fields.forEach((field) => {
      field.reviews.forEach((rev) => {
        allReviews.push({
          _id: rev._id || Math.random().toString(), // Generate ID if missing
          fieldId: field._id,
          fieldName: field.name,
          userName: rev.userName,
          rating: rev.rating,
          comment: rev.comment,
          response: rev.response || null,
          createdAt: rev.createdAt,
        });
      });
    });

    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      reviews: allReviews,
      count: allReviews.length,
    });
  } catch (err) {
    console.error("Get Owner Reviews Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// RESPOND TO REVIEW (PDR 2.6)
// =================================================
export const respondToReview = async (req, res) => {
  try {
    const { fieldId, userName, rating, comment, createdAt, ownerId, response } = req.body;

    if (!fieldId || !userName || !rating || !comment || !ownerId || !response) {
      return res.status(400).json({
        message: "fieldId, userName, rating, comment, ownerId, and response are required",
      });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Find field and verify ownership
    const field = await Field.findById(fieldId);

    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    if (field.owner.toString() !== ownerObjectId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Find review by matching properties
    const reviewIndex = field.reviews.findIndex(
      (r) =>
        r.userName === userName &&
        r.rating === rating &&
        r.comment === comment &&
        (!createdAt || new Date(r.createdAt).getTime() === new Date(createdAt).getTime())
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update review response
    field.reviews[reviewIndex].response = response;
    field.reviews[reviewIndex].responseDate = new Date();

    await field.save();

    res.json({
      message: "Response added successfully",
      review: {
        fieldName: field.name,
        userName: field.reviews[reviewIndex].userName,
        rating: field.reviews[reviewIndex].rating,
        comment: field.reviews[reviewIndex].comment,
        response: field.reviews[reviewIndex].response,
      },
    });
  } catch (err) {
    console.error("Respond to Review Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

