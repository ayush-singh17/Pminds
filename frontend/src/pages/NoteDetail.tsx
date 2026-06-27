import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNote, updateNote, deleteNote, suggestConnections } from '../api/notes';
import { getConnectionsByNote } from '../api/connections';
import { useNoteStore } from '../store/noteStore';
import type { Note, Connection } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateNote: updateStore, deleteNote: deleteStore } = useNoteStore();

  const [note, setNote] = useState<Note | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [noteData, connsData] = await Promise.all([
          getNote(id!),
          getConnectionsByNote(id!),
        ]);
        setNote(noteData);
        setConnections(connsData);
        setEditForm({ title: noteData.title, content: noteData.content });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestionResult(null);
    try {
      const result = await suggestConnections(id!);
      const count = result.connections_created;
      setSuggestionResult(
        count > 0
          ? `Found ${count} new connection${count > 1 ? 's' : ''}. Check the graph.`
          : 'No new connections found.'
      );
      // Refresh connections
      const connsData = await getConnectionsByNote(id!);
      setConnections(connsData);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSave = async () => {
    if (!note) return;
    const updated = await updateNote(note.id, editForm);
    setNote(updated);
    updateStore(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!note) return;
    await deleteNote(note.id);
    deleteStore(note.id);
    navigate('/notes');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-48 rounded animate-pulse mb-4" style={{ background: '#111827' }} />
        <div className="h-64 rounded-lg animate-pulse" style={{ background: '#111827' }} />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p style={{ color: '#94A3B8' }}>Note not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/notes')}
          className="text-sm mb-6 flex items-center gap-2"
          style={{ color: '#94A3B8' }}
        >
          ← Back to notes
        </button>

        {/* Note card */}
        <div className="rounded-xl p-6 mb-6"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span style={{ color: TYPE_COLORS[note.type], fontSize: 8 }}>●</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: TYPE_COLORS[note.type] + '22',
                  color: TYPE_COLORS[note.type],
                }}>
                {note.type}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: '#1E293B', color: '#94A3B8' }}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: '#F43F5E22', color: '#F43F5E' }}
              >
                Delete
              </button>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="rounded-lg px-3 py-2.5 text-lg font-semibold outline-none"
                style={{
                  background: '#0A0F1E',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                }}
              />
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={8}
                className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  background: '#0A0F1E',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                  lineHeight: '1.7',
                }}
              />
              <button
                onClick={handleSave}
                className="self-end px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#06B6D4', color: '#0A0F1E' }}
              >
                Save changes
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-4" style={{ color: '#F8FAFC' }}>
                {note.title}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#94A3B8', lineHeight: '1.8' }}>
                {note.content}
              </p>
              {note.source_url && (
                <a href={note.source_url} target="_blank" rel="noreferrer"
                  className="text-xs mt-4 inline-block"
                  style={{ color: '#06B6D4' }}>
                  Source →
                </a>
              )}
            </>
          )}

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #1E293B' }}>
              {note.tags.map(tag => (
                <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: tag.color + '22', color: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: '#94A3B8' }}>
            {new Date(note.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* AI Connection Suggester */}
        <div className="rounded-xl p-6 mb-6"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-medium mb-1" style={{ color: '#F8FAFC' }}>
                AI Connections
              </h2>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                Find notes semantically related to this one
              </p>
            </div>
            <button
              onClick={handleSuggest}
              disabled={suggesting}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: suggesting ? '#0e7490' : '#06B6D4',
                color: '#0A0F1E',
              }}
            >
              {suggesting ? 'Thinking...' : '✦ Suggest connections'}
            </button>
          </div>
          {suggestionResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs mt-3 px-3 py-2 rounded-lg"
              style={{ background: '#0A0F1E', color: '#10B981' }}
            >
              {suggestionResult}
            </motion.p>
          )}
        </div>

        {/* Existing connections */}
        {connections.length > 0 && (
          <div className="rounded-xl p-6"
            style={{ background: '#111827', border: '1px solid #1E293B' }}>
            <h2 className="text-sm font-medium mb-4" style={{ color: '#F8FAFC' }}>
              Connected ideas ({connections.length})
            </h2>
            <div className="flex flex-col gap-2">
              {connections.map((conn) => {
                const other = conn.note_from === id ? conn.note_to_detail : conn.note_from_detail;
                return (
                  <motion.div
                    key={conn.id}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/notes/${other.id}`)}
                    className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
                    style={{ background: '#0A0F1E', border: '1px solid #1E293B' }}
                  >
                    <div className="flex items-center gap-3">
                      {conn.ai_generated && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: '#06B6D422', color: '#06B6D4' }}>
                          AI
                        </span>
                      )}
                      <span className="text-sm" style={{ color: '#F8FAFC' }}>
                        {other.title}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: '#94A3B8' }}>
                      {Math.round(conn.strength * 100)}% match
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
