import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { doctorService } from "../services";
import { MdCalendarToday, MdSchedule, MdEdit, MdSave } from "react-icons/md";

const DoctorAvailability = () => {
  const [availability, setAvailability] = useState({
    availableDays: [1, 2, 3, 4, 5], // Monday to Friday
    dailyStartTime: "09:00",
    dailyEndTime: "17:00",
    slotDurationMinutes: 30,
    customBreaks: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newBreak, setNewBreak] = useState({
    startTime: "12:00",
    endTime: "13:00",
    reason: "Lunch",
  });

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getProfile();
      const profile = response.data.data;
      setAvailability({
        availableDays: profile.availableDays || [1, 2, 3, 4, 5],
        dailyStartTime: profile.dailyStartTime || "09:00",
        dailyEndTime: profile.dailyEndTime || "17:00",
        slotDurationMinutes: profile.slotDurationMinutes || 30,
        customBreaks: profile.customBreaks || [],
      });
    } catch (error) {
      console.error("Failed to load availability:", error);
      setError("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day].sort(),
    }));
  };

  const addBreak = () => {
    if (!newBreak.startTime || !newBreak.endTime || !newBreak.reason) {
      setError("Please fill in all break details");
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      customBreaks: [
        ...prev.customBreaks,
        {
          ...newBreak,
          id: Date.now(),
        },
      ],
    }));

    setNewBreak({ startTime: "12:00", endTime: "13:00", reason: "Lunch" });
    setError("");
  };

  const removeBreak = (id) => {
    setAvailability((prev) => ({
      ...prev,
      customBreaks: prev.customBreaks.filter((b) => b.id !== id),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await doctorService.updateProfile({
        availableDays: availability.availableDays,
        dailyStartTime: availability.dailyStartTime,
        dailyEndTime: availability.dailyEndTime,
        slotDurationMinutes: availability.slotDurationMinutes,
        customBreaks: availability.customBreaks.map(({ id, ...rest }) => rest),
      });

      setSuccess("Availability updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to save availability:", error);
      setError("Failed to save availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      path: "/doctor/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/doctor/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/doctor/profile", label: "My Profile" },
    { path: "/doctor/availability", label: "Availability" },
    { path: "/doctor/prescriptions", label: "Prescriptions" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Manage Availability" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {error && (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fee",
                  color: "#c33",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  border: "1px solid #fcc",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#efe",
                  color: "#060",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  border: "1px solid #cfc",
                }}
              >
                {success}
              </div>
            )}

            <Card title="Weekly Availability">
              {!isEditing ? (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        marginBottom: "10px",
                        display: "block",
                      }}
                    >
                      Available Days
                    </label>
                    <div
                      style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                    >
                      {daysOfWeek.map((day, index) => (
                        <span
                          key={index}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            backgroundColor:
                              availability.availableDays.includes(index)
                                ? "#0066cc"
                                : "#e0e0e0",
                            color: availability.availableDays.includes(index)
                              ? "white"
                              : "#666",
                            fontWeight: "600",
                            fontSize: "14px",
                          }}
                        >
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        Daily Start Time
                      </label>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "8px 0 0 0",
                        }}
                      >
                        {availability.dailyStartTime}
                      </p>
                    </div>
                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        Daily End Time
                      </label>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "8px 0 0 0",
                        }}
                      >
                        {availability.dailyEndTime}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Slot Duration
                    </label>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        margin: "8px 0 0 0",
                      }}
                    >
                      {availability.slotDurationMinutes} minutes
                    </p>
                  </div>

                  {availability.customBreaks.length > 0 && (
                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          marginBottom: "10px",
                          display: "block",
                        }}
                      >
                        Custom Breaks
                      </label>
                      <div style={{ display: "grid", gap: "10px" }}>
                        {availability.customBreaks.map((brk) => (
                          <div
                            key={brk.id}
                            style={{
                              padding: "12px",
                              backgroundColor: "#fffbe6",
                              borderRadius: "6px",
                              border: "1px solid #f4a460",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: "0 0 5px 0",
                                  fontWeight: "600",
                                }}
                              >
                                {brk.reason}
                              </p>
                              <p
                                style={{
                                  margin: "0",
                                  color: "#666",
                                  fontSize: "14px",
                                }}
                              >
                                {brk.startTime} - {brk.endTime}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      marginTop: "20px",
                      padding: "12px 30px",
                      backgroundColor: "#0066cc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <MdEdit /> Edit Availability
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontWeight: "600",
                        marginBottom: "10px",
                        display: "block",
                      }}
                    >
                      Select Available Days (Click to toggle)
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(100px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {daysOfWeek.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleDay(index)}
                          style={{
                            padding: "12px",
                            borderRadius: "6px",
                            border: availability.availableDays.includes(index)
                              ? "2px solid #0066cc"
                              : "1px solid #ddd",
                            backgroundColor:
                              availability.availableDays.includes(index)
                                ? "#f0f7ff"
                                : "white",
                            color: availability.availableDays.includes(index)
                              ? "#0066cc"
                              : "#666",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s",
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Daily Start Time
                      </label>
                      <input
                        type="time"
                        value={availability.dailyStartTime}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            dailyStartTime: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "16px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Daily End Time
                      </label>
                      <input
                        type="time"
                        value={availability.dailyEndTime}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            dailyEndTime: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "16px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        Slot Duration (minutes)
                      </label>
                      <select
                        value={availability.slotDurationMinutes}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            slotDurationMinutes: parseInt(e.target.value),
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "16px",
                        }}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                  </div>

                  <Card title="Add Custom Break (Lunch, etc.)">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "15px",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "5px",
                            display: "block",
                          }}
                        >
                          Break Start Time
                        </label>
                        <input
                          type="time"
                          value={newBreak.startTime}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              startTime: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "5px",
                            display: "block",
                          }}
                        >
                          Break End Time
                        </label>
                        <input
                          type="time"
                          value={newBreak.endTime}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              endTime: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "5px",
                            display: "block",
                          }}
                        >
                          Break Reason
                        </label>
                        <input
                          type="text"
                          value={newBreak.reason}
                          onChange={(e) =>
                            setNewBreak({ ...newBreak, reason: e.target.value })
                          }
                          placeholder="e.g., Lunch, Meeting"
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                          onClick={addBreak}
                          style={{
                            width: "100%",
                            padding: "8px",
                            backgroundColor: "#f4a460",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          + Add Break
                        </button>
                      </div>
                    </div>

                    {availability.customBreaks.length > 0 && (
                      <div>
                        <p style={{ fontWeight: "600", marginBottom: "10px" }}>
                          Breaks ({availability.customBreaks.length})
                        </p>
                        <div style={{ display: "grid", gap: "8px" }}>
                          {availability.customBreaks.map((brk) => (
                            <div
                              key={brk.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px",
                                backgroundColor: "#fffbe6",
                                borderRadius: "6px",
                                border: "1px solid #f4a460",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    margin: "0",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                  }}
                                >
                                  {brk.reason}: {brk.startTime} - {brk.endTime}
                                </p>
                              </div>
                              <button
                                onClick={() => removeBreak(brk.id)}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#d62828",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "20px" }}
                  >
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: "12px 30px",
                        backgroundColor: "#ddd",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      style={{
                        padding: "12px 30px",
                        backgroundColor: loading ? "#ccc" : "#06a77d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <MdSave /> {loading ? "Saving..." : "Save Availability"}
                    </button>
                  </div>
                </div>
              )}
            </Card>

            <Card title="How It Works" style={{ marginTop: "20px" }}>
              <ul style={{ color: "#666", lineHeight: "1.8" }}>
                <li>
                  <strong>Available Days:</strong> Select which days of the week
                  you accept appointments
                </li>
                <li>
                  <strong>Daily Hours:</strong> Set your start and end times for
                  consultations
                </li>
                <li>
                  <strong>Slot Duration:</strong> Define how long each
                  appointment lasts
                </li>
                <li>
                  <strong>Custom Breaks:</strong> Add breaks for lunch,
                  meetings, or other commitments
                </li>
                <li>
                  <strong>Automatic Slots:</strong> System generates available
                  slots automatically based on these settings
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
