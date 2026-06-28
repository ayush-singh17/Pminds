import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotes, createNote, deleteNote } from '../api/notes';
import { getTags } from '../api/tags';
import { getFolders } from '../api/folders';
import { useNoteStore } from '../store/noteStore';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

const TYPES = ['thought', 'quote', 'article', 'question', 'idea'];

export default function Notes() {
  const navigate = useNavigate();
  const {
    notes, setNotes, tags, setTags,
    folders, setFolders,
    selectedFolder, addNote,
    deleteNote: removeNote,
  } = useNoteStore();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'thought',
    source_url: '',
    tag_ids: [] as string[],
    folder_ids: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = selectedFolder
          ? { folder: selectedFolder.id }
          : { unfiled: true };

        const [notesData, tagsData, foldersData] = await Promise.all([
          getNotes(params),
          getTags(),
          getFolders(),
        ]);
        setNotes(notesData);
        setTags(tagsData);
        setFolders(foldersData);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedFolder]);

  // Pre-select current folder when opening create form
  const handleOpenForm = () => {
    setForm({
      title: '',
      content: '',
      type: 'thought',
      source_url: '',
      tag_ids: [],
      folder_ids: selectedFolder ? [selectedFolder.id] : [],
    });
    setShowForm(true);
  };

  const filtered = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType ? n.type === filterType : true;
    return matchSearch && matchType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const note = await createNote({
        ...form,
        source_url: form.source_url || undefined,
      });
      addNote(note);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNote(id);
    removeNote(id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedFolder && (
              <span style={{ color: selectedFolder.color }}>{selectedFolder.icon}</span>
            )}
            <h1 className="text-2xl font-semibold" style={{ color: '#F8FAFC' }}>
              {selectedFolder ? selectedFolder.name : 'Unfiled'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/graph')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #1E293B' }}
          >
            ◎ View Graph
          </button>
          <button
            onClick={handleOpenForm}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#06B6D4', color: '#0A0F1E' }}
          >
            + New note
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: '#111827',
            border: '1px solid #1E293B',
            color: '#F8FAFC',
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: '#111827',
            border: '1px solid #1E293B',
            color: filterType ? '#F8FAFC' : '#94A3B8',
          }}
        >
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Create form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl p-6"
              style={{ background: '#111827', border: '1px solid #1E293B' }}
            >
              <h2 className="text-lg font-semibold mb-6" style={{ color: '#F8FAFC' }}>
                New note
              </h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: '#0A0F1E',
                    border: '1px solid #1E293B',
                    color: '#F8FAFC',
                  }}
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: '#0A0F1E',
                    border: '1px solid #1E293B',
                    color: '#F8FAFC',
                  }}
                />
                <div className="flex gap-3">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: '#0A0F1E',
                      border: '1px solid #1E293B',
                      color: '#F8FAFC',
                    }}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="url"
                    placeholder="Source URL (optional)"
                    value={form.source_url}
                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: '#0A0F1E',
                      border: '1px solid #1E293B',
                      color: '#F8FAFC',
                    }}
                  />
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          tag_ids: f.tag_ids.includes(tag.id)
                            ? f.tag_ids.filter(id => id !== tag.id)
                            : [...f.tag_ids, tag.id]
                        }))}
                        className="px-2.5 py-1 rounded-full text-xs transition-all"
                        style={{
                          background: form.tag_ids.includes(tag.id) ? tag.color + '33' : '#0A0F1E',
                          border: `1px solid ${form.tag_ids.includes(tag.id) ? tag.color : '#1E293B'}`,
                          color: form.tag_ids.includes(tag.id) ? tag.color : '#94A3B8',
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Folder assignment */}
                {folders.length > 0 && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: '#94A3B8' }}>Add to folders</p>
                    <div className="flex flex-wrap gap-2">
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            folder_ids: f.folder_ids.includes(folder.id)
                              ? f.folder_ids.filter(id => id !== folder.id)
                              : [...f.folder_ids, folder.id]
                          }))}
                          className="px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1"
                          style={{
                            background: form.folder_ids.includes(folder.id) ? folder.color + '33' : '#0A0F1E',
                            border: `1px solid ${form.folder_ids.includes(folder.id) ? folder.color : '#1E293B'}`,
                            color: form.folder_ids.includes(folder.id) ? folder.color : '#94A3B8',
                          }}
                        >
                          {folder.icon} {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm"
                    style={{ background: '#1E293B', color: '#94A3B8' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: '#06B6D4', color: '#0A0F1E' }}
                  >
                    {creating ? 'Saving...' : 'Save note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 rounded-lg animate-pulse"
              style={{ background: '#111827' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg p-12 text-center"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            {search || filterType ? 'No notes match your filter.' : 'No notes yet. Add your first idea.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {filtered.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="flex items-start justify-between px-4 py-4 rounded-lg cursor-pointer group"
                style={{ background: '#111827', border: '1px solid #1E293B' }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="mt-1.5 shrink-0" style={{ color: TYPE_COLORS[note.type], fontSize: 8 }}>●</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-1 truncate" style={{ color: '#F8FAFC' }}>
                      {note.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                      {note.content.slice(0, 100)}...
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {note.tags.map(tag => (
                          <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: tag.color + '22', color: tag.color }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-xs" style={{ color: '#94A3B8' }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, note.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                    style={{ color: '#F43F5E' }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
