import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { adminService } from "../services";
import { MdDashboard, MdPeople, MdSchedule } from "react-icons/md";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <MdDashboard />,
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: <MdPeople />,
    },
    {
      path: "/admin/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Manage Users" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {loading ? (
              <p>Loading users...</p>
            ) : users.length > 0 ? (
              <Card title="All Users">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Name
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Email
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Role
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Phone
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td style={{ padding: "12px" }}>{user.name}</td>
                        <td style={{ padding: "12px" }}>{user.email}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor:
                                user.role === "ADMIN"
                                  ? "#fee"
                                  : user.role === "DOCTOR"
                                  ? "#efe"
                                  : "#eef",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{user.phone}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              color: user.isActive ? "#06a77d" : "#d62828",
                              fontWeight: "600",
                            }}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card title="Users">
                <p style={{ color: "#666" }}>No users found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
