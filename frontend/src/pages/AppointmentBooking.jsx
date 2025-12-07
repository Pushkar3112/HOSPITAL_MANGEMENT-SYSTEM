import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { doctorSearchService, appointmentService } from "../services";
import {
  MdCalendarToday,
  MdSchedule,
  MdCheckCircle,
  MdCreditCard,
} from "react-icons/md";

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Doctor, 2: DateTime, 3: Payment
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    specialization: "",
    minFee: "",
    maxFee: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [visitType, setVisitType] = useState("ONLINE");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load doctors on mount and filter changes
  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.specialization, filters.minFee, filters.maxFee]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorSearchService.searchDoctors(filters);
      setDoctors(response.data.data?.doctors || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      setBookingError("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const response = await doctorSearchService.getDoctorSlots(doctorId, date);
      setAvailableSlots(response.data.data?.slots || []);
      if (!response.data.data?.slots || response.data.data.slots.length === 0) {
        setBookingError("No slots available for this date");
      } else {
        setBookingError("");
      }
    } catch (error) {
      console.error("Failed to load slots:", error);
      setBookingError("Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate("");
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (selectedDoctor && date) {
      loadSlots(selectedDoctor._id, date);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setBookingError("Please select doctor, date, and time slot");
      return;
    }

    if (!reasonForVisit.trim()) {
      setBookingError("Please provide reason for visit");
      return;
    }

    setLoading(true);
    try {
      const response = await appointmentService.createAppointment({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        visitType: visitType,
        reasonForVisit: reasonForVisit,
      });

      const { appointment, order } = response.data.data;
      setPaymentDetails({
        ...order,
        appointmentId: appointment._id,
      });
      setStep(3); // Go to payment step
      setBookingError("");
    } catch (error) {
      console.error("Failed to book appointment:", error);
      setBookingError(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentDetails || !paymentDetails.id) {
      setBookingError("Payment details missing. Please try again.");
      console.error("Missing payment details:", paymentDetails);
      return;
    }

    console.log("[handlePayment] Payment Details:", paymentDetails);

    // Real Razorpay payment
    if (!window.Razorpay) {
      setBookingError(
        "Payment gateway not available. Please refresh the page."
      );
      return;
    }

    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
    console.log("[handlePayment] Using Razorpay Key:", razorpayKey);

    const options = {
      key: razorpayKey,
      amount: paymentDetails.amount,
      currency: "INR",
      name: "Hospital Management System",
      description: `Appointment with ${selectedDoctor.user?.name || "Doctor"}`,
      order_id: paymentDetails.id,
      handler: async (response) => {
        try {
          console.log("[handlePayment] Payment successful:", response);

          // Verify payment with backend
          const verifyResponse = await appointmentService.verifyPayment({
            appointmentId: paymentDetails.appointmentId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          console.log(
            "[handlePayment] Verification successful:",
            verifyResponse
          );
          alert("✅ Appointment booked successfully!");
          setBookingError("");

          // Redirect to dashboard
          setTimeout(() => {
            navigate("/patient/dashboard");
          }, 1500);
        } catch (error) {
          console.error("[handlePayment] Verification failed:", error);
          setBookingError(
            error.response?.data?.message || "Payment verification failed"
          );
        }
      },
      modal: {
        ondismiss: () => {
          console.log("[handlePayment] Payment modal closed");
          setBookingError("Payment cancelled");
        },
      },
      prefill: {
        name: "Patient",
        email: "patient@example.com",
      },
      theme: {
        color: "#0066cc",
      },
    };

    try {
      console.log("[handlePayment] Opening Razorpay checkout...");
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("[handlePayment] Razorpay initialization error:", error);
      setBookingError("Failed to open payment gateway: " + error.message);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const sidebarItems = [
    {
      path: "/patient/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/patient/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/patient/profile", label: "My Profile" },
    { path: "/patient/symptom-checker", label: "Symptom Checker" },
    { path: "/patient/medical-history", label: "Medical History" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Book Appointment" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {/* Progress Steps */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "30px",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  opacity: step >= 1 ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: step >= 1 ? "#0066cc" : "#ddd",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: "600",
                  }}
                >
                  {step > 1 ? <MdCheckCircle size={24} /> : "1"}
                </div>
                <small>Select Doctor</small>
              </div>
              <div
                style={{
                  textAlign: "center",
                  opacity: step >= 2 ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: step >= 2 ? "#0066cc" : "#ddd",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: "600",
                  }}
                >
                  {step > 2 ? <MdCheckCircle size={24} /> : "2"}
                </div>
                <small>Select Time</small>
              </div>
              <div
                style={{
                  textAlign: "center",
                  opacity: step >= 3 ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: step >= 3 ? "#0066cc" : "#ddd",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: "600",
                  }}
                >
                  <MdCreditCard size={20} />
                </div>
                <small>Payment</small>
              </div>
            </div>

            {bookingError && (
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
                {bookingError}
              </div>
            )}

            {/* Step 1: Doctor Selection */}
            {step === 1 && (
              <>
                <Card title="Step 1: Search and Select Doctor">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Specialization (e.g., Cardiology)"
                      value={filters.specialization}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          specialization: e.target.value,
                        })
                      }
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Min Fee (₹)"
                      value={filters.minFee}
                      onChange={(e) =>
                        setFilters({ ...filters, minFee: e.target.value })
                      }
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max Fee (₹)"
                      value={filters.maxFee}
                      onChange={(e) =>
                        setFilters({ ...filters, maxFee: e.target.value })
                      }
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                  </div>

                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "15px",
                    }}
                  >
                    Available Doctors:
                  </label>
                  {loading ? (
                    <p style={{ color: "#666" }}>Loading doctors...</p>
                  ) : doctors.length > 0 ? (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {doctors.map((doctor) => (
                        <div
                          key={doctor._id}
                          onClick={() => handleDoctorSelect(doctor)}
                          style={{
                            padding: "15px",
                            border:
                              selectedDoctor?._id === doctor._id
                                ? "2px solid #0066cc"
                                : "1px solid #ddd",
                            borderRadius: "8px",
                            cursor: "pointer",
                            backgroundColor:
                              selectedDoctor?._id === doctor._id
                                ? "#f0f7ff"
                                : "#f9f9f9",
                            transition: "all 0.3s",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <h4 style={{ margin: "0 0 8px 0" }}>
                                {doctor.user?.name || "Doctor"}
                              </h4>
                              <p
                                style={{
                                  margin: "0 0 5px 0",
                                  color: "#666",
                                  fontSize: "14px",
                                }}
                              >
                                {doctor.specialization}
                              </p>
                              <p
                                style={{
                                  margin: "0",
                                  color: "#999",
                                  fontSize: "13px",
                                }}
                              >
                                {doctor.hospitalName} •{" "}
                                {doctor.yearsOfExperience} yrs exp
                              </p>
                            </div>
                            <div
                              style={{
                                textAlign: "right",
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#0066cc",
                              }}
                            >
                              ₹{doctor.consultationFee}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#999" }}>
                      No doctors found. Try adjusting your filters.
                    </p>
                  )}
                </Card>

                <div style={{ textAlign: "right", marginTop: "20px" }}>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDoctor}
                    style={{
                      padding: "12px 30px",
                      backgroundColor: selectedDoctor ? "#0066cc" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: selectedDoctor ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    Next: Select Date & Time
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Date and Time Selection */}
            {step === 2 && selectedDoctor && (
              <>
                <Card
                  title={`Step 2: Book with Dr. ${
                    selectedDoctor.user?.name || "Doctor"
                  }`}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "10px",
                        }}
                      >
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        min={getTomorrowDate()}
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
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "10px",
                        }}
                      >
                        Visit Type
                      </label>
                      <select
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "16px",
                        }}
                      >
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">In-Person</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "10px",
                      }}
                    >
                      Reason for Visit
                    </label>
                    <textarea
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="Describe your symptoms or reason for consultation"
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontFamily: "inherit",
                        fontSize: "14px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  {selectedDate && (
                    <div style={{ marginTop: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "15px",
                        }}
                      >
                        Available Time Slots
                      </label>
                      {slotsLoading ? (
                        <p style={{ color: "#666" }}>
                          Loading available slots...
                        </p>
                      ) : availableSlots.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(120px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedSlot(slot)}
                              style={{
                                padding: "12px 10px",
                                border:
                                  selectedSlot?.startTime === slot.startTime
                                    ? "2px solid #0066cc"
                                    : "1px solid #ddd",
                                borderRadius: "6px",
                                backgroundColor:
                                  selectedSlot?.startTime === slot.startTime
                                    ? "#f0f7ff"
                                    : "white",
                                cursor: "pointer",
                                fontWeight:
                                  selectedSlot?.startTime === slot.startTime
                                    ? "600"
                                    : "500",
                                color:
                                  selectedSlot?.startTime === slot.startTime
                                    ? "#0066cc"
                                    : "#333",
                                transition: "all 0.3s",
                              }}
                            >
                              <div
                                style={{ fontSize: "14px", fontWeight: "600" }}
                              >
                                {slot.startTime}
                              </div>
                              <div
                                style={{ fontSize: "12px", marginTop: "4px" }}
                              >
                                {slot.endTime}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "#999" }}>
                          No slots available for this date
                        </p>
                      )}
                    </div>
                  )}
                </Card>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setStep(1)}
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
                    Back
                  </button>
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || !reasonForVisit.trim()}
                    style={{
                      padding: "12px 30px",
                      backgroundColor:
                        selectedSlot && reasonForVisit.trim()
                          ? "#0066cc"
                          : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        selectedSlot && reasonForVisit.trim()
                          ? "pointer"
                          : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    Next: Payment
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Payment */}
            {step === 3 && paymentDetails && (
              <>
                <Card title="Step 3: Confirm & Pay">
                  <div
                    style={{
                      backgroundColor: "#f9f9f9",
                      padding: "20px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <h3 style={{ marginTop: "0" }}>Appointment Summary</h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "14px",
                            margin: "0 0 5px 0",
                          }}
                        >
                          Doctor
                        </p>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0",
                          }}
                        >
                          {selectedDoctor?.user?.name || "Doctor"}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "14px",
                            margin: "0 0 5px 0",
                          }}
                        >
                          Specialization
                        </p>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0",
                          }}
                        >
                          {selectedDoctor?.specialization}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "14px",
                            margin: "0 0 5px 0",
                          }}
                        >
                          Date & Time
                        </p>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0",
                          }}
                        >
                          {selectedDate} {selectedSlot?.startTime} -{" "}
                          {selectedSlot?.endTime}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "14px",
                            margin: "0 0 5px 0",
                          }}
                        >
                          Visit Type
                        </p>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: "0",
                          }}
                        >
                          {visitType}
                        </p>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "14px",
                            margin: "0 0 5px 0",
                          }}
                        >
                          Reason
                        </p>
                        <p style={{ fontSize: "16px", margin: "0" }}>
                          {reasonForVisit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#f0f7ff",
                      borderRadius: "8px",
                      border: "1px solid #0066cc",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "18px", fontWeight: "600" }}>
                        Total Amount:
                      </span>
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: "bold",
                          color: "#0066cc",
                        }}
                      >
                        ₹{paymentDetails.amount / 100}
                      </span>
                    </div>
                  </div>
                </Card>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setStep(2)}
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
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#06a77d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <MdCreditCard /> Pay Now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
};

export default AppointmentBooking;
