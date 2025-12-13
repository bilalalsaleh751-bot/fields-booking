// backend/controllers/ownerDashboardController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

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
          commissionRate: 0.15,
        },
        reviews: [],
      });
    }

    // 2) Total Bookings
    const totalBookings = await Booking.countDocuments({
      field: { $in: fieldIds },
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

    const allTodayBookings = await Booking.find({
      field: { $in: fieldIds },
      status: "confirmed",
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
        paymentStatus: b.status === "confirmed" ? "paid" : "pending",
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

    const monthlyBookings = await Booking.find({
      field: { $in: fieldIds },
      status: "confirmed",
    });

    let totalEarningsThisMonth = 0;
    let totalEarningsLastMonth = 0;
    let paidBookings = 0;
    let pendingPayments = 0;
    let refunded = 0;

    // Get all bookings for counting (not just confirmed)
    const allBookings = await Booking.find({
      field: { $in: fieldIds },
    });

    allBookings.forEach((b) => {
      const d = buildDateObject(b.date, b.startTime);
      
      // This month data
      if (d >= startOfMonth && d <= endOfMonth) {
        if (b.status === "confirmed") {
          totalEarningsThisMonth += b.totalPrice;
          paidBookings++;
        } else if (b.status === "pending") {
          pendingPayments++;
        } else if (b.status === "cancelled") {
          refunded++;
        }
      }
      
      // Last month earnings (only confirmed)
      if (d >= startOfLastMonth && d <= endOfLastMonth && b.status === "confirmed") {
        totalEarningsLastMonth += b.totalPrice;
      }
    });

    const commissionRate = 0.15;
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
        totalEarningsThisMonth,
        thisMonthEarnings: totalEarningsThisMonth, // Alias for frontend
        lastMonthEarnings: totalEarningsLastMonth,
        commission,
        platformCommission: commission, // Alias for frontend
        netToOwner,
        commissionRate: commissionRate, // Keep as decimal (0.15)
        paidBookings,
        pendingPayments,
        refunded,
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
