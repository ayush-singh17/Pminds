import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNote, updateNote, deleteNote, suggestConnections } from '../api/notes';
import { getConnectionsByNote } from '../api/connections';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { getFolders } from '../api/folders';
import type { Note, Connection } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06b6d4', quote: '#10B981', article: '#F59E0B',
  question: '#F43F5E', idea: '#8B5CF6',
};

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const { updateNote: updateStore, deleteNote: deleteStore, folders } = useNoteStore();

  const [note, setNote] = useState<Note | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [moving, setMoving] = useState(false);
  const [moveSuccess, setMoveSuccess] = useState('');

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
      setSuggestionResult(count > 0
        ? `Found ${count} new connection${count > 1 ? 's' : ''}.`
        : 'No new connections found.');
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

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: isDark
      ? '0 4px 16px rgba(0,0,0,0.2)'
      : '0 4px 16px rgba(0,0,0,0.06)',
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      {[1,2,3].map(i => (
        <div key={i} style={{ ...cardStyle, height: '100px', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  if (!note) return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <p style={{ color: 'var(--text-muted)' }}>Note not found.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Back */}
        <button
          onClick={() => navigate('/notes')}
          style={{
            color: 'var(--text-muted)', fontSize: '13px', background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ← Back to notes
        </button>

        {/* Main note card */}
        <div style={{
          ...cardStyle,
          borderLeft: `3px solid ${TYPE_COLORS[note.type] || '#06b6d4'}`,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{
              background: TYPE_COLORS[note.type] + '22',
              color: TYPE_COLORS[note.type],
              fontSize: '10px', fontWeight: 700,
              padding: '3px 10px', borderRadius: '999px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {note.type}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                  background: 'rgba(244,63,94,0.1)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  color: '#F43F5E', cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '10px', padding: '12px 16px',
                  color: 'var(--text-primary)', fontSize: '18px',
                  fontWeight: 600, outline: 'none', width: '100%',
                }}
              />
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={6}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '10px', padding: '12px 16px',
                  color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', resize: 'none', lineHeight: '1.8', width: '100%',
                }}
              />
              <button
                onClick={handleSave}
                style={{
                  alignSelf: 'flex-end', padding: '10px 24px',
                  borderRadius: '10px', background: '#06b6d4',
                  border: 'none', color: '#0A0F1E',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Save changes
              </button>
            </div>
          ) : (
            <>
              <h1 style={{
                color: 'var(--text-primary)', fontSize: '24px',
                fontWeight: 700, marginBottom: '16px', lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}>
                {note.title}
              </h1>
              <p style={{
                color: 'var(--text-muted)', fontSize: '14px',
                lineHeight: '1.9', marginBottom: '20px',
              }}>
                {note.content}
              </p>
              {note.source_url && (
                <a href={note.source_url} target="_blank" rel="noreferrer"
                  style={{ color: '#06b6d4', fontSize: '12px', display: 'inline-block', marginBottom: '16px' }}>
                  Source →
                </a>
              )}
            </>
          )}

          {/* Tags + date */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {note.tags.map(tag => (
                <span key={tag.id} style={{
                  background: tag.color + '22', color: tag.color,
                  fontSize: '10px', padding: '2px 10px', borderRadius: '999px',
                  border: `1px solid ${tag.color}44`,
                }}>
                  {tag.name}
                </span>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>
              {new Date(note.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Move to folder */}
        <div style={cardStyle}>
          <p style={{
            color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
          }}>
            Folder
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
            {note.folders.length > 0
              ? note.folders.map(f => f.name).join(', ')
              : 'Unfiled'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={async () => {
                setMoving(true);
                const updated = await updateNote(note.id, { folder_ids: [] });
                setNote(updated);
                setMoveSuccess('Moved to Unfiled');
                setTimeout(() => setMoveSuccess(''), 2000);
                setMoving(false);
              }}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '11px',
                background: note.folders.length === 0
                  ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                  : 'transparent',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                color: note.folders.length === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ✦ Unfiled
            </button>
            {folders.map(folder => {
              const inFolder = note.folders.some(f => f.id === folder.id);
              return (
                <button
                  key={folder.id}
                  onClick={async () => {
                    setMoving(true);
                    const newFolderIds = inFolder
                      ? note.folders.filter(f => f.id !== folder.id).map(f => f.id)
                      : [...note.folders.map(f => f.id), folder.id];
                    const updated = await updateNote(note.id, { folder_ids: newFolderIds });
                    setNote(updated);
                    setMoveSuccess(inFolder ? `Removed from ${folder.name}` : `Added to ${folder.name}`);
                    setTimeout(() => setMoveSuccess(''), 2000);
                    setMoving(false);
                  }}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '11px',
                    background: inFolder ? folder.color + '22' : 'transparent',
                    border: `1px solid ${inFolder ? folder.color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')}`,
                    color: inFolder ? folder.color : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  {folder.name} {inFolder && '✓'}
                </button>
              );
            })}
          </div>
          {moveSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                color: '#10B981', fontSize: '12px', marginTop: '10px',
                padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(16,185,129,0.1)',
              }}
            >
              {moveSuccess}
            </motion.p>
          )}
        </div>

        {/* AI Connections */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{
                color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px',
              }}>
                AI Connections
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Semantically related ideas
              </p>
            </div>
            <button
              onClick={handleSuggest}
              disabled={suggesting}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
                background: suggesting ? 'rgba(6,182,212,0.2)' : '#06b6d4',
                border: '1px solid #06b6d4',
                color: suggesting ? '#06b6d4' : '#0A0F1E',
                cursor: 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {suggesting ? '...' : '✦ Suggest'}
            </button>
          </div>

          {suggestionResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                color: '#10B981', fontSize: '12px', marginBottom: '12px',
                padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(16,185,129,0.1)',
              }}
            >
              {suggestionResult}
            </motion.p>
          )}

          {connections.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              No connections yet. Click Suggest to find related ideas.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {connections.map((conn) => {
                const other = conn.note_from === id ? conn.note_to_detail : conn.note_from_detail;
                const strength = Math.round(conn.strength * 100);
                return (
                  <motion.div
                    key={conn.id}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/notes/${other.id}`)}
                    style={{
                      padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                      marginBottom: '8px', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e: any) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                  >
                    {/* Note title + strength */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: conn.reason ? '8px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {conn.ai_generated && (
                          <span style={{
                            background: 'rgba(6,182,212,0.15)', color: '#06B6D4',
                            fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                            borderRadius: '4px', letterSpacing: '0.05em',
                          }}>
                            AI
                          </span>
                        )}
                        <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                          {other.title}
                        </p>
                      </div>
                      {/* Strength bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{
                          width: '50px', height: '3px', borderRadius: '999px',
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            width: `${strength}%`,
                            background: strength > 70 ? '#10B981' : strength > 50 ? '#06B6D4' : '#F59E0B',
                          }} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', minWidth: '28px' }}>
                          {strength}%
                        </p>
                      </div>
                    </div>

                    {/* Connection reason */}
                    {conn.reason && (
                      <p style={{
                        color: 'var(--text-muted)', fontSize: '12px',
                        lineHeight: '1.6', fontStyle: 'italic',
                        paddingTop: '8px',
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
                      }}>
                        "{conn.reason}"
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
