import React, { useEffect, useState } from "react";
import { patientAPI } from "../services/api";
import AppLayout from "../components/AppLayout";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.getInvoices()
      .then((res) => setInvoices(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const statusConfig = {
    PAID: { color: "badge-green", label: "Paid" },
    UNPAID: { color: "badge-rose", label: "Unpaid" },
    PENDING: { color: "badge-amber", label: "Pending" },
    REFUNDED: { color: "badge-blue", label: "Refunded" },
  };

  return (
    <AppLayout title="Invoices" subtitle="Billing history and payment records">
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧾</div>
          <div className="empty-title">No invoices yet</div>
          <div className="empty-subtitle">Your billing history will appear here after consultations</div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">🧾 Billing History ({invoices.length})</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Dr. {inv.doctor?.name}</div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{formatDate(inv.createdAt)}</td>
                    <td>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-teal)" }}>₹{inv.totalAmount?.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="badge badge-muted">{inv.paymentMode}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusConfig[inv.paymentStatus]?.color || "badge-muted"}`}>
                        {statusConfig[inv.paymentStatus]?.label || inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Invoices;
