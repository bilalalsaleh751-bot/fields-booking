import ActivityLog from "../models/ActivityLog.js";

// ============================================================
// GET ACTIVITY LOGS
// ============================================================
export const getActivityLogs = async (req, res) => {
  try {
    const { 
      adminId, 
      entityType, 
      action,
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const query = {};
    
    if (adminId) {
      query.adminId = adminId;
    }
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    if (action) {
      query.action = { $regex: action, $options: "i" };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("adminId", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
    ]);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get activity logs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET SINGLE ACTIVITY LOG
// ============================================================
export const getActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate("adminId", "fullName email role");
    
    if (!log) {
      return res.status(404).json({ message: "Activity log not found" });
    }
    
    res.json({ log });
  } catch (err) {
    console.error("Get activity log error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

