import Field from "../models/Field.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

// ============================================================
// HELPER: Create activity log
// ============================================================
const logActivity = async (adminId, action, entityType, entityId, before, after, req) => {
  try {
    await ActivityLog.create({
      adminId,
      action,
      entityType,
      entityId,
      before,
      after,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Failed to create activity log:", err);
  }
};

// ============================================================
// LIST ALL FIELDS
// ============================================================
export const listFields = async (req, res) => {
  try {
    const { approvalStatus, isActive, search, ownerId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (ownerId) {
      query.owner = ownerId;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { area: { $regex: search, $options: "i" } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [fields, total] = await Promise.all([
      Field.find(query)
        .populate("owner", "fullName email businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Field.countDocuments(query),
    ]);
    
    res.json({
      fields,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("List fields error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET SINGLE FIELD
// ============================================================
export const getField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id)
      .populate("owner", "fullName email businessName phone");
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    res.json({ field });
  } catch (err) {
    console.error("Get field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// APPROVE FIELD
// ============================================================
export const approveField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    const before = { approvalStatus: field.approvalStatus };
    
    // Use findByIdAndUpdate to avoid validation issues - RETURN the updated document
    const updatedField = await Field.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: "approved", isActive: true }, $unset: { blockReason: 1 } },
      { new: true, runValidators: false }
    ).populate("owner", "fullName email businessName");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "approve_field",
      "field",
      field._id,
      before,
      { approvalStatus: "approved" },
      req
    );
    
    // Notify owner
    try {
      await Notification.create({
        owner: field.owner,
        type: "field_approved",
        message: `Your field "${field.name}" has been approved and is now visible to users.`,
        relatedField: field._id,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED field document
    res.json({ message: "Field approved successfully", field: updatedField });
  } catch (err) {
    console.error("Approve field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REJECT FIELD
// ============================================================
export const rejectField = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    const before = { approvalStatus: field.approvalStatus };
    const blockReason = reason || "Field rejected by admin";
    
    // Use findByIdAndUpdate to avoid validation issues - RETURN the updated document
    const updatedField = await Field.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: "rejected", blockReason } },
      { new: true, runValidators: false }
    ).populate("owner", "fullName email businessName");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "reject_field",
      "field",
      field._id,
      before,
      { approvalStatus: "rejected", reason: blockReason },
      req
    );
    
    // Notify owner
    try {
      await Notification.create({
        owner: field.owner,
        type: "field_rejected",
        message: `Your field "${field.name}" was rejected. Reason: ${blockReason}`,
        relatedField: field._id,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED field document
    res.json({ message: "Field rejected", field: updatedField });
  } catch (err) {
    console.error("Reject field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// DISABLE FIELD
// ============================================================
export const disableField = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    const before = { approvalStatus: field.approvalStatus, isActive: field.isActive };
    const blockReason = reason || "Field disabled by admin";
    
    // Use findByIdAndUpdate to avoid validation issues - RETURN the updated document
    const updatedField = await Field.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: "disabled", isActive: false, blockReason } },
      { new: true, runValidators: false }
    ).populate("owner", "fullName email businessName");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "disable_field",
      "field",
      field._id,
      before,
      { approvalStatus: "disabled", reason: blockReason },
      req
    );
    
    // Notify owner
    try {
      await Notification.create({
        owner: field.owner,
        type: "field_disabled",
        message: `Your field "${field.name}" has been disabled. Reason: ${blockReason}`,
        relatedField: field._id,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED field document
    res.json({ message: "Field disabled", field: updatedField });
  } catch (err) {
    console.error("Disable field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// BLOCK FIELD (RULE VIOLATION)
// ============================================================
export const blockField = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: "Block reason is required" });
    }
    
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    const before = { approvalStatus: field.approvalStatus, isActive: field.isActive };
    
    // Use findByIdAndUpdate to avoid validation issues - RETURN the updated document
    const updatedField = await Field.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: "blocked", isActive: false, blockReason: reason } },
      { new: true, runValidators: false }
    ).populate("owner", "fullName email businessName");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "block_field",
      "field",
      field._id,
      before,
      { approvalStatus: "blocked", reason },
      req
    );
    
    // Notify owner
    try {
      await Notification.create({
        owner: field.owner,
        type: "field_blocked",
        message: `Your field "${field.name}" has been blocked due to rule violation. Reason: ${reason}`,
        relatedField: field._id,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED field document
    res.json({ message: "Field blocked", field: updatedField });
  } catch (err) {
    console.error("Block field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// EDIT FIELD
// ============================================================
export const editField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    
    const before = { ...field.toObject() };
    
    // Update allowed fields
    const allowedFields = [
      "name", "sport", "sportType", "city", "area", "address",
      "description", "pricePerHour", "isIndoor", "surfaceType",
      "maxPlayers", "amenities", "rules", "openingHours",
      "isActive", "approvalStatus",
    ];
    
    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        field[key] = req.body[key];
      }
    });
    
    await field.save();
    
    // Log activity
    await logActivity(
      req.admin._id,
      "edit_field",
      "field",
      field._id,
      before,
      { ...field.toObject() },
      req
    );
    
    res.json({ message: "Field updated", field });
  } catch (err) {
    console.error("Edit field error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

