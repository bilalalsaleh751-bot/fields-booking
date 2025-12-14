import Transaction from "../models/Transaction.js";
import PlatformSettings from "../models/PlatformSettings.js";
import ActivityLog from "../models/ActivityLog.js";

// ============================================================
// GET COMMISSION RATE
// ============================================================
export const getCommissionRate = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    
    res.json({
      commissionRate: settings.commissionRate,
    });
  } catch (err) {
    console.error("Get commission rate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// UPDATE COMMISSION RATE (SUPER_ADMIN ONLY)
// ============================================================
export const updateCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    
    if (commissionRate === undefined || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
    }
    
    const settings = await PlatformSettings.getSettings();
    const before = { commissionRate: settings.commissionRate };
    
    settings.commissionRate = commissionRate;
    await settings.save();
    
    // Log activity
    await ActivityLog.create({
      adminId: req.admin._id,
      action: "update_commission",
      entityType: "settings",
      entityId: settings._id,
      before,
      after: { commissionRate },
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({
      message: "Commission rate updated",
      commissionRate: settings.commissionRate,
    });
  } catch (err) {
    console.error("Update commission rate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET TRANSACTIONS LIST
// ============================================================
export const getTransactions = async (req, res) => {
  try {
    const { ownerId, fieldId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (ownerId) {
      query.ownerId = ownerId;
    }
    
    if (fieldId) {
      query.fieldId = fieldId;
    }
    
    if (status) {
      query.status = status;
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
    
    const [transactions, total, totals] = await Promise.all([
      Transaction.find(query)
        .populate("ownerId", "fullName email")
        .populate("fieldId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalGross: { $sum: "$amountGross" },
            totalCommission: { $sum: "$commissionAmount" },
            totalNet: { $sum: "$netToOwner" },
          },
        },
      ]),
    ]);
    
    res.json({
      transactions,
      totals: totals[0] || { totalGross: 0, totalCommission: 0, totalNet: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// GET FINANCIAL OVERVIEW
// ============================================================
export const getFinancialOverview = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    
    // Get totals
    const totals = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amountGross" },
          totalCommission: { $sum: "$commissionAmount" },
          totalNetToOwners: { $sum: "$netToOwner" },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amountGross" },
          commission: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    
    res.json({
      commissionRate: settings.commissionRate,
      totals: totals[0] || {
        totalRevenue: 0,
        totalCommission: 0,
        totalNetToOwners: 0,
        count: 0,
      },
      monthlyData: monthlyData.map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
        revenue: m.revenue,
        commission: m.commission,
        count: m.count,
      })),
    });
  } catch (err) {
    console.error("Get financial overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

