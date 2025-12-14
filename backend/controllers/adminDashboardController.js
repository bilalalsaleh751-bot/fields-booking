import Field from "../models/Field.js";
import Owner from "../models/Owner.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// ============================================================
// ADMIN DASHBOARD OVERVIEW
// ============================================================
export const getDashboardOverview = async (req, res) => {
  try {
    // Get counts
    const [
      totalFields,
      totalOwners,
      totalUsers,
      totalBookings,
      pendingOwners,
      pendingFields,
      completedBookings,
      revenueData,
    ] = await Promise.all([
      Field.countDocuments(),
      Owner.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Owner.countDocuments({ status: { $in: ["pending", "pending_review"] } }),
      Field.countDocuments({ approvalStatus: "pending" }),
      Booking.countDocuments({ status: "completed" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amountGross" },
            totalCommission: { $sum: "$commissionAmount" },
            totalNetToOwners: { $sum: "$netToOwner" },
          },
        },
      ]),
    ]);
    
    // Get recent activity
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("field", "name");
    
    const recentOwners = await Owner.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status createdAt");
    
    // Booking breakdown by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    
    const bookingStatusMap = {};
    bookingsByStatus.forEach((b) => {
      bookingStatusMap[b._id] = b.count;
    });
    
    res.json({
      stats: {
        totalFields,
        totalOwners,
        totalUsers,
        totalBookings,
        completedBookings,
        pendingApprovals: pendingOwners + pendingFields,
        pendingOwners,
        pendingFields,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalCommission: revenueData[0]?.totalCommission || 0,
        totalNetToOwners: revenueData[0]?.totalNetToOwners || 0,
      },
      bookingsByStatus: bookingStatusMap,
      recentBookings: recentBookings.map((b) => ({
        _id: b._id,
        fieldName: b.field?.name || "Unknown",
        userName: b.userName,
        date: b.date,
        status: b.status,
        totalPrice: b.totalPrice,
        createdAt: b.createdAt,
      })),
      recentOwners: recentOwners.map((o) => ({
        _id: o._id,
        fullName: o.fullName,
        email: o.email,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

