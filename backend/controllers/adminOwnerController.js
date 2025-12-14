import Owner from "../models/Owner.js";
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
// LIST ALL OWNERS
// ============================================================
export const listOwners = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [owners, total] = await Promise.all([
      Owner.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Owner.countDocuments(query),
    ]);
    
    res.json({
      owners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("List owners error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET SINGLE OWNER
// ============================================================
export const getOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id).select("-password");
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    res.json({ owner });
  } catch (err) {
    console.error("Get owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// APPROVE OWNER
// ============================================================
export const approveOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    const before = { status: owner.status };
    
    // Use findByIdAndUpdate to avoid full document validation - RETURN updated document
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "approved" }, $unset: { rejectReason: 1 } },
      { new: true, runValidators: false }
    ).select("-password");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "approve_owner",
      "owner",
      owner._id,
      before,
      { status: "approved" },
      req
    );
    
    // Create notification for owner
    try {
      await Notification.create({
        owner: owner._id,
        type: "approved",
        message: "Your account has been approved! You can now add fields and start receiving bookings.",
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED owner document
    res.json({ message: "Owner approved successfully", owner: updatedOwner });
  } catch (err) {
    console.error("Approve owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REJECT OWNER
// ============================================================
export const rejectOwner = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    const before = { status: owner.status };
    const rejectReason = reason || "Application rejected by admin";
    
    // Use findByIdAndUpdate to avoid full document validation - RETURN updated document
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "rejected", rejectReason } },
      { new: true, runValidators: false }
    ).select("-password");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "reject_owner",
      "owner",
      owner._id,
      before,
      { status: "rejected", reason: rejectReason },
      req
    );
    
    // Create notification for owner
    try {
      await Notification.create({
        owner: owner._id,
        type: "rejected",
        message: `Your account application was rejected. Reason: ${rejectReason}`,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED owner document
    res.json({ message: "Owner rejected", owner: updatedOwner });
  } catch (err) {
    console.error("Reject owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// SUSPEND OWNER
// ============================================================
export const suspendOwner = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    const before = { status: owner.status };
    const suspendReason = reason || "Account suspended by admin";
    
    // Use findByIdAndUpdate to avoid full document validation - RETURN updated document
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "suspended", rejectReason: suspendReason } },
      { new: true, runValidators: false }
    ).select("-password");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "suspend_owner",
      "owner",
      owner._id,
      before,
      { status: "suspended", reason: suspendReason },
      req
    );
    
    // Create notification for owner
    try {
      await Notification.create({
        owner: owner._id,
        type: "suspended",
        message: `Your account has been suspended. Reason: ${suspendReason}`,
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED owner document
    res.json({ message: "Owner suspended", owner: updatedOwner });
  } catch (err) {
    console.error("Suspend owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// REACTIVATE OWNER
// ============================================================
export const reactivateOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    const before = { status: owner.status };
    
    // Use findByIdAndUpdate to avoid full document validation - RETURN updated document
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "approved" }, $unset: { rejectReason: 1 } },
      { new: true, runValidators: false }
    ).select("-password");
    
    // Log activity
    await logActivity(
      req.admin._id,
      "reactivate_owner",
      "owner",
      owner._id,
      before,
      { status: "approved" },
      req
    );
    
    // Create notification for owner
    try {
      await Notification.create({
        owner: owner._id,
        type: "reactivated",
        message: "Your account has been reactivated. Welcome back!",
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Return the UPDATED owner document
    res.json({ message: "Owner reactivated", owner: updatedOwner });
  } catch (err) {
    console.error("Reactivate owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

