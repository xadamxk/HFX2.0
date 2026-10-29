import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NotesUsage,
  USER_NOTE_MAX_LENGTH,
  UserNote,
  UserNotesStore,
  isUserNotesKey,
} from "../../core/UserNotesStore";
import { Logger } from "../../core/Logger";
import { usePopup } from "./contexts/PopupContext";

const PROFILE_URL = "https://hackforums.net/member.php?action=profile&uid=";

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

interface NoteRowProps {
  note: UserNote;
  store: UserNotesStore;
}

const NoteRow: React.FC<NoteRowProps> = ({ note, store }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (draft === null) return;
    try {
      const result = await store.save(note.uid, draft, note.username);
      if (result.ok) {
        setDraft(null);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (caught) {
      Logger.error("Failed to save note:", caught);
      setError("Not saved: something went wrong. Try again.");
    }
  };

  const remove = async () => {
    setIsConfirmingDelete(false);
    try {
      await store.delete(note.uid);
      setError(null);
    } catch (caught) {
      Logger.error("Failed to delete note:", caught);
      setError("Not deleted: something went wrong. Try again.");
    }
  };

  return (
    <tr data-uid={note.uid}>
      <td className="user-notes-member">
        <a
          href={`${PROFILE_URL}${note.uid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {note.username || `uid ${note.uid}`}
        </a>
      </td>
      <td className="user-notes-note">
        {draft === null ? (
          <span className="user-notes-text">{note.note}</span>
        ) : (
          <>
            <textarea
              value={draft}
              maxLength={USER_NOTE_MAX_LENGTH}
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setDraft(null);
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
              }}
            />
            <span className="configurable-description">
              {draft.length} / {USER_NOTE_MAX_LENGTH}
            </span>
          </>
        )}
        {error && <p className="user-notes-error">{error}</p>}
      </td>
      <td className="user-notes-date">
        {new Date(note.updatedAt).toLocaleDateString()}
      </td>
      <td className="user-notes-actions">
        {draft !== null ? (
          <>
            <button type="button" className="storage-reset-btn" onClick={save}>
              Save
            </button>
            <button
              type="button"
              className="storage-reset-btn"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
            >
              Cancel
            </button>
          </>
        ) : isConfirmingDelete ? (
          <>
            <button
              type="button"
              className="storage-reset-btn storage-reset-btn--confirm"
              onClick={remove}
            >
              Confirm
            </button>
            <button
              type="button"
              className="storage-reset-btn"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="storage-reset-btn"
              onClick={() => setDraft(note.note)}
            >
              Edit
            </button>
            <button
              type="button"
              className="storage-reset-btn"
              onClick={() => setIsConfirmingDelete(true)}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

/**
 * Lists every User Note with edit, delete and export, and how much of the
 * notes' sync storage is used. The toolbar popup shows the usage and a link
 * to the options page instead of the list.
 */
export const UserNotesPanel: React.FC = () => {
  const { isPopup } = usePopup();
  // Created lazily; StorageService reaches for chrome.storage on construction
  const storeRef = useRef<UserNotesStore | null>(null);
  const [notes, setNotes] = useState<UserNote[] | null>(null);
  const [usage, setUsage] = useState<NotesUsage | null>(null);
  const [filter, setFilter] = useState("");

  const getStore = () => {
    if (!storeRef.current) storeRef.current = new UserNotesStore();
    return storeRef.current;
  };

  const load = useCallback(async () => {
    const { notes, usage } = await getStore().getSnapshot();
    setNotes([...notes.values()].sort((a, b) => b.updatedAt - a.updatedAt));
    setUsage(usage);
  }, []);

  useEffect(() => {
    const reload = () =>
      load().catch((error) =>
        Logger.error("Failed to load User Notes:", error)
      );
    reload();

    const handleChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && Object.keys(changes).some(isUserNotesKey)) {
        reload();
      }
    };
    chrome.storage.onChanged.addListener(handleChanged);
    return () => chrome.storage.onChanged.removeListener(handleChanged);
  }, [load]);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!notes || !query) return notes ?? [];
    return notes.filter(
      (note) =>
        note.note.toLowerCase().includes(query) ||
        (note.username ?? "").toLowerCase().includes(query) ||
        String(note.uid) === query
    );
  }, [notes, filter]);

  const exportNotes = async () => {
    const json = await getStore().exportJson();
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `hfx-user-notes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  if (!notes || !usage) {
    return null;
  }

  const usageText = `${formatKb(usage.bytes)} of ${formatKb(usage.budget)} used · ${
    usage.count
  } note${usage.count === 1 ? "" : "s"}`;

  if (isPopup) {
    return (
      <div className="user-notes-panel">
        <p className="configurable-description">{usageText}</p>
        <button
          type="button"
          className="storage-reset-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Manage notes
        </button>
      </div>
    );
  }

  return (
    <div className="user-notes-panel">
      <div className="user-notes-toolbar">
        <span className="configurable-description">{usageText}</span>
        {notes.length > 0 && (
          <>
            <input
              type="search"
              className="user-notes-filter"
              placeholder="Filter notes"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button
              type="button"
              className="storage-reset-btn"
              onClick={exportNotes}
            >
              Export JSON
            </button>
          </>
        )}
      </div>
      {notes.length === 0 ? (
        <p className="configurable-description">
          No notes yet. Click the note icon next to a member&apos;s name on a
          post or their profile to add one.
        </p>
      ) : (
        <table className="user-notes-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Note</th>
              <th>Edited</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((note) => (
              <NoteRow key={note.uid} note={note} store={getStore()} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
