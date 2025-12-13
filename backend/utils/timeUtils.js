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
 * Check if two time ranges overlap
 * Range A cannot START at or before Range B ends
 * This ensures back-to-back bookings are blocked (no booking can start at exact end time)
 * 
 * Example: Booking 09:00→10:00 exists
 *   - Start at 09:00: 540 <= 600 ✓ → BLOCKED
 *   - Start at 10:00: 600 <= 600 ✓ → BLOCKED  
 *   - Start at 11:00: 660 <= 600 ✗ → AVAILABLE
 * 
 * @param {number} startA - Start of range A (minutes) - the NEW/checking range
 * @param {number} endA - End of range A (minutes)
 * @param {number} startB - Start of range B (minutes) - the EXISTING range
 * @param {number} endB - End of range B (minutes)
 * @returns {boolean} True if ranges overlap (A is blocked by B)
 */
export const timeRangesOverlap = (startA, endA, startB, endB) => {
  // startA <= endB: New range starts at or before existing ends (BLOCKS end time)
  // startB < endA: Existing range starts before new ends
  return startA <= endB && startB < endA;
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
 * Generate hourly time slots for a given range
 * GRANULARITY: 60 minutes (1 hour) - UNIFIED across system
 * @param {number} openHour - Opening hour (0-23)
 * @param {number} closeHour - Closing hour (0-24)
 * @returns {string[]} Array of time strings in "HH:00" format
 */
export const generateHourlySlots = (openHour, closeHour) => {
  const slots = [];
  const start = Math.max(0, Math.min(23, openHour));
  const end = Math.max(start + 1, Math.min(24, closeHour));
  
  for (let h = start; h < end; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
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
 * 60 minutes = 1 hour granularity
 */
export const SLOT_DURATION_MINUTES = 60;

/**
 * BLOCKED SLOT DURATION constant
 * Owner blocking uses 30-minute granularity for flexibility
 * But availability display shows hourly slots
 */
export const BLOCKED_SLOT_DURATION_MINUTES = 30;

