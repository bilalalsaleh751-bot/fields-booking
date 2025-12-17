// backend/controllers/ownerDashboardController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import PlatformSettings from "../models/PlatformSettings.js";

// Helper: Convert date + time → Date object
function buildDateObject(dateStr, timeStr) {
  try {
    return new Date(`${dateStr}T${timeStr}:00`);
  } catch {
    return null;
  }
}

// =================================================
// MAIN DASHBOARD OVERVIEW (PDR 2.2)
// =================================================
export const getOwnerDashboardOverview = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // 1) Fetch all fields for this owner
    const fields = await Field.find({ owner: ownerObjectId });
    const fieldIds = fields.map((f) => f._id);

    if (fieldIds.length === 0) {
      // Fetch commission rate from platform settings even for empty case
      const settings = await PlatformSettings.getSettings();
      const commissionRatePercent = settings.commissionRate || 15;
      
      return res.json({
        stats: {
          totalBookings: 0,
          upcomingToday: 0,
          earningsThisMonth: 0,
          activeFields: 0,
        },
        upcomingBookings: [],
        financial: {
          totalEarningsThisMonth: 0,
          commission: 0,
          netToOwner: 0,
          commissionRate: commissionRatePercent / 100, // Convert to decimal
          commissionRatePercent, // Also send percentage for display
        },
        reviews: [],
      });
    }

    // 2) Total Bookings (PDR-compliant: exclude cancelled bookings)
    // Count only active/completed bookings for visibility
    const totalBookings = await Booking.countDocuments({
      field: { $in: fieldIds },
      status: { $ne: "cancelled" }, // Exclude cancelled bookings
    });

    // 3) Active fields (will be fixed later with isActive)
    const activeFields = await Field.countDocuments({
      owner: ownerObjectId,
      isActive: true,
    });

    // 4) Upcoming today
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    // Upcoming today: Include pending and confirmed (not cancelled/completed)
    const allTodayBookings = await Booking.find({
      field: { $in: fieldIds },
      status: { $in: ["pending", "confirmed"] }, // Active bookings only
    }).populate("field", "name city sport");

    const upcomingTodayList = allTodayBookings.filter((b) => {
      const fullDate = buildDateObject(b.date, b.startTime);
      return fullDate >= startOfDay && fullDate <= endOfDay;
    });

    // Helper: Format date for display
    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    // Helper: Format time range
    const formatTimeRange = (startTime, duration) => {
      try {
        const [startH, startM] = startTime.split(":").map(Number);
        const endH = startH + Math.ceil(duration || 1);
        const start12 = startH > 12 ? `${startH - 12}:${String(startM).padStart(2, "0")} PM` : 
                       startH === 12 ? `12:${String(startM).padStart(2, "0")} PM` :
                       startH === 0 ? `12:${String(startM).padStart(2, "0")} AM` :
                       `${startH}:${String(startM).padStart(2, "0")} AM`;
        const end12 = endH > 12 ? `${endH - 12}:${String(startM).padStart(2, "0")} PM` :
                      endH === 12 ? `12:${String(startM).padStart(2, "0")} PM` :
                      endH === 0 ? `12:${String(startM).padStart(2, "0")} AM` :
                      `${endH}:${String(startM).padStart(2, "0")} AM`;
        return `${start12} - ${end12}`;
      } catch {
        return startTime;
      }
    };

    // Helper: Get payment status based on booking status
    const getPaymentStatus = (status) => {
      switch (status) {
        case "completed": return "paid";
        case "confirmed": return "paid";
        case "cancelled": return "refunded";
        default: return "pending";
      }
    };

    const upcomingBookings = upcomingTodayList
      .sort(
        (a, b) =>
          buildDateObject(a.date, a.startTime) -
          buildDateObject(b.date, b.startTime)
      )
      .slice(0, 5)
      .map((b) => ({
        _id: b._id,
        bookingCode: b._id.toString().slice(-6).toUpperCase(),
        customerName: b.userName,
        fieldName: b.field?.name || "N/A",
        date: b.date,
        dateFormatted: formatDate(b.date),
        time: b.startTime,
        timeRange: formatTimeRange(b.startTime, b.duration),
        paymentStatus: getPaymentStatus(b.status),
        status: b.status,
      }));

    // 5) Earnings This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Last month range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    // ============================================================
    // EARNINGS CALCULATION (UPDATED)
    // 
    // RULE: Earnings are calculated from CONFIRMED and COMPLETED bookings
    // - Pending bookings: No earnings (not yet confirmed)
    // - Confirmed bookings: COUNT towards earnings (transaction created)
    // - Completed bookings: COUNT towards earnings (confirmed + service delivered)
    // - Cancelled bookings: No earnings (refunded)
    // ============================================================

    let totalEarningsThisMonth = 0;
    let totalEarningsLastMonth = 0;
    let completedBookings = 0;  // Service delivered
    let confirmedBookings = 0;  // Confirmed (payment received)
    let pendingBookings = 0;    // Awaiting confirmation
    let cancelledBookings = 0;  // Cancelled (refunded)
    
    // Track fields with earnings-generating bookings
    const fieldsWithEarningsBookings = new Set();
    let lastMonthEarningsBookings = 0;

    // Get all bookings for counting
    const allBookings = await Booking.find({
      field: { $in: fieldIds },
    });

    allBookings.forEach((b) => {
      const d = buildDateObject(b.date, b.startTime);
      if (!d) return; // Skip invalid dates
      
      // Count by status for this month
      if (d >= startOfMonth && d <= endOfMonth) {
        switch (b.status) {
          case "completed":
            // Completed bookings count towards earnings
            totalEarningsThisMonth += b.totalPrice || 0;
            completedBookings++;
            fieldsWithEarningsBookings.add(b.field.toString());
            break;
          case "confirmed":
            // CONFIRMED bookings NOW count towards earnings (transaction created on confirm)
            totalEarningsThisMonth += b.totalPrice || 0;
            confirmedBookings++;
            fieldsWithEarningsBookings.add(b.field.toString());
            break;
          case "pending":
            // Pending - no earnings
            pendingBookings++;
            break;
          case "cancelled":
            // Cancelled - refunded, no earnings
            cancelledBookings++;
            break;
        }
      }
      
      // Last month earnings (confirmed AND completed bookings)
      if (d >= startOfLastMonth && d <= endOfLastMonth && 
          (b.status === "completed" || b.status === "confirmed")) {
        totalEarningsLastMonth += b.totalPrice || 0;
        lastMonthEarningsBookings++;
      }
    });

    // FETCH COMMISSION RATE FROM PLATFORM SETTINGS (SINGLE SOURCE OF TRUTH)
    const settings = await PlatformSettings.getSettings();
    const commissionRatePercent = settings.commissionRate || 15; // Default 15%
    const commissionRate = commissionRatePercent / 100; // Convert to decimal (e.g., 15 → 0.15)
    const commission = totalEarningsThisMonth * commissionRate;
    const netToOwner = totalEarningsThisMonth - commission;

    // 6) Latest reviews inside overview
    const reviews = fields
      .flatMap((field) =>
        field.reviews.map((rev) => ({
          fieldName: field.name,
          userName: rev.userName,
          rating: rev.rating,
          comment: rev.comment,
          createdAt: rev.createdAt,
        }))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    return res.json({
      stats: {
        totalBookings,
        upcomingToday: upcomingBookings.length,
        earningsThisMonth: totalEarningsThisMonth,
        activeFields,
      },
      upcomingBookings,
      financial: {
        // Earnings (from completed bookings only)
        totalEarningsThisMonth,
        thisMonthEarnings: totalEarningsThisMonth, // Alias for frontend
        lastMonthEarnings: totalEarningsLastMonth,
        
        // Commission calculation
        commission,
        platformCommission: commission, // Alias for frontend
        netToOwner,
        commissionRate: commissionRate, // Decimal (e.g., 0.15)
        commissionRatePercent: commissionRatePercent, // Percentage (e.g., 15)
        
        // Booking counts by status (this month)
        completedBookings,   // Earnings-generating bookings
        confirmedBookings,   // Confirmed but not completed
        pendingBookings,     // Awaiting confirmation
        cancelledBookings,   // Refunded
        
        // PDR 2.5: Fields with completed bookings
        activeFieldsWithEarnings: fieldsWithEarningsBookings.size,
        lastMonthEarningsBookings,
        
        // Legacy aliases for backward compatibility
        paidBookings: completedBookings,
        pendingPayments: pendingBookings,
        refunded: cancelledBookings,
      },
      reviews,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// PDR 2.2.2 — FIELD MANAGEMENT (LIST OWNER FIELDS)
// =================================================
export const getOwnerFields = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const fields = await Field.find({ owner: ownerObjectId })
      .sort({ createdAt: -1 })
      .select(
        "name sport city area pricePerHour currency isIndoor surfaceType openingHours createdAt"
      );

    return res.json({
      count: fields.length,
      fields,
    });
  } catch (err) {
    console.error("getOwnerFields Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================================================
// SEPARATE ROUTE — LATEST REVIEWS ONLY
// =================================================
export const getOwnerLatestReviews = async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId)
      return res.status(400).json({ message: "ownerId is required" });

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const fields = await Field.find({ owner: ownerObjectId });

    let allReviews = [];

    fields.forEach((field) => {
      field.reviews.forEach((rev) => {
        allReviews.push({
          fieldName: field.name,
          userName: rev.userName,
          rating: rev.rating,
          comment: rev.comment,
          createdAt: rev.createdAt,
        });
      });
    });

    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ reviews: allReviews.slice(0, 3) });
  } catch (err) {
    console.error("Reviews Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
