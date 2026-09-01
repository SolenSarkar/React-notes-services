import { useCallback, useEffect, useState } from "react";
import Pagination from "../components/Pagination";

const API_URL =
  import.meta.env.VITE_API_URL;

function Admin({ user, onBack, onLogout }) {
  const [notes, setNotes] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(
        `${API_URL}/api/admin/notes?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }

        throw new Error(
          data.message || "Failed to load admin notes"
        );
      }

      setNotes(
        Array.isArray(data.notes)
          ? data.notes
          : []
      );

      setPagination(
        data.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      console.error("Admin notes error:", err);

      setError(
        err.message || "Failed to load notes"
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, onLogout]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/admin/notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }

        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      await fetchNotes();
    } catch (err) {
      console.error("Admin delete error:", err);

      setError(
        err.message || "Failed to delete note"
      );
    }
  };

  return (
    <div className="admin-page">
      <header className="notes-header">
        <div>
          <h1>🛡️ Admin Moderation</h1>

          <p>
            Logged in as {user?.name || user?.email}
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={onBack}
          >
            My Notes
          </button>

          <button
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="notes-container">
        <form
          className="search-form"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            placeholder="Search all notes..."
            value={searchInput}
            onChange={(e) =>
              setSearchInput(e.target.value)
            }
          />

          <button type="submit">
            Search
          </button>

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="admin-summary">
          Total notes: {pagination.total}
        </div>

        {error && (
          <div className="notes-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="notes-loading">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-notes">
            <h3>No notes found</h3>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map((note) => (
              <div
                className="note-card admin-note-card"
                key={note._id}
              >
                <div className="note-card-content">
                  <h3>{note.title}</h3>

                  <p>{note.content}</p>

                  <div className="note-owner">
                    <strong>Owner:</strong>{" "}
                    {note.user?.name || "Unknown"}
                    {" — "}
                    {note.user?.email || "Unknown"}
                  </div>

                  <small>
                    Created:{" "}
                    {note.createdAt
                      ? new Date(
                          note.createdAt
                        ).toLocaleString()
                      : ""}
                  </small>
                </div>

                <div className="note-actions">
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      handleDelete(note._id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={
            pagination.hasPreviousPage
          }
          onPageChange={(newPage) => {
            setPage(newPage);

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        />
      </main>
    </div>
  );
}

export default Admin;