// src/pages/BookingFlow.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import "./BookingFlow.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


// SIMPLIFIED STEPS - Skip sport/area/court when coming from field page
const STEPS_FULL = [
  { id: 1, key: "sport", label: "Sport" },
  { id: 2, key: "area", label: "Area" },
  { id: 3, key: "court", label: "Court" },
  { id: 4, key: "datetime", label: "Date & Time" },
  { id: 5, key: "details", label: "Details" },
  { id: 6, key: "review", label: "Review" },
];

// Simplified steps when field is pre-selected
const STEPS_SIMPLE = [
  { id: 1, key: "datetime", label: "Date & Time" },
  { id: 2, key: "details", label: "Details" },
  { id: 3, key: "review", label: "Review" },
];

const SPORT_OPTIONS = ["Football", "Basketball", "Padel", "Tennis", "Volleyball"];
const AREA_OPTIONS = ["Beirut", "Hamra", "Jounieh", "Tripoli", "Sidon"];

// Duration options in hours
const DURATION_OPTIONS = [1, 1.5, 2, 3];

// تحويل HH:MM إلى 12-hour مع AM/PM
function formatTimeLabel(time24) {
  if (!time24) return "";
  const [hourStr, minuteStr = "00"] = time24.split(":");
  let h = parseInt(hourStr, 10);
  if (Number.isNaN(h)) return time24;

  const minutes = minuteStr.padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  return `${h}:${minutes} ${suffix}`;
}

// Calculate end time based on start time and duration
function getEndTime(startTime24, durationHours) {
  if (!startTime24) return "";
  const [hourStr, minuteStr = "0"] = startTime24.split(":");
  const startMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
  const endMinutes = startMinutes + (durationHours * 60);
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
}

// Format time range (start → end)
function formatTimeRange(startTime24, durationHours) {
  if (!startTime24) return "";
  const endTime24 = getEndTime(startTime24, durationHours);
  return `${formatTimeLabel(startTime24)} → ${formatTimeLabel(endTime24)}`;
}

// Convert time string "HH:MM" to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m = "0"] = timeStr.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

// Check if two time ranges overlap
// Range: [start, end) - start inclusive, end exclusive
// But for start time validation, we use <= to block end boundaries
function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB < endA;
}

// Calculate number of hourly slots needed for a duration
function getRoundedDurationSlots(duration) {
  const num = Number(duration) || 1;
  return Math.max(1, Math.ceil(num));
}

/**
 * Check if a start time S can fit a booking of given duration
 * WITHOUT overlapping any booked/blocked slots.
 * 
 * EACH START TIME IS EVALUATED INDEPENDENTLY.
 * Does NOT filter based on any "current selection".
 * 
 * Logic: Check if range [S, S + duration) overlaps any booked/blocked range.
 * 
 * @param {Array} slots - Array of slot objects with {time, isBooked, isBlocked}
 * @param {string} startTime - The start time to check (e.g., "09:00")
 * @param {number} durationHours - Duration in hours (e.g., 2 for 2h)
 * @returns {boolean} True if the time range fits without overlapping
 */
function canFitDurationAtTime(slots, startTime, durationHours) {
  // Calculate the time range for this potential booking
  const rangeStart = timeToMinutes(startTime);
  const rangeEnd = rangeStart + (durationHours * 60);
  
  // Check if this range overlaps with ANY booked or blocked slot
  for (const slot of slots) {
    // Skip available slots
    if (!slot.isBooked && !slot.isBlocked) continue;
    
    // Calculate the blocked slot's time range (each slot = 1 hour)
    const slotStart = timeToMinutes(slot.time);
    const slotEnd = slotStart + 60;
    
    // Check overlap: our range vs blocked slot range
    if (rangesOverlap(rangeStart, rangeEnd, slotStart, slotEnd)) {
      return false; // Overlap found - this start time doesn't fit
    }
  }
  
  // Also check if the range extends beyond available slots
  const lastSlot = slots[slots.length - 1];
  if (lastSlot) {
    const lastSlotEnd = timeToMinutes(lastSlot.time) + 60;
    if (rangeEnd > lastSlotEnd) {
      return false; // Range extends past closing time
    }
  }
  
  return true; // No overlaps found - start time is valid
}

export default function BookingFlow() {
  const { fieldId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine if we're using simplified flow (field pre-selected)
  const useSimplifiedFlow = Boolean(fieldId);
  const STEPS = useSimplifiedFlow ? STEPS_SIMPLE : STEPS_FULL;

  const [step, setStep] = useState(1);
  const [field, setField] = useState(null);
  const [loadingField, setLoadingField] = useState(false);
  const [error, setError] = useState("");
  
  // Booking confirmation state
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Slots data with booked ranges for precise checking
  const [slots, setSlots] = useState([]);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Day hours (open/close) from API
  const [dayHours, setDayHours] = useState({
    openHour: null,
    closeHour: null,
  });

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  // Booking form state
  const [form, setForm] = useState({
    sport: searchParams.get("sport") || "",
    area: searchParams.get("city") || searchParams.get("area") || "",
    courtId: fieldId || "",
    courtName: "",
    date: searchParams.get("date") || "",
    time: searchParams.get("time") || "",
    duration: "1",
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "online",
    promoCode: "",
    notes: "",
  });
  
  // Auto-fill user details if logged in
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    
    if (token && id) {
      setIsLoggedIn(true);
      setUserId(id);
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || name || "",
        email: prev.email || email || "",
      }));
    }
  }, []);

  // تحميل تفاصيل الملعب
  useEffect(() => {
    if (!fieldId) return;

    const loadField = async () => {
      try {
        setLoadingField(true);

        const res = await fetch(`${API_BASE}/api/fields/${fieldId}`);
        if (!res.ok) throw new Error("Failed to load field");

        const data = await res.json();
        setField(data);

        setForm((prev) => ({
          ...prev,
          courtId: fieldId,
          courtName: data.name || prev.courtName,
          sport: data.sport || prev.sport,
          area: data.city || prev.area,
        }));
      } catch (e) {
        console.error("Field load error:", e);
        setError("Could not load field data.");
      } finally {
        setLoadingField(false);
      }
    };

    loadField();
  }, [fieldId]);

  // تحديث قيمة معينة من الفورم
  const updateForm = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch availability slots when date or duration changes
  const fetchAvailability = useCallback(async () => {
    if (!fieldId || !form.date) {
      setSlots([]);
      setBookedRanges([]);
      setSlotsError("");
      setDayHours({ openHour: null, closeHour: null });
      return;
    }

    try {
      setSlotsLoading(true);
      setSlotsError("");

      // Include duration in request for smart filtering
      const durationParam = form.duration || "1";
      const res = await fetch(
        `${API_BASE}/api/fields/${fieldId}/availability?date=${form.date}&duration=${durationParam}`
      );

      if (!res.ok) throw new Error("Failed to load availability");

      const data = await res.json();
      const apiSlots = data.slots || [];

      setSlots(apiSlots);
      setBookedRanges(data.bookedRanges || []);

      // Get open/close hours from API
      let openHour = data.openHour ?? null;
      let closeHour = data.closeHour ?? null;

      // Fallback: infer from slots
      if ((openHour == null || closeHour == null) && apiSlots.length > 0) {
        const firstH = parseInt(apiSlots[0].time.split(":")[0], 10);
        const lastH = parseInt(
          apiSlots[apiSlots.length - 1].time.split(":")[0],
          10
        );
        openHour = firstH;
        closeHour = lastH + 1;
      }

      // Default fallback
      if (openHour == null || closeHour == null) {
        openHour = 8;
        closeHour = 23;
      }

      setDayHours({ openHour, closeHour });
    } catch (err) {
      console.error("Slots error:", err);
      setSlotsError("Could not load availability for this day.");
      setSlots([]);
      setBookedRanges([]);
      setDayHours({ openHour: null, closeHour: null });
    } finally {
      setSlotsLoading(false);
    }
  }, [fieldId, form.date, form.duration]);

  // Fetch slots when date or duration changes
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);
  
  // Clear selected time when duration changes (it might no longer be valid)
  useEffect(() => {
    if (form.time && slots.length > 0) {
      const selectedSlot = slots.find(s => s.time === form.time);
      if (selectedSlot && !selectedSlot.isAvailable) {
        setForm(prev => ({ ...prev, time: "" }));
      }
    }
  }, [form.duration, slots, form.time]);

  // 🔥 تقييد المدة بحسب الوقت المتبقي قبل الإغلاق (Option B)
  useEffect(() => {
    if (!form.time || !dayHours.closeHour) return;

    const [hStr] = form.time.split(":");
    const startH = Number(hStr);
    if (Number.isNaN(startH)) return;

    const remainingHours = dayHours.closeHour - startH;
    if (remainingHours <= 0) return;

    const requested = parseFloat(form.duration || "1") || 1;

    const possibleDurations = DURATION_OPTIONS.filter(
      (d) => d <= remainingHours
    );
    if (possibleDurations.length === 0) return;

    const maxAllowed = Math.min(
      remainingHours,
      Math.max(...possibleDurations)
    );

    if (requested > maxAllowed) {
      // ننزّل المدة لأكبر قيمة مسموحة
      updateForm("duration", String(maxAllowed));
    }
  }, [form.time, form.duration, dayHours.closeHour]);

  // هل اليوم FULL (كل الـ slots محجوزة أو محظورة)؟
  const isDayFullyBooked =
    form.date &&
    !slotsLoading &&
    !slotsError &&
    slots.length > 0 &&
    slots.every((s) => s.isBooked || s.isBlocked);

  // Get current step key based on flow type
  const getCurrentStepKey = () => {
    return STEPS[step - 1]?.key || "";
  };

  // Get max step based on flow type
  const maxStep = STEPS.length;

  // Next step with smart validation
  const goNext = () => {
    const stepKey = getCurrentStepKey();
    
    // Full flow validations
    if (!useSimplifiedFlow) {
      if (stepKey === "sport" && !form.sport) {
        return setError("Please select a sport.");
      }
      if (stepKey === "area" && !form.area) {
        return setError("Please select an area.");
      }
      if (stepKey === "court" && !form.courtName) {
        return setError("Please select a court.");
      }
    }

    // Date/Time validation (both flows)
    if (stepKey === "datetime") {
      if (!form.date) {
        return setError("Please choose a date.");
      }

      if (slotsError) {
        return setError("Could not load availability. Please try again.");
      }

      if (slots.length === 0) {
        return setError("No available slots for this day.");
      }

      if (isDayFullyBooked) {
        return setError("This day is fully booked. Please choose another date.");
      }

      if (!form.time) {
        return setError("Please pick a time from the available slots.");
      }

      // Validate the selected slot is available
      const chosenSlot = slots.find((s) => s.time === form.time);
      if (!chosenSlot || !chosenSlot.isAvailable) {
        return setError("Please pick a valid available time slot.");
      }
    }

    // Details validation (both flows)
    if (stepKey === "details" && (!form.fullName || !form.email || !form.phone)) {
      return setError("Please fill in all your contact details.");
    }

    setError("");
    setStep((s) => Math.min(maxStep, s + 1));
  };

  // Back
  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const durationNumber = parseFloat(form.duration || "1") || 1;
  const totalPrice = (field?.pricePerHour || 0) * durationNumber;
  const currency = field?.currency || "USD";

  // Confirm booking
  const handleConfirm = async () => {
    try {
      setError("");
      setSubmitting(true);

      if (!field || !field._id) {
        setSubmitting(false);
        return setError("Field information missing.");
      }

      const payload = {
        fieldId: field._id,
        userName: form.fullName,
        userEmail: form.email,
        userPhone: form.phone,
        date: form.date,
        startTime: form.time,
        duration: durationNumber,
        totalPrice,
        // Link to user account if logged in
        userId: isLoggedIn ? userId : undefined,
      };

      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await res.json();

      if (!res.ok) {
        setSubmitting(false);
        setError(created?.message || "Booking failed.");
        return;
      }

      // Set booking confirmed state with all details
      setConfirmedBooking({
        bookingId: created.bookingId || created._id,
        fieldName: form.courtName || field.name,
        date: form.date,
        time: form.time,
        duration: durationNumber,
        totalPrice,
        currency,
        userName: form.fullName,
        userEmail: form.email,
        status: created.status || "pending",
      });
      setBookingConfirmed(true);
      setSubmitting(false);
    } catch (err) {
      console.error("Booking error:", err);
      setSubmitting(false);
      setError("Something went wrong. Try again.");
    }
  };

  const isActive = (id) => id === step;
  const isCompleted = (id) => id < step;

  // ================== BOOKING CONFIRMED SCREEN ==================
  if (bookingConfirmed && confirmedBooking) {
    return (
      <div className="booking-flow-page">
        <div className="booking-confirmation-container">
          <div className="booking-confirmation-card">
            <div className="confirmation-icon">✓</div>
            <h1 className="confirmation-title">Booking Confirmed!</h1>
            <p className="confirmation-subtitle">
              Your booking has been successfully submitted
            </p>

            <div className="confirmation-details">
              <div className="confirmation-row">
                <span className="confirmation-label">Booking ID</span>
                <span className="confirmation-value">{confirmedBooking.bookingId}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Court</span>
                <span className="confirmation-value">{confirmedBooking.fieldName}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Date</span>
                <span className="confirmation-value">{confirmedBooking.date}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Time</span>
                <span className="confirmation-value">
                  {formatTimeRange(confirmedBooking.time, confirmedBooking.duration)}
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Duration</span>
                <span className="confirmation-value">
                  {confirmedBooking.duration} hour{confirmedBooking.duration !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="confirmation-row highlight">
                <span className="confirmation-label">Total Price</span>
                <span className="confirmation-value">
                  {confirmedBooking.currency} {confirmedBooking.totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Status</span>
                <span className="confirmation-status pending">
                  {confirmedBooking.status === "pending" ? "Pending Confirmation" : confirmedBooking.status}
                </span>
              </div>
            </div>

            <div className="confirmation-notice">
              <p>📧 A confirmation email has been sent to <strong>{confirmedBooking.userEmail}</strong></p>
              <p>⏰ The owner will confirm your booking shortly</p>
            </div>

            <div className="confirmation-actions">
              {isLoggedIn && (
                <Link to="/account/bookings" className="confirmation-btn primary">
                  View My Bookings
                </Link>
              )}
              <Link to="/discover" className="confirmation-btn secondary">
                Book Another Court
              </Link>
              <Link to="/" className="confirmation-btn outline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-flow-page">
      <div className="booking-flow-header">
        <h1>Book a court</h1>
        {field && (
          <p className="booking-flow-subtitle">
            You are booking: <strong>{field.name}</strong>
          </p>
        )}
      </div>

      {/* STEP INDICATOR */}
      <div className="booking-stepper">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="booking-stepper-item">
            <div
              className={[
                "booking-step-circle",
                isActive(s.id) ? "active" : "",
                isCompleted(s.id) ? "completed" : "",
              ].join(" ")}
            >
              {isCompleted(s.id) ? "✓" : s.id}
            </div>
            <span className="booking-step-label">{s.label}</span>

            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "booking-step-line",
                  isCompleted(s.id) ? "completed" : "",
                ].join(" ")}
              />
            )}
          </div>
        ))}
      </div>

      {/* MAIN CARD */}
      <div className="booking-card">
        {error && <div className="booking-error">{error}</div>}

        {/* SPORT SELECTION - Only in full flow */}
        {!useSimplifiedFlow && getCurrentStepKey() === "sport" && (
          <>
            <h2 className="booking-card-title">Select a Sport</h2>
            <p className="booking-card-subtitle">What would you like to play?</p>

            <div className="booking-options-grid">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateForm("sport", s)}
                  className={
                    form.sport === s
                      ? "booking-option-card selected"
                      : "booking-option-card"
                  }
                >
                  <div className="booking-option-icon">🏟</div>
                  <div className="booking-option-text">
                    <div className="booking-option-title">{s}</div>
                    <div className="booking-option-subtitle">Popular courts</div>
                  </div>

                  <div className="booking-option-radio">
                    <span
                      className={
                        form.sport === s
                          ? "booking-radio-dot active"
                          : "booking-radio-dot"
                      }
                    />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* AREA SELECTION - Only in full flow */}
        {!useSimplifiedFlow && getCurrentStepKey() === "area" && (
          <>
            <h2 className="booking-card-title">Choose an Area</h2>
            <p className="booking-card-subtitle">Where do you want to play?</p>

            <div className="booking-options-grid">
              {AREA_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateForm("area", a)}
                  className={
                    form.area === a
                      ? "booking-option-card selected"
                      : "booking-option-card"
                  }
                >
                  <div className="booking-option-icon">📍</div>
                  <div className="booking-option-text">
                    <div className="booking-option-title">{a}</div>
                    <div className="booking-option-subtitle">Popular courts</div>
                  </div>

                  <div className="booking-option-radio">
                    <span
                      className={
                        form.area === a
                          ? "booking-radio-dot active"
                          : "booking-radio-dot"
                      }
                    />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* COURT SELECTION - Only in full flow */}
        {!useSimplifiedFlow && getCurrentStepKey() === "court" && (
          <>
            <h2 className="booking-card-title">Select a Court</h2>
            <p className="booking-card-subtitle">Pick the available court.</p>

            <div className="booking-options-grid">
              {field ? (
                <button
                  type="button"
                  onClick={() => {
                    updateForm("courtId", field._id);
                    updateForm("courtName", field.name);
                  }}
                  className={
                    form.courtId === field._id
                      ? "booking-option-card selected"
                      : "booking-option-card"
                  }
                >
                  <div className="booking-option-image">
                    <img
                      src={field.mainImage}
                      alt={field.name}
                      className="booking-court-img"
                    />
                  </div>

                  <div className="booking-option-text">
                    <div className="booking-option-title">{field.name}</div>
                    <div className="booking-option-subtitle">
                      {field.city} · {field.sport}
                    </div>
                  </div>

                  <div className="booking-option-radio">
                    <span
                      className={
                        form.courtId === field._id
                          ? "booking-radio-dot active"
                          : "booking-radio-dot"
                      }
                    />
                  </div>
                </button>
              ) : (
                <p className="booking-placeholder">Loading court…</p>
              )}
            </div>
          </>
        )}

        {/* DATE & TIME SELECTION */}
        {getCurrentStepKey() === "datetime" && (
          <>
            <h2 className="booking-card-title">Date & Time</h2>
            <p className="booking-card-subtitle">Choose when you want to play.</p>

            <div className="booking-form-grid">
              <label className="booking-label">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    updateForm("date", e.target.value);
                    // لما يغير التاريخ، نمسح الوقت القديم
                    updateForm("time", "");
                  }}
                />
              </label>

              {/* نخلي الـ time readOnly حتى المستخدم يختار فقط من الـ slots */}
              <label className="booking-label">
                Time (from slots)
                <input
                  type="time"
                  value={form.time}
                  readOnly
                />
              </label>

              <label className="booking-label">
                Duration
                <select
                  value={form.duration}
                  onChange={(e) => updateForm("duration", e.target.value)}
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Availability slots UI */}
            <div className="booking-availability-section">
              <h3 className="booking-card-subtitle">Available time slots</h3>

              {!form.date && (
                <p className="booking-placeholder">
                  Select a date to view available slots.
                </p>
              )}

              {form.date && slotsLoading && (
                <p className="booking-placeholder">Loading slots…</p>
              )}

              {form.date && slotsError && (
                <p className="booking-error">{slotsError}</p>
              )}

              {form.date &&
                !slotsLoading &&
                !slotsError &&
                isDayFullyBooked && (
                  <p className="booking-placeholder">
                    This day is fully booked. Please select another date.
                  </p>
                )}

              {form.date &&
                !slotsLoading &&
                !slotsError &&
                slots.length > 0 &&
                !isDayFullyBooked && (
                  <>
                    {/* Show current booked ranges for transparency */}
                    {bookedRanges.length > 0 && (
                      <div className="booking-booked-info">
                        <span className="booking-info-icon">ℹ️</span>
                        <span>
                          Already booked: {bookedRanges.map((r, i) => (
                            <span key={i} className="booked-range-tag">
                              {formatTimeLabel(r.startTime)} - {formatTimeLabel(r.endTime)}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                    
                    <div className="booking-options-grid booking-slots-grid">
                      {slots.map((slot) => {
                        // Slot availability already considers duration from API
                        const isUnavailable = !slot.isAvailable;
                        const disabled = isUnavailable;
                        
                        // Show the booking range if this slot is selected
                        const durationHours = parseFloat(form.duration) || 1;
                        const endTime = getEndTime(slot.time, durationHours);

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              !disabled && updateForm("time", slot.time)
                            }
                            className={[
                              "booking-slot-btn",
                              isUnavailable ? "booked" : "available",
                              slot.extendsPastClose ? "past-close" : "",
                              form.time === slot.time ? "selected" : "",
                            ].join(" ")}
                          >
                            <span className="slot-time">{formatTimeLabel(slot.time)}</span>
                            <small className="slot-status">
                              {slot.isBlocked
                                ? "Blocked"
                                : slot.isBooked
                                ? "Booked"
                                : slot.extendsPastClose
                                ? "Past closing"
                                : `→ ${formatTimeLabel(endTime)}`}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

              {form.date &&
                !slotsLoading &&
                !slotsError &&
                slots.length === 0 && (
                  <p className="booking-placeholder">
                    No slots defined for this day.
                  </p>
                )}
            </div>
          </>
        )}

        {/* USER DETAILS */}
        {getCurrentStepKey() === "details" && (
          <>
            <h2 className="booking-card-title">Your Details</h2>
            <p className="booking-card-subtitle">
              Enter your personal information.
            </p>

            <div className="booking-form-grid booking-form-grid-2">
              <label className="booking-label">
                Full Name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateForm("fullName", e.target.value)}
                />
              </label>

              <label className="booking-label">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </label>

              <label className="booking-label">
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                />
              </label>

              <label className="booking-label booking-label-full">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                />
              </label>
            </div>
          </>
        )}

        {/* REVIEW & CONFIRM */}
        {getCurrentStepKey() === "review" && (
          <>
            <h2 className="booking-card-title">Review & Confirm</h2>
            <p className="booking-card-subtitle">Check your booking details.</p>

            <div className="booking-review-box">
              <div className="booking-review-row">
                <span>Sport</span>
                <strong>{form.sport}</strong>
              </div>

              <div className="booking-review-row">
                <span>Area</span>
                <strong>{form.area}</strong>
              </div>

              <div className="booking-review-row">
                <span>Court</span>
                <strong>{form.courtName}</strong>
              </div>

              <div className="booking-review-row">
                <span>Date</span>
                <strong>{form.date}</strong>
              </div>

              <div className="booking-review-row">
                <span>Time Slot</span>
                <strong>
                  {form.time && form.duration
                    ? formatTimeRange(form.time, Number(form.duration))
                    : form.time
                    ? formatTimeLabel(form.time)
                    : "-"}
                </strong>
              </div>

              <div className="booking-review-row">
                <span>Duration</span>
                <strong>{form.duration} hour{Number(form.duration) !== 1 ? "s" : ""}</strong>
              </div>

              <div className="booking-review-row">
                <span>Name</span>
                <strong>{form.fullName}</strong>
              </div>

              <div className="booking-review-row">
                <span>Contact</span>
                <strong>
                  {form.email} · {form.phone}
                </strong>
              </div>

              <div className="booking-review-row">
                <span>Total Price</span>
                <strong>
                  {currency} {totalPrice.toFixed(2)}
                </strong>
              </div>

              <div className="booking-review-note">
                This is a demo. Real payment will be added later.
              </div>
            </div>
          </>
        )}

        {/* ACTION BUTTONS */}
        <div className="booking-actions">
          <button
            type="button"
            className="booking-secondary-btn"
            onClick={step === 1 ? () => navigate(-1) : goBack}
          >
            Back
          </button>

          {getCurrentStepKey() !== "review" ? (
            <button
              type="button"
              className="booking-primary-btn"
              onClick={goNext}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              className="booking-primary-btn"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Confirm Booking"}
            </button>
          )}
        </div>

        {loadingField && <p className="booking-loading">Loading field…</p>}

        <div className="booking-footer-link">
          <Link to="/discover">← Back to Discover</Link>
        </div>
      </div>
    </div>
  );
}
