// backend/utils/timeUtils.js
// ============================================================
// CENTRALIZED TIME UTILITIES
// Single source of truth for all time-based calculations
// All times use minutes since midnight for consistency
// Range format: [start, end) - start INCLUSIVE, end EXCLUSIVE
// ============================================================

/**
 * Convert "HH:MM" string to minutes since midnight
 * @param {string} timeStr - Time in "HH:MM" or "HH" format
 * @returns {number} Minutes since midnight (0-1439)
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hour, minutes = "0"] = timeStr.split(":");
  const h = parseInt(hour, 10);
  const m = parseInt(minutes, 10);
  if (isNaN(h)) return 0;
  return h * 60 + (isNaN(m) ? 0 : m);
};

/**
 * Convert minutes since midnight to "HH:MM" string
 * @param {number} mins - Minutes since midnight
 * @returns {string} Time in "HH:MM" format
 */
export const minutesToTime = (mins) => {
  const totalMins = Math.max(0, Math.min(1439, Math.floor(mins)));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Check if two time ranges overlap (STRICT - no touching allowed)
 * 
 * Example: Booking 09:00→10:30 exists (540-630 mins)
 *   - New booking 08:00→09:00 (480-540): 480 < 630 ✓ && 540 > 540 ✗ → NO OVERLAP
 *   - New booking 10:30→11:30 (630-690): 630 < 630 ✗ → NO OVERLAP
 *   - New booking 09:30→10:00 (570-600): 570 < 630 ✓ && 540 < 600 ✓ → OVERLAP
 * 
 * @param {number} startA - Start of range A (minutes)
 * @param {number} endA - End of range A (minutes)
 * @param {number} startB - Start of range B (minutes)
 * @param {number} endB - End of range B (minutes)
 * @returns {boolean} True if ranges overlap
 */
export const timeRangesOverlap = (startA, endA, startB, endB) => {
  // Two ranges overlap if: startA < endB AND startB < endA
  // This allows back-to-back bookings (end of one = start of another)
  return startA < endB && startB < endA;
};

/**
 * Calculate booking time range from start time and duration
 * @param {string} startTime - Start time in "HH:MM" format
 * @param {number} duration - Duration in hours
 * @returns {{ start: number, end: number }} Range in minutes
 */
export const getBookingRange = (startTime, duration) => {
  const start = timeToMinutes(startTime);
  const durationMins = (Number(duration) || 1) * 60;
  return { start, end: start + durationMins };
};

/**
 * Generate time slots with 30-minute granularity for precise booking
 * @param {number} openHour - Opening hour (0-23)
 * @param {number} closeHour - Closing hour (0-24)
 * @returns {string[]} Array of time strings in "HH:MM" format
 */
export const generateHourlySlots = (openHour, closeHour) => {
  const slots = [];
  const start = Math.max(0, Math.min(23, openHour));
  const end = Math.max(start + 1, Math.min(24, closeHour));
  
  // Generate slots every 30 minutes for more precision
  for (let h = start; h < end; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    // Add half-hour slot only if not the last hour
    if (h < end - 1 || (h === end - 1 && closeHour * 60 > h * 60 + 30)) {
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return slots;
};

/**
 * Generate time slots with custom granularity
 * @param {number} openHour - Opening hour (0-23)
 * @param {number} closeHour - Closing hour (0-24, or 0 for midnight)
 * @param {number} granularityMinutes - Minutes between slots (default: 30)
 * @returns {string[]} Array of time strings in "HH:MM" format
 */
export const generateTimeSlots = (openHour, closeHour, granularityMinutes = 30) => {
  const slots = [];
  const startMins = Math.max(0, openHour) * 60;
  
  // Handle midnight (0) as 24:00 if closeHour is less than openHour
  let endMins;
  if (closeHour === 0 || (closeHour < openHour)) {
    endMins = 24 * 60; // Midnight = 24:00
  } else {
    endMins = Math.min(24 * 60, closeHour * 60);
  }
  
  for (let mins = startMins; mins < endMins; mins += granularityMinutes) {
    slots.push(minutesToTime(mins));
  }
  return slots;
};

/**
 * Check if a specific start time can fit a booking of given duration
 * without overlapping any existing bookings
 * 
 * @param {string} startTime - Proposed start time "HH:MM"
 * @param {number} duration - Duration in hours
 * @param {Array} existingBookings - Array of {startTime, endTime, duration}
 * @param {number} closeHour - Field closing hour
 * @returns {boolean} True if the slot can accommodate the booking
 */
export const canFitBooking = (startTime, duration, existingBookings, closeHour) => {
  const proposedStart = timeToMinutes(startTime);
  const proposedEnd = proposedStart + (duration * 60);
  const closingTime = closeHour * 60;
  
  // Check if booking would extend past closing time
  if (proposedEnd > closingTime) {
    return false;
  }
  
  // Check for overlaps with existing bookings
  for (const booking of existingBookings) {
    let existingStart, existingEnd;
    
    if (booking.endTime) {
      existingStart = timeToMinutes(booking.startTime);
      existingEnd = timeToMinutes(booking.endTime);
    } else {
      existingStart = timeToMinutes(booking.startTime);
      existingEnd = existingStart + ((booking.duration || 1) * 60);
    }
    
    // Check overlap using strict range comparison
    if (timeRangesOverlap(proposedStart, proposedEnd, existingStart, existingEnd)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validate that a time string is in valid "HH:MM" format
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid
 */
export const isValidTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return false;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

/**
 * Normalize a time string to "HH:00" format (round down to nearest hour)
 * @param {string} timeStr - Time string
 * @returns {string} Normalized time in "HH:00" format
 */
export const normalizeToHour = (timeStr) => {
  const mins = timeToMinutes(timeStr);
  const hour = Math.floor(mins / 60);
  return `${String(hour).padStart(2, "0")}:00`;
};

/**
 * SLOT DURATION constant - unified across the system
 * 30 minutes = half-hour granularity for precision
 */
export const SLOT_DURATION_MINUTES = 30;

/**
 * BLOCKED SLOT DURATION constant
 * Owner blocking uses 30-minute granularity for flexibility
 */
export const BLOCKED_SLOT_DURATION_MINUTES = 30;

