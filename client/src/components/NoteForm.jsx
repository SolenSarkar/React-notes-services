import { useEffect, useState } from "react";

function NoteForm({ note, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    } else {
      setTitle("");
      setContent("");
    }

    setError("");
  }, [note]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    if (title.trim().length > 100) {
      setError("Title cannot exceed 100 characters");
      return;
    }

    if (content.trim().length > 5000) {
      setError("Content cannot exceed 5000 characters");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        title: title.trim(),
        content: content.trim(),
      });

      if (!note) {
        setTitle("");
        setContent("");
      }
    } catch (err) {
      setError(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="note-form-header">
        <h2>{note ? "Edit Note" : "Create Note"}</h2>
      </div>

      {error && <div className="note-form-error">{error}</div>}

      <input
        type="text"
        placeholder="Note title"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Write your note..."
        value={content}
        maxLength={5000}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
      />

      <div className="note-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : note ? "Update Note" : "Add Note"}
        </button>

        {note && (
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default NoteForm;