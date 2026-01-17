// src/dashboard/components/AvailabilityCalendar.jsx
import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";


const API_URL = `${API_BASE}`;

// Generate time slots based on opening hours
const generateTimeSlots = (openHour = 8, closeHour = 23) => {
  const slots = [];
  for (let h = openHour; h < closeHour; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Get days in month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get first day of month (0 = Sunday)
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

export default function AvailabilityCalendar({ fieldId, openingHours, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Selected time slots for the selected date
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // Parse opening hours
  const openHour = parseInt(openingHours?.open?.split(":")[0]) || 8;
  const closeHour = parseInt(openingHours?.close?.split(":")[0]) || 23;
  const timeSlots = generateTimeSlots(openHour, closeHour);
  
  const getToken = () => localStorage.getItem("ownerToken") || "";
  
  // Fetch blocked availability
  const fetchBlocked = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      
      const res = await fetch(`${API_URL}/api/fields/${fieldId}/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch availability");
      
      const data = await res.json();
      setBlockedDates(data.blockedDates || []);
      setBlockedTimeSlots(data.blockedTimeSlots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fieldId]);
  
  useEffect(() => {
    if (fieldId) {
      fetchBlocked();
    }
  }, [fieldId, fetchBlocked]);
  
  // Check if a date is fully blocked
  const isDateFullyBlocked = (dateStr) => {
    return blockedDates.includes(dateStr);
  };
  
  // Check if a date has some blocked slots
  const hasBlockedSlots = (dateStr) => {
    const entry = blockedTimeSlots.find((e) => e.date === dateStr);
    return entry && entry.timeSlots && entry.timeSlots.length > 0;
  };
  
  // Get blocked slots for a date
  const getBlockedSlotsForDate = (dateStr) => {
    const entry = blockedTimeSlots.find((e) => e.date === dateStr);
    return entry?.timeSlots || [];
  };
  
  // Handle date click
  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    // Pre-select already blocked slots for this date
    if (isDateFullyBlocked(dateStr)) {
      setSelectedSlots([...timeSlots]); // All slots
    } else {
      setSelectedSlots(getBlockedSlotsForDate(dateStr));
    }
  };
  
  // Toggle slot selection
  const toggleSlot = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };
  
  // Select all slots
  const selectAllSlots = () => {
    setSelectedSlots([...timeSlots]);
  };
  
  // Clear all slots
  const clearAllSlots = () => {
    setSelectedSlots([]);
  };
  
  // Block selected date/slots
  const handleBlock = async () => {
    if (!selectedDate) return;
    
    try {
      setSaving(true);
      setError("");
      const token = getToken();
      
      if (selectedSlots.length === timeSlots.length) {
        // Block entire date
        await fetch(`${API_URL}/api/fields/${fieldId}/block-dates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dates: [selectedDate] }),
        });
      } else if (selectedSlots.length > 0) {
        // Block specific time slots
        await fetch(`${API_URL}/api/fields/${fieldId}/block-slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date: selectedDate, timeSlots: selectedSlots }),
        });
      }
      
      await fetchBlocked();
      setSelectedDate(null);
      setSelectedSlots([]);
    } catch (err) {
      setError("Failed to block availability");
    } finally {
      setSaving(false);
    }
  };
  
  // Unblock selected date/slots
  const handleUnblock = async () => {
    if (!selectedDate) return;
    
    try {
      setSaving(true);
      setError("");
      const token = getToken();
      
      // First unblock the full date if blocked
      if (isDateFullyBlocked(selectedDate)) {
        await fetch(`${API_URL}/api/fields/${fieldId}/unblock-dates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dates: [selectedDate] }),
        });
      }
      
      // Then unblock time slots
      const currentBlocked = getBlockedSlotsForDate(selectedDate);
      if (currentBlocked.length > 0) {
        await fetch(`${API_URL}/api/fields/${fieldId}/unblock-slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date: selectedDate, timeSlots: currentBlocked }),
        });
      }
      
      await fetchBlocked();
      setSelectedDate(null);
      setSelectedSlots([]);
    } catch (err) {
      setError("Failed to unblock availability");
    } finally {
      setSaving(false);
    }
  };
  
  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Render calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = formatDate(new Date());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Build calendar grid
  const calendarDays = [];
  
  // Empty cells for days before first day
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading availability...</div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Manage Availability</h3>
        <p style={styles.subtitle}>Block dates or time slots to prevent bookings</p>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.content}>
        {/* Calendar */}
        <div style={styles.calendarSection}>
          {/* Month Navigation */}
          <div style={styles.monthNav}>
            <button onClick={prevMonth} style={styles.navBtn}>←</button>
            <span style={styles.monthLabel}>{monthNames[month]} {year}</span>
            <button onClick={nextMonth} style={styles.navBtn}>→</button>
          </div>
          
          {/* Day Headers */}
          <div style={styles.dayHeaders}>
            {dayNames.map((d) => (
              <div key={d} style={styles.dayHeader}>{d}</div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div style={styles.calendarGrid}>
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} style={styles.emptyCell} />;
              }
              
              const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const isPast = dateStr < today;
              const isSelected = dateStr === selectedDate;
              const isFullyBlocked = isDateFullyBlocked(dateStr);
              const hasPartialBlocks = hasBlockedSlots(dateStr);
              
              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  disabled={isPast}
                  style={{
                    ...styles.dayCell,
                    ...(isPast && styles.pastDay),
                    ...(isSelected && styles.selectedDay),
                    ...(isFullyBlocked && !isSelected && styles.blockedDay),
                    ...(hasPartialBlocks && !isFullyBlocked && !isSelected && styles.partialDay),
                  }}
                >
                  {day}
                  {isFullyBlocked && <span style={styles.blockIndicator}>●</span>}
                  {hasPartialBlocks && !isFullyBlocked && <span style={styles.partialIndicator}>◐</span>}
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#ef4444" }} /> Fully Blocked
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#f59e0b" }} /> Partial Block
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#3b82f6" }} /> Selected
            </span>
          </div>
        </div>
        
        {/* Time Slots */}
        {selectedDate && (
          <div style={styles.slotsSection}>
            <div style={styles.slotHeader}>
              <h4 style={styles.slotTitle}>
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h4>
              <div style={styles.slotActions}>
                <button onClick={selectAllSlots} style={styles.smallBtn}>Select All</button>
                <button onClick={clearAllSlots} style={styles.smallBtn}>Clear</button>
              </div>
            </div>
            
            <div style={styles.slotsGrid}>
              {timeSlots.map((slot) => {
                const isBlocked = getBlockedSlotsForDate(selectedDate).includes(slot);
                const isSelected = selectedSlots.includes(slot);
                
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    style={{
                      ...styles.slotBtn,
                      ...(isSelected && styles.slotSelected),
                      ...(isBlocked && !isSelected && styles.slotBlocked),
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            
            <div style={styles.actionBar}>
              <button
                onClick={handleBlock}
                disabled={saving || selectedSlots.length === 0}
                style={{
                  ...styles.primaryBtn,
                  opacity: saving || selectedSlots.length === 0 ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : `Block ${selectedSlots.length} Slot${selectedSlots.length !== 1 ? "s" : ""}`}
              </button>
              
              {(isDateFullyBlocked(selectedDate) || hasBlockedSlots(selectedDate)) && (
                <button
                  onClick={handleUnblock}
                  disabled={saving}
                  style={styles.dangerBtn}
                >
                  Unblock All
                </button>
              )}
            </div>
          </div>
        )}
        
        {!selectedDate && (
          <div style={styles.placeholder}>
            <p style={{ color: "#6b7280", textAlign: "center" }}>
              Select a date on the calendar to manage its availability
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={onClose} style={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f3f5",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#1f2937",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    minHeight: "400px",
  },
  calendarSection: {
    padding: "20px",
    borderRight: "1px solid #f1f3f5",
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  navBtn: {
    width: "32px",
    height: "32px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#374151",
  },
  monthLabel: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1f2937",
  },
  dayHeaders: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    marginBottom: "8px",
  },
  dayHeader: {
    textAlign: "center",
    fontSize: "11px",
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    padding: "4px",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
  },
  emptyCell: {
    aspectRatio: "1",
  },
  dayCell: {
    aspectRatio: "1",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  pastDay: {
    background: "#f9fafb",
    color: "#d1d5db",
    cursor: "not-allowed",
  },
  selectedDay: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff",
  },
  blockedDay: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#dc2626",
  },
  partialDay: {
    background: "#fffbeb",
    borderColor: "#fde68a",
    color: "#d97706",
  },
  blockIndicator: {
    position: "absolute",
    bottom: "2px",
    right: "4px",
    fontSize: "6px",
    color: "#ef4444",
  },
  partialIndicator: {
    position: "absolute",
    bottom: "2px",
    right: "4px",
    fontSize: "8px",
    color: "#f59e0b",
  },
  legend: {
    display: "flex",
    gap: "16px",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f3f5",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#6b7280",
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  slotsSection: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },
  slotHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  slotTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#1f2937",
  },
  slotActions: {
    display: "flex",
    gap: "8px",
  },
  smallBtn: {
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 500,
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#6b7280",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    flex: 1,
    overflow: "auto",
    maxHeight: "280px",
  },
  slotBtn: {
    padding: "8px 6px",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#374151",
    transition: "all 0.15s ease",
  },
  slotSelected: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff",
  },
  slotBlocked: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#dc2626",
  },
  actionBar: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f3f5",
  },
  primaryBtn: {
    flex: 1,
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 600,
    border: "none",
    background: "#3b82f6",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
  },
  dangerBtn: {
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#dc2626",
  },
  placeholder: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9fafb",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #f1f3f5",
    display: "flex",
    justifyContent: "flex-end",
  },
  closeBtn: {
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#374151",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },
  error: {
    margin: "0 24px",
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "13px",
  },
};

