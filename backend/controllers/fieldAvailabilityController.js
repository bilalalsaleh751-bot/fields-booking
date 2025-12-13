// backend/controllers/fieldAvailabilityController.js
import Field from "../models/Field.js";

// =========================================================
// BLOCK FIELD DATES (PDR 2.3)
// Block entire dates from bookings
// =========================================================
export const blockFieldDates = async (req, res) => {
  try {
    const field = req.field; // Set by authorizeFieldOwner middleware
    const { dates } = req.body; // Array of YYYY-MM-DD strings

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        message: "dates array is required",
      });
    }

    // Add dates to blockedDates (avoid duplicates)
    const existingDates = new Set(field.blockedDates || []);
    dates.forEach((date) => {
      if (date && typeof date === "string") {
        existingDates.add(date);
      }
    });

    field.blockedDates = Array.from(existingDates);
    await field.save();

    res.json({
      message: "Dates blocked successfully",
      blockedDates: field.blockedDates,
    });
  } catch (err) {
    console.error("Block Dates Error:", err);
    res.status(500).json({
      message: "Server error while blocking dates",
    });
  }
};

// =========================================================
// UNBLOCK FIELD DATES (PDR 2.3)
// =========================================================
export const unblockFieldDates = async (req, res) => {
  try {
    const field = req.field;
    const { dates } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        message: "dates array is required",
      });
    }

    // Remove dates from blockedDates
    const blockedSet = new Set(field.blockedDates || []);
    dates.forEach((date) => {
      blockedSet.delete(date);
    });

    field.blockedDates = Array.from(blockedSet);
    await field.save();

    res.json({
      message: "Dates unblocked successfully",
      blockedDates: field.blockedDates,
    });
  } catch (err) {
    console.error("Unblock Dates Error:", err);
    res.status(500).json({
      message: "Server error while unblocking dates",
    });
  }
};

// =========================================================
// BLOCK FIELD TIME SLOTS (PDR 2.3)
// Block specific time slots on specific dates
// =========================================================
export const blockFieldTimeSlots = async (req, res) => {
  try {
    const field = req.field;
    const { date, timeSlots } = req.body; // date: YYYY-MM-DD, timeSlots: ["HH:MM", ...]

    if (!date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        message: "date and timeSlots array are required",
      });
    }

    // Find or create blocked time slot entry for this date
    let blockedEntry = (field.blockedTimeSlots || []).find(
      (entry) => entry.date === date
    );

    if (blockedEntry) {
      // Merge with existing slots (avoid duplicates)
      const existingSlots = new Set(blockedEntry.timeSlots || []);
      timeSlots.forEach((slot) => {
        if (slot && typeof slot === "string") {
          existingSlots.add(slot);
        }
      });
      blockedEntry.timeSlots = Array.from(existingSlots);
    } else {
      // Create new entry
      if (!field.blockedTimeSlots) {
        field.blockedTimeSlots = [];
      }
      field.blockedTimeSlots.push({
        date,
        timeSlots: timeSlots.filter((s) => s && typeof s === "string"),
      });
    }

    await field.save();

    res.json({
      message: "Time slots blocked successfully",
      blockedTimeSlots: field.blockedTimeSlots,
    });
  } catch (err) {
    console.error("Block Time Slots Error:", err);
    res.status(500).json({
      message: "Server error while blocking time slots",
    });
  }
};

// =========================================================
// UNBLOCK FIELD TIME SLOTS (PDR 2.3)
// =========================================================
export const unblockFieldTimeSlots = async (req, res) => {
  try {
    const field = req.field;
    const { date, timeSlots } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    // Find blocked entry for this date
    const blockedEntry = (field.blockedTimeSlots || []).find(
      (entry) => entry.date === date
    );

    if (blockedEntry) {
      if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
        // Remove specific time slots
        const slotsSet = new Set(blockedEntry.timeSlots || []);
        timeSlots.forEach((slot) => {
          slotsSet.delete(slot);
        });
        blockedEntry.timeSlots = Array.from(slotsSet);

        // Remove entry if no slots left
        if (blockedEntry.timeSlots.length === 0) {
          field.blockedTimeSlots = (field.blockedTimeSlots || []).filter(
            (entry) => entry.date !== date
          );
        }
      } else {
        // Remove entire date entry
        field.blockedTimeSlots = (field.blockedTimeSlots || []).filter(
          (entry) => entry.date !== date
        );
      }
    }

    await field.save();

    res.json({
      message: "Time slots unblocked successfully",
      blockedTimeSlots: field.blockedTimeSlots,
    });
  } catch (err) {
    console.error("Unblock Time Slots Error:", err);
    res.status(500).json({
      message: "Server error while unblocking time slots",
    });
  }
};

// =========================================================
// GET FIELD BLOCKED DATES/SLOTS (PDR 2.3)
// =========================================================
export const getFieldBlockedAvailability = async (req, res) => {
  try {
    const field = req.field;

    res.json({
      fieldId: field._id,
      blockedDates: field.blockedDates || [],
      blockedTimeSlots: field.blockedTimeSlots || [],
    });
  } catch (err) {
    console.error("Get Blocked Availability Error:", err);
    res.status(500).json({
      message: "Server error while fetching blocked availability",
    });
  }
};

