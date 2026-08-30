function NoteList({ notes, onEdit, onDelete }) {
  if (!Array.isArray(notes) || notes.length === 0) {
    return (
      <div className="empty-notes">
        <h3>No notes found</h3>
        <p>Create your first note to get started.</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {notes.map((note) => (
        <div className="note-card" key={note._id}>
          <div className="note-card-content">
            <h3>{note.title}</h3>

            <p>{note.content}</p>

            <small>
              {note.updatedAt
                ? `Updated ${new Date(note.updatedAt).toLocaleString()}`
                : ""}
            </small>
          </div>

          <div className="note-actions">
            <button
              type="button"
              onClick={() => onEdit(note)}
            >
              Edit
            </button>

            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(note._id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NoteList;