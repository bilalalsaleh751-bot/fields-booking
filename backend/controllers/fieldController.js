// backend/controllers/fieldController.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Field from "../models/Field.js";
import { createNotification } from "./notificationController.js";

/* =========================================================
   CREATE FIELD (PDR 2.3 Phase 1 - Field Management)
========================================================= */
export const createField = async (req, res) => {
  try {
    const {
      ownerId,
      name,
      description,
      sportType,
      pricePerHour,
      // Legacy fields (optional for Phase 1)
      sport,
      city,
      area,
      address,
      currency,
      isIndoor,
      surfaceType,
      maxPlayers,
      amenities,
      rules,
      openingHours,
      location,
      images,
      mainImage,
      allowedDurations, // PDR 2.3 - Added to fix ReferenceError
    } = req.body;

    // PDR 2.3 Phase 1 validation - only required fields
    if (!ownerId || !name || !sportType || pricePerHour === undefined || pricePerHour === null) {
      return res.status(400).json({
        message: "ownerId, name, sportType and pricePerHour are required",
      });
    }

    // Validate pricePerHour is a number
    const price = Number(pricePerHour);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        message: "pricePerHour must be a valid positive number",
      });
    }

    // Parse location coordinates (convert strings to numbers)
    let parsedLocation = null;
    if (location && (location.lat || location.lng)) {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      // Only set location if both coordinates are valid numbers
      if (!isNaN(lat) && !isNaN(lng)) {
        parsedLocation = { lat, lng };
      }
    }

    const field = await Field.create({
      owner: ownerId,
      name,
      description: description || "",
      sportType, // PDR 2.3 Phase 1
      sport: sportType || sport, // Backward compatibility
      pricePerHour: price,
      // Optional legacy fields
      city: city || "",
      area: area || "",
      address: address || "",
      currency: currency || "USD",
      isIndoor: Boolean(isIndoor),
      surfaceType: surfaceType || "",
      maxPlayers: maxPlayers || null,
      amenities: amenities || [],
      rules: rules || [],
      openingHours: openingHours || { open: "08:00", close: "23:00" },
      location: parsedLocation,
      images: images || [],
      mainImage: mainImage || "",
      allowedDurations: allowedDurations || [1, 1.5, 2, 3],
      blockedDates: [],
      blockedTimeSlots: [],
      isActive: true, // Explicitly set to ensure visibility in Discover
    });

    res.status(201).json({
      message: "Field created successfully",
      field,
    });
  } catch (err) {
    console.error("Create Field Error:", err.message);
    res.status(500).json({
      message: "Server error while creating field",
    });
  }
};

/* =========================================================
   GET FIELDS BY OWNER (PDR 2.3 Phase 1)
   - EXCLUDES blocked fields from Owner Dashboard
   - Owner cannot manage or edit blocked fields
========================================================= */
export const getFieldsByOwner = async (req, res) => {
  try {
    const { ownerId, includeBlocked } = req.query;

    if (!ownerId) {
      return res.status(400).json({
        message: "ownerId query parameter is required",
      });
    }

    // Convert ownerId to ObjectId for proper querying
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Build query - exclude blocked fields unless explicitly requested (admin use)
    const query = { owner: ownerObjectId };
    
    // By default, exclude blocked fields from Owner Dashboard
    // Blocked fields should NOT appear in Owner's field list
    if (includeBlocked !== "true") {
      query.approvalStatus = { $nin: ["blocked"] };
    }

    const fields = await Field.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: fields.length,
      fields,
    });
  } catch (err) {
    console.error("Error fetching owner fields:", err);
    res.status(500).json({
      message: "Server error while fetching fields",
    });
  }
};

/* =========================================================
   SEARCH FIELDS
========================================================= */
export const searchFields = async (req, res) => {
  try {
    const {
      sport,
      city,
      min,
      max,
      minRating,
      isIndoor,
      surfaceType,
      amenities,
      owner,
      sortBy,
      date,
      time,
    } = req.query;

    // Only show fields that are BOTH active AND approved by admin
    const query = { 
      isActive: true,
      approvalStatus: "approved" // CRITICAL: Only show admin-approved fields
    };

    if (sport) query.sport = sport;
    if (city) query.city = city;

    if (min || max) {
      query.pricePerHour = {};
      if (min) query.pricePerHour.$gte = Number(min);
      if (max) query.pricePerHour.$lte = Number(max);
    }

    if (minRating) {
      const r = Number(minRating);
      if (!isNaN(r) && r > 0) {
        query.averageRating = { $gte: r };
      }
    }

    if (isIndoor === "true") query.isIndoor = true;
    if (isIndoor === "false") query.isIndoor = false;

    if (surfaceType) query.surfaceType = surfaceType;

    let amenitiesArr = [];
    if (amenities) {
      if (Array.isArray(amenities)) {
        amenitiesArr = amenities.flatMap((a) => String(a).split(","));
      } else {
        amenitiesArr = String(amenities).split(",");
      }
      amenitiesArr = amenitiesArr.map((a) => a.trim()).filter(Boolean);
      if (amenitiesArr.length > 0) {
        query.amenities = { $all: amenitiesArr };
      }
    }

    let sortOption = {};
    switch (sortBy) {
      case "price_low":
        sortOption = { pricePerHour: 1 };
        break;
      case "price_high":
        sortOption = { pricePerHour: -1 };
        break;
      case "rating":
      default:
        sortOption = { averageRating: -1, reviewCount: -1 };
    }

    const fields = await Field.find(query).sort(sortOption).lean();

    res.json({
      results: fields.length,
      fields,
    });
  } catch (err) {
    console.error("Search Fields Error:", err.message);
    res.status(500).json({ message: "Server error while searching fields" });
  }
};

/* =========================================================
   GET FIELD BY ID
========================================================= */
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).lean();
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    // Block public access to inactive or non-approved fields
    if (field.isActive === false || (field.approvalStatus && field.approvalStatus !== "approved")) {
      return res.status(404).json({ message: "Field not found or not available" });
    }
    res.json(field);
  } catch (err) {
    console.error("Error fetching field:", err);
    res.status(500).json({ message: "Server error while fetching field" });
  }
};

/* =========================================================
   REVIEWS
========================================================= */
export const addFieldReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, user, userName } = req.body;

    // Support both 'user' and 'userName' for backward compatibility
    const reviewerName = userName || user || "Anonymous";

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Comment is required",
      });
    }

    const field = await Field.findById(id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Use 'userName' to match the schema
    field.reviews.push({
      rating: numericRating,
      comment: comment.trim(),
      userName: reviewerName,
      createdAt: new Date(),
    });

    field.reviewCount = field.reviews.length;
    field.averageRating =
      field.reviews.reduce((s, r) => s + r.rating, 0) / field.reviewCount;

    await field.save();

    // Trigger notification for new review
    if (field.owner) {
      await createNotification(
        field.owner,
        "review",
        `New ${numericRating}-star review on ${field.name} from ${reviewerName}`,
        null,
        field._id
      );
    }

    res.status(201).json({
      message: "Review added successfully",
      averageRating: field.averageRating,
      reviewCount: field.reviewCount,
      review: field.reviews[field.reviews.length - 1], // Return the new review
    });
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Server error while adding review" });
  }
};

export const getFieldReviews = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).lean();
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({
      fieldId: field._id,
      averageRating: field.averageRating || 0,
      reviewCount: field.reviewCount || 0,
      reviews: field.reviews || [],
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

export const seedFields = async (req, res) => {
  try {
    const created = await Field.insertMany([]);
    res.status(201).json({
      message: "Fields seeded successfully",
      count: created.length,
    });
  } catch (err) {
    console.error("Error seeding fields:", err);
    res.status(500).json({ message: "Server error while seeding fields" });
  }
};

/* =========================================================
   UPDATE FIELD (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const updateField = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;

    const {
      name,
      description,
      sportType,
      pricePerHour,
      city,
      area,
      address,
      currency,
      isIndoor,
      surfaceType,
      maxPlayers,
      amenities,
      rules,
      openingHours,
      location,
      allowedDurations,
      blockedDates,
      blockedTimeSlots,
    } = req.body;

    // Update allowed fields
    if (name !== undefined) field.name = name;
    if (description !== undefined) field.description = description;
    if (sportType !== undefined) {
      field.sportType = sportType;
      field.sport = sportType; // Backward compatibility
    }
    if (pricePerHour !== undefined) {
      const price = Number(pricePerHour);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          message: "pricePerHour must be a valid positive number",
        });
      }
      field.pricePerHour = price;
    }
    if (city !== undefined) field.city = city;
    if (area !== undefined) field.area = area;
    if (address !== undefined) field.address = address;
    if (currency !== undefined) field.currency = currency;
    if (isIndoor !== undefined) field.isIndoor = Boolean(isIndoor);
    if (surfaceType !== undefined) field.surfaceType = surfaceType;
    if (maxPlayers !== undefined) field.maxPlayers = maxPlayers;
    if (amenities !== undefined) field.amenities = amenities;
    if (rules !== undefined) field.rules = rules;
    if (openingHours !== undefined) field.openingHours = openingHours;
    
    // Parse location coordinates (convert strings to numbers)
    if (location !== undefined) {
      if (location && (location.lat || location.lng)) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          field.location = { lat, lng };
        } else {
          field.location = null;
        }
      } else {
        field.location = null;
      }
    }
    if (allowedDurations !== undefined) {
      // Validate allowedDurations is an array of numbers
      if (Array.isArray(allowedDurations)) {
        field.allowedDurations = allowedDurations.filter(d => !isNaN(Number(d)) && Number(d) > 0).map(d => Number(d));
      }
    }
    if (blockedDates !== undefined) {
      field.blockedDates = Array.isArray(blockedDates) ? blockedDates : [];
    }
    if (blockedTimeSlots !== undefined) {
      field.blockedTimeSlots = Array.isArray(blockedTimeSlots) ? blockedTimeSlots : [];
    }

    await field.save();

    res.json({
      message: "Field updated successfully",
      field,
    });
  } catch (err) {
    console.error("Update Field Error:", err);
    res.status(500).json({
      message: "Server error while updating field",
    });
  }
};

/* =========================================================
   UPLOAD FIELD IMAGES (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const uploadFieldImages = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;

    // Handle file uploads (req.files is an array when using upload.array())
    const uploadedFiles = req.files || [];
    
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        message: "No images provided",
      });
    }

    // Extract file paths (normalize path separators for URLs)
    const imagePaths = uploadedFiles.map((file) => file.path.replace(/\\/g, "/"));

    // Append new images to existing ones
    field.images = [...(field.images || []), ...imagePaths];

    // Set first image as mainImage if mainImage is not set
    if (!field.mainImage && field.images.length > 0) {
      field.mainImage = field.images[0];
    }

    await field.save();

    res.json({
      message: "Images uploaded successfully",
      field: {
        _id: field._id,
        mainImage: field.mainImage,
        images: field.images,
      },
    });
  } catch (err) {
    console.error("Upload Images Error:", err);
    res.status(500).json({
      message: "Server error while uploading images",
    });
  }
};

/* =========================================================
   GET FIELD IMAGES (PDR 2.3 Phase 2)
========================================================= */
export const getFieldImages = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id).select("mainImage images").lean();
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({
      fieldId: field._id,
      mainImage: field.mainImage || null,
      images: field.images || [],
    });
  } catch (err) {
    console.error("Get Field Images Error:", err);
    res.status(500).json({
      message: "Server error while fetching images",
    });
  }
};

/* =========================================================
   DELETE FIELD IMAGE (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const deleteFieldImage = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        message: "imagePath is required",
      });
    }

    // Remove image from images array
    field.images = (field.images || []).filter((img) => img !== imagePath);

    // If deleted image was mainImage, set first remaining image as mainImage
    if (field.mainImage === imagePath) {
      field.mainImage = field.images.length > 0 ? field.images[0] : null;
    }

    await field.save();

    // Try to delete the actual file from disk
    try {
      const filePath = path.resolve(imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      // Silent fail - file may not exist
    }

    res.json({
      message: "Image deleted successfully",
      field: {
        _id: field._id,
        mainImage: field.mainImage,
        images: field.images,
      },
    });
  } catch (err) {
    console.error("Delete Field Image Error:", err);
    res.status(500).json({
      message: "Server error while deleting image",
    });
  }
};

/* =========================================================
   ACTIVATE FIELD (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const activateField = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;

    field.isActive = true;
    await field.save();

    res.json({
      message: "Field activated successfully",
      field: {
        _id: field._id,
        name: field.name,
        isActive: field.isActive,
      },
    });
  } catch (err) {
    console.error("Activate Field Error:", err);
    res.status(500).json({
      message: "Server error while activating field",
    });
  }
};

/* =========================================================
   DEACTIVATE FIELD (PDR 2.3 Phase 2 - Authorization)
   Note: authorizeFieldOwner middleware ensures req.field is set
========================================================= */
export const deactivateField = async (req, res) => {
  try {
    // Field is already verified and attached by authorizeFieldOwner middleware
    const field = req.field;

    field.isActive = false;
    await field.save();

    res.json({
      message: "Field deactivated successfully",
      field: {
        _id: field._id,
        name: field.name,
        isActive: field.isActive,
      },
    });
  } catch (err) {
    console.error("Deactivate Field Error:", err);
    res.status(500).json({
      message: "Server error while deactivating field",
    });
  }
};

