import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import usePatient from "../hooks/usePatient";
import { MdCalendarToday, MdSchedule } from "react-icons/md";
import { formatDate } from "../utils/dateUtils";

const Invoices = () => {
    const patient = usePatient();

    useEffect(() => {
        patient.loadInvoices();
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
                <TopBar title="My Invoices" />
                <div style={{ flex: 1, overflow: "auto", padding: "30px", backgroundColor: "#f5f5f5" }}>
                    <div className="container">
                        {patient.isLoading ? (
                            <p>Loading invoices...</p>
                        ) : patient.invoices && patient.invoices.length > 0 ? (
                            <div style={{ display: "grid", gap: "20px" }}>
                                {patient.invoices.map((inv, index) => (
                                    <Card key={inv.id || index} title={`Invoice #${index + 1}`}>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Doctor</label>
                                                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                                                    {inv.doctor?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Date</label>
                                                <p style={{ fontSize: "16px", fontWeight: "600" }}>
                                                    {inv.createdAt ? formatDate(new Date(inv.createdAt)) : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Total Amount</label>
                                                <p style={{ fontSize: "20px", fontWeight: "700", color: "#0066cc" }}>
                                                    ₹{inv.totalAmount}
                                                </p>
                                            </div>
                                            <div>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Payment Status</label>
                                                <p>
                                                    <span
                                                        style={{
                                                            padding: "4px 12px",
                                                            borderRadius: "20px",
                                                            fontSize: "13px",
                                                            fontWeight: "600",
                                                            backgroundColor: inv.paymentStatus === "PAID" ? "#d4edda" : "#fff3cd",
                                                            color: inv.paymentStatus === "PAID" ? "#155724" : "#856404",
                                                        }}
                                                    >
                                                        {inv.paymentStatus}
                                                    </span>
                                                </p>
                                            </div>
                                            <div style={{ gridColumn: "1 / -1" }}>
                                                <label style={{ color: "#666", fontSize: "14px" }}>Items</label>
                                                <div style={{ marginTop: "8px" }}>
                                                    {inv.items?.map((item, i) => (
                                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                                                            <span>{item.label}</span>
                                                            <strong>₹{item.amount}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card title="Invoices">
                                <p style={{ color: "#666" }}>No invoices found</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
