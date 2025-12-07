import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { doctorSearchService, appointmentService } from "../services";
import { MdCalendarToday, MdSchedule } from "react-icons/md";
import { formatDate } from "../utils/dateUtils";

const DoctorBookingPage = () => {
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

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.specialization, filters.minFee, filters.maxFee]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorSearchService.searchDoctors(filters);
      setDoctors(response.data.data.doctors);
    } catch (error) {
      console.error("Failed to load doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (doctorId, date) => {
    try {
      const response = await doctorSearchService.getDoctorSlots(doctorId, date);
      setAvailableSlots(response.data.data.slots);
    } catch (error) {
      console.error("Failed to load slots:", error);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (selectedDoctor && date) {
      loadSlots(selectedDoctor._id, date);
    }
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      alert("Please select doctor, date and time slot");
      return;
    }

    try {
      const response = await appointmentService.createAppointment({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        visitType: "ONLINE",
        reasonForVisit: "General Consultation",
      });

      // Redirect to payment
      const { order } = response.data.data;
      // TODO: Integrate Razorpay
      alert("Appointment created! Implement payment integration");
    } catch (error) {
      console.error("Failed to book appointment:", error);
      alert(error.response?.data?.message || "Booking failed");
    }
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
            {/* Search Filters */}
            <Card title="Search Doctors">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Specialization"
                  value={filters.specialization}
                  onChange={(e) =>
                    setFilters({ ...filters, specialization: e.target.value })
                  }
                  className="form-control"
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Min Fee"
                  value={filters.minFee}
                  onChange={(e) =>
                    setFilters({ ...filters, minFee: e.target.value })
                  }
                  className="form-control"
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Max Fee"
                  value={filters.maxFee}
                  onChange={(e) =>
                    setFilters({ ...filters, maxFee: e.target.value })
                  }
                  className="form-control"
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>
            </Card>

            {/* Doctors List */}
            <Card title="Available Doctors">
              {loading ? (
                <Loading />
              ) : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {doctors.map((doctor) => (
                    <div
                      key={doctor._id}
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
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedDate("");
                        setAvailableSlots([]);
                      }}
                    >
                      <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                        {doctor.user?.name}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 5px 0",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        {doctor.specialization} • ₹{doctor.consultationFee}
                        /consultation
                      </p>
                      <p
                        style={{ margin: "0", color: "#999", fontSize: "14px" }}
                      >
                        {doctor.hospitalName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Date and Time Selection */}
            {selectedDoctor && (
              <Card title="Select Date and Time">
                <div className="form-group">
                  <label>Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={formatDate(new Date()).replace(/\//g, "-")}
                  />
                </div>

                {availableSlots.length > 0 && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "15px",
                        fontWeight: "600",
                      }}
                    >
                      Available Slots
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.startTime}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: "10px",
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
                          }}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  className="btn btn-primary"
                  style={{ marginTop: "20px", width: "100%" }}
                >
                  Proceed to Payment
                </button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorBookingPage;
