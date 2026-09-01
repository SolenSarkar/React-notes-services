import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, usersResponse, notesResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/admin/stats`, {
            headers: authHeaders,
          }),

          fetch(`${API_URL}/api/admin/users?limit=10`, {
            headers: authHeaders,
          }),

          fetch(`${API_URL}/api/admin/notes?limit=10`, {
            headers: authHeaders,
          }),
        ]);

      if (!statsResponse.ok) {
        throw new Error("Unable to load admin statistics");
      }

      if (!usersResponse.ok) {
        throw new Error("Unable to load users");
      }

      if (!notesResponse.ok) {
        throw new Error("Unable to load notes");
      }

      const statsData = await statsResponse.json();
      const usersData = await usersResponse.json();
      const notesData = await notesResponse.json();

      setStats(statsData);
      setUsers(usersData.users || []);
      setNotes(notesData.notes || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/notes/${noteId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note._id !== noteId)
      );

      setStats((currentStats) =>
        currentStats
          ? {
              ...currentStats,
              totalNotes: Math.max(
                0,
                currentStats.totalNotes - 1
              ),
            }
          : currentStats
      );
    } catch (err) {
      console.error("Delete note error:", err);
      alert(err.message);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>React Notes Services</p>
        </div>

        <div className="admin-user">
          <span>
            Welcome, <strong>{user.name}</strong>
          </span>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>

        <button
          className={activeTab === "notes" ? "active" : ""}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
      </nav>

      {loading && (
        <div className="admin-loading">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <main className="admin-content">

          {activeTab === "dashboard" && stats && (
            <>
              <h2>Overview</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <strong>{stats.totalUsers}</strong>
                </div>

                <div className="stat-card">
                  <h3>Total Notes</h3>
                  <strong>{stats.totalNotes}</strong>
                </div>

                <div className="stat-card">
                  <h3>Administrators</h3>
                  <strong>{stats.totalAdmins}</strong>
                </div>

                <div className="stat-card">
                  <h3>Regular Users</h3>
                  <strong>{stats.totalRegularUsers}</strong>
                </div>
              </div>

              <section className="admin-section">
                <h2>Recent Users</h2>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((item) => (
                        <tr key={item._id}>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                          <td>
                            <span
                              className={`role-badge ${item.role}`}
                            >
                              {item.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeTab === "users" && (
            <section className="admin-section">
              <h2>User Management</h2>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>
                          <span
                            className={`role-badge ${item.role}`}
                          >
                            {item.role}
                          </span>
                        </td>
                        <td>
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "notes" && (
            <section className="admin-section">
              <div className="section-header">
                <div>
                  <h2>Notes Management</h2>
                  <p>
                    View and moderate notes created by users.
                  </p>
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Content</th>
                      <th>Owner</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {notes.map((note) => (
                      <tr key={note._id}>
                        <td>{note.title}</td>

                        <td className="note-preview">
                          {note.content}
                        </td>

                        <td>
                          {note.user?.name || "Unknown"}
                        </td>

                        <td>
                          {note.createdAt
                            ? new Date(
                                note.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          <button
                            className="admin-delete-button"
                            onClick={() =>
                              deleteNote(note._id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {notes.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          No notes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default AdminDashboard;