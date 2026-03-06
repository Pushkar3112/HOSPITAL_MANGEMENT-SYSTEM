import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import usePatient from "../hooks/usePatient";
import { MdCalendarToday, MdSchedule } from "react-icons/md";
import { formatDate } from "../utils/dateUtils";

const Prescriptions = () => {
    const patient = usePatient();

    useEffect(() => {
        patient.loadPrescriptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sidebarItems = [
        { path: "/patient/dashboard", label: "Dashboard", icon: <MdCalendarToday /> },
        { path: "/patient/appointments", label: "Appointments", icon: <MdSchedule /> },
        { path: "/patient/profile", label: "My Profile" },
        { path: "/patient/symptom-checker", label: "Symptom Checker" },
        { path: "/patient/medical-history", label: "Medical History" },
        { path: "/patient/prescriptions", label: "Prescriptions" },
        { path: "/patient/invoices", label: "Invoices" },
    ];

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <Sidebar items={sidebarItems} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <TopBar title="My Prescriptions" />
                <div style={{ flex: 1, overflow: "auto", padding: "30px", backgroundColor: "#f5f5f5" }}>
                    <div className="container">
                        {patient.isLoading ? (
                            <p>Loading prescriptions...</p>
                        ) : patient.prescriptions && patient.prescriptions.length > 0 ? (
                            <div style={{ display: "grid", gap: "20px" }}>
                                {patient.prescriptions.map((rx, index) => (
                                    <Card key={rx.id || index} title={`Prescription ${index + 1}`}>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Prescribed By</label>
                                                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                                                    {rx.doctor?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Date</label>
                                                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                                                    {rx.createdAt ? formatDate(new Date(rx.createdAt)) : "N/A"}
                                                </p>
                                            </div>
                                            <div style={{ gridColumn: "1 / -1" }}>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Medications</label>
                                                <div style={{ marginTop: "8px" }}>
                                                    {rx.medications?.map((med, i) => (
                                                        <div key={i} style={{ padding: "10px", marginBottom: "8px", border: "1px solid #e0e0e0", borderRadius: "6px", backgroundColor: "#fafafa" }}>
                                                            <strong>{med.name}</strong> — {med.dosage}
                                                            <br />
                                                            <span style={{ color: "#666", fontSize: "14px" }}>
                                                                {med.frequency} for {med.duration} {med.notes ? `(${med.notes})` : ""}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {rx.lifestyleAdvice && (
                                                <div style={{ gridColumn: "1 / -1" }}>
                                                    <label style={{ color: "#666", fontSize: "14px" }}>Lifestyle Advice</label>
                                                    <p style={{ fontSize: "16px", fontWeight: "600" }}>{rx.lifestyleAdvice}</p>
                                                </div>
                                            )}
                                            {rx.followUpDate && (
                                                <div>
                                                    <label style={{ color: "#666", fontSize: "14px" }}>Follow-up Date</label>
                                                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                                                        {formatDate(new Date(rx.followUpDate))}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card title="Prescriptions">
                                <p style={{ color: "#666" }}>No prescriptions found</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prescriptions;
