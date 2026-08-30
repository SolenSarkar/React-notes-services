import { useCallback, useEffect, useState } from "react";
import NoteForm from "../components/NoteForm";
import NoteList from "../components/NoteList";
import Pagination from "../components/Pagination";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Notes({ user, onLogout, onOpenAdmin }) {
  const [notes, setNotes] = useState([]);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(6);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

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
        `${API_URL}/api/notes?${params.toString()}`,
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
        }

        throw new Error(data.message || "Failed to fetch notes");
      }

      setNotes(Array.isArray(data.notes) ? data.notes : []);

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
      console.error("Fetch notes error:", err);
      setError(err.message || "Failed to load notes");
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

  const handleSave = async (noteData) => {
    const token = getToken();

    if (!token) {
      onLogout();
      return;
    }

    const isEditing = Boolean(editingNote);

    const url = isEditing
      ? `${API_URL}/api/notes/${editingNote._id}`
      : `${API_URL}/api/notes`;

    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(noteData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        onLogout();
      }

      throw new Error(data.message || "Failed to save note");
    }

    setShowForm(false);
    setEditingNote(null);

    await fetchNotes();
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (noteId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notes/${noteId}`,
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
        }

        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      await fetchNotes();
    } catch (err) {
      console.error("Delete note error:", err);
      setError(err.message || "Failed to delete note");
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="notes-page">
      <header className="notes-header">
  <div>
    <h1>📝 My Notes</h1>

    <p>
      Welcome,{" "}
      {user?.name || user?.email || "User"}
    </p>
  </div>

  <div className="notes-header-actions">
    {user?.role === "admin" && (
      <button
        type="button"
        onClick={onOpenAdmin}
      >
        🛡️ Admin
      </button>
    )}

    <button
      type="button"
      className="logout-button"
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
            placeholder="Search notes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <button type="submit">
            Search
          </button>

          {search && (
            <button
              type="button"
              className="clear-search"
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

        {!showForm && (
          <button
            type="button"
            className="new-note-button"
            onClick={handleNewNote}
          >
            + New Note
          </button>
        )}

        {showForm && (
          <NoteForm
            note={editingNote}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        )}

        {error && (
          <div className="notes-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="notes-loading">
            Loading notes...
          </div>
        ) : (
          <>
            <NoteList
              notes={notes}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default Notes;