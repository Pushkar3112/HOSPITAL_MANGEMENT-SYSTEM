import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    adminAPI.getUsers({ search, role: roleFilter, page, limit: 20 })
      .then((res) => setUsers(res.data.data?.users || res.data.data || []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, roleFilter, page]);

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleUserStatus(id);
      toast.success("User status updated");
      load();
    } catch { toast.error("Failed"); }
  };

  const handleVerifyDoctor = async (id) => {
    try {
      await adminAPI.verifyDoctor(id);
      toast.success("Doctor verified");
      load();
    } catch { toast.error("Failed to verify doctor"); }
  };

  const roleBadge = { PATIENT: "badge-teal", DOCTOR: "badge-blue", ADMIN: "badge-rose" };

  return (
    <AppLayout title="User Management" subtitle="Manage all users and doctors">
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span style={{ color: "var(--text-muted)" }}>🔍</span>
          <input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: "auto", minWidth: 140 }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="PATIENT">Patients</option>
          <option value="DOCTOR">Doctors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">👥 Users ({users.length})</h3>
        </div>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No users found</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                          {u.avatar ? <img src={u.avatar} alt="" /> : u.name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleBadge[u.role] || "badge-muted"}`}>{u.role}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-green" : "badge-rose"}`}>
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {u.role === "DOCTOR" && !u.doctorProfile?.isVerified && (
                          <button className="btn btn-success btn-sm" onClick={() => handleVerifyDoctor(u.id)}>✓ Verify</button>
                        )}
                        {u.role === "DOCTOR" && u.doctorProfile?.isVerified && (
                          <span className="badge badge-green">✓ Verified</span>
                        )}
                        <button
                          className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
                          onClick={() => handleToggleStatus(u.id)}
                        >
                          {u.isActive ? "Block" : "Unblock"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
