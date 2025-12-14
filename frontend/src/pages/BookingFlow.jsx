// src/pages/BookingFlow.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import "./BookingFlow.css";

// خطوة خطوة للـ wizard
const STEPS = [
  { id: 1, key: "sport", label: "Sport" },
  { id: 2, key: "area", label: "Area" },
  { id: 3, key: "court", label: "Court" },
  { id: 4, key: "datetime", label: "Date & Time" },
  { id: 5, key: "details", label: "Details" },
  { id: 6, key: "review", label: "Review" },
];

const SPORT_OPTIONS = ["Football", "Basketball", "Padel", "Tennis", "Volleyball"];
const AREA_OPTIONS = ["Beirut", "Hamra", "Jounieh", "Tripoli", "Sidon"];

// المدد المسموحة (بالساعات)
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

  const [step, setStep] = useState(1);
  const [field, setField] = useState(null);
  const [loadingField, setLoadingField] = useState(false);
  const [error, setError] = useState("");

  // بيانات الـ slots
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // ساعات اليوم (open/close) – ياخدها من الـ API أو نستنتجها من الـ slots
  const [dayHours, setDayHours] = useState({
    openHour: null,
    closeHour: null,
  });

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  // فورم الحجز
  const [form, setForm] = useState({
    sport: "",
    area: "",
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

        const res = await fetch(`http://localhost:5000/api/fields/${fieldId}`);
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

  // جلب الـ slots عند تغيير التاريخ
  useEffect(() => {
    if (!fieldId || !form.date) {
      setSlots([]);
      setSlotsError("");
      setDayHours({ openHour: null, closeHour: null });
      return;
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        setSlotsError("");

        const res = await fetch(
          `http://localhost:5000/api/fields/${fieldId}/availability?date=${form.date}`
        );

        if (!res.ok) throw new Error("Failed to load availability");

        const data = await res.json();
        const apiSlots = data.slots || [];

        setSlots(apiSlots);

        // نحاول ناخد openHour/closeHour من الـ API
        let openHour = data.openHour ?? null;
        let closeHour = data.closeHour ?? null;

        // إذا الـ backend ما رجّع open/close: نستنتج من أول وآخر slot
        if ((openHour == null || closeHour == null) && apiSlots.length > 0) {
          const firstH = parseInt(apiSlots[0].time.split(":")[0], 10);
          const lastH = parseInt(
            apiSlots[apiSlots.length - 1].time.split(":")[0],
            10
          );
          // آخر slot هو الساعة الأخيرة – نضيف +1 كـ closing hour تقديرًا
          openHour = firstH;
          closeHour = lastH + 1;
        }

        // fallback default
        if (openHour == null || closeHour == null) {
          openHour = 8;
          closeHour = 23;
        }

        setDayHours({ openHour, closeHour });
      } catch (err) {
        console.error("Slots error:", err);
        setSlotsError("Could not load availability for this day.");
        setSlots([]);
        setDayHours({ openHour: null, closeHour: null });
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [fieldId, form.date]);

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

  // Next step
  const goNext = () => {
    // Validation per step
    if (step === 1 && !form.sport) {
      return setError("Please select a sport.");
    }

    if (step === 2 && !form.area) {
      return setError("Please select an area.");
    }

    if (step === 3 && !form.courtName) {
      return setError("Please select a court.");
    }

    if (step === 4) {
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

      // لازم الوقت يكون من الـ slots + غير محجوز أو محظور + بيكفي للمدة
      const chosenSlot = slots.find((s) => s.time === form.time);
      if (!chosenSlot || chosenSlot.isBooked || chosenSlot.isBlocked) {
        return setError("Please pick a valid available time.");
      }

      const durationHours = parseFloat(form.duration) || 1;
      const fits = canFitDurationAtTime(slots, form.time, durationHours);
      if (!fits) {
        return setError(
          "This time does not have enough free hours for the selected duration."
        );
      }
    }

    if (step === 5 && (!form.fullName || !form.email || !form.phone)) {
      return setError("Please fill your personal details.");
    }

    setError("");
    setStep((s) => Math.min(6, s + 1));
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

      if (!field || !field._id) {
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

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await res.json();

      if (!res.ok) {
        setError(created?.message || "Booking failed.");
        return;
      }

      alert(
        `Booking Confirmed!\n\n` +
          `Booking ID: ${created.bookingId}\n` +
          `Field: ${form.courtName}\n` +
          `Date: ${form.date} at ${formatTimeLabel(form.time)}\n` +
          `Duration: ${durationNumber} hour(s)\n` +
          `Total: ${currency} ${totalPrice.toFixed(2)}`
      );

      navigate("/discover");
    } catch (err) {
      console.error("Booking error:", err);
      setError("Something went wrong. Try again.");
    }
  };

  const isActive = (id) => id === step;
  const isCompleted = (id) => id < step;

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

        {/* STEP 1 - SPORT */}
        {step === 1 && (
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

        {/* STEP 2 - AREA */}
        {step === 2 && (
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

        {/* STEP 3 - COURT */}
        {step === 3 && (
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

        {/* STEP 4 - DATE & TIME + AVAILABILITY SLOTS */}
        {step === 4 && (
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
                  <div className="booking-options-grid booking-slots-grid">
                    {slots.map((slot) => {
                      // Duration in hours (can be fractional: 1, 1.5, 2, etc.)
                      const durationHours = parseFloat(form.duration) || 1;

                      // Check if this start time can fit the duration
                      // Each start time is evaluated INDEPENDENTLY
                      const fitsForDuration = canFitDurationAtTime(
                        slots,
                        slot.time,
                        durationHours
                      );

                      const isUnavailable = slot.isBooked || slot.isBlocked;
                      const disabled = isUnavailable || !fitsForDuration;

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
                            !isUnavailable && !fitsForDuration
                              ? "not-enough-time"
                              : "",
                            form.time === slot.time ? "selected" : "",
                          ].join(" ")}
                        >
                          <span>{formatTimeLabel(slot.time)}</span>
                          <small>
                            {slot.isBlocked
                              ? "Unavailable"
                              : slot.isBooked
                              ? "Booked"
                              : fitsForDuration
                              ? "Available"
                              : "Not enough time"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
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

        {/* STEP 5 - USER DETAILS */}
        {step === 5 && (
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

        {/* STEP 6 - REVIEW */}
        {step === 6 && (
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

          {step < 6 ? (
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
            >
              Confirm Booking
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
