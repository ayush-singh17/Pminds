import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { getNotes, createNote, deleteNote } from '../api/notes';
import { getTags, createTag } from '../api/tags';
import { getFolders } from '../api/folders';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { FaFolder, FaBrain, FaLightbulb, FaMicroscope, FaFireFlameCurved } from 'react-icons/fa6';
import { IoBook } from 'react-icons/io5';
import { AiFillThunderbolt } from 'react-icons/ai';
import { GiBullseye, GiBigWave } from 'react-icons/gi';
import { SiPolestar } from 'react-icons/si';

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  folder: <FaFolder />,
  brain: <FaBrain />,
  lightbulb: <FaLightbulb />,
  book: <IoBook />,
  microscope: <FaMicroscope />,
  bullseye: <GiBullseye />,
  thunder: <AiFillThunderbolt />,
  wave: <GiBigWave />,
  fire: <FaFireFlameCurved />,
  star: <SiPolestar />,
};

const renderFolderIcon = (iconKey: string) => FOLDER_ICONS[iconKey] || <FaFolder />;

const TYPE_COLORS: Record<string, string> = {
  thought: '#06b6d4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

const TYPES = ['thought', 'quote', 'article', 'question', 'idea'];

// AnimatedItem inline since we need custom rendering
const AnimatedItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      {children}
    </motion.div>
  );
};

export default function Notes() {
  const navigate = useNavigate();
  const {
    notes, setNotes, tags, setTags,
    folders, setFolders,
    selectedFolder, addNote,
    deleteNote: removeNote,
    isStale, setLastFetched, invalidate,
    notesCache, setNotesForKey,
  } = useNoteStore();
  const { isDark } = useThemeStore();

  const cacheKey = selectedFolder?.id === 'inbox' ? 'inbox'
    : selectedFolder ? `folder_${selectedFolder.id}`
    : 'unfiled';

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
  const [newTagName, setNewTagName] = useState('');

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const colors = ['#06b6d4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const tag = await createTag({ name: newTagName.trim(), color: randomColor });
    setTags([...tags, tag]);
    setForm(f => ({ ...f, tag_ids: [...f.tag_ids, tag.id] }));
    setNewTagName('');
  };

  useEffect(() => {
    const cached = notesCache[cacheKey];

    // If we have fresh cached data, restore instantly
    if (cached && !isStale(cacheKey)) {
      setNotes(cached);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    setLoading(true);
    const doFetch = async () => {
      try {
        const params = selectedFolder?.id === 'inbox'
          ? {}
          : selectedFolder
          ? { folder: selectedFolder.id }
          : { unfiled: true };

        const promises: Promise<void>[] = [
          getNotes(params).then(data => {
            setNotesForKey(cacheKey, data);
            setLastFetched(cacheKey);
          }),
        ];

        if (isStale('tags')) {
          promises.push(getTags().then(data => { setTags(data); setLastFetched('tags'); }));
        }
        if (isStale('folders')) {
          promises.push(getFolders().then(data => { setFolders(data); setLastFetched('folders'); }));
        }

        await Promise.all(promises);
      } finally {
        setLoading(false);
      }
    };
    doFetch();
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
      invalidate(cacheKey);
      invalidate('dashboard');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNote(id);
    removeNote(id);
    invalidate(cacheKey);
    invalidate('dashboard');
  };

  return (
    <div className="mx-auto" style={{width: '97%' }} >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedFolder && selectedFolder.id !== 'inbox' && (
              <span style={{ color: selectedFolder.color, fontSize: '20px' }}>
                {renderFolderIcon(selectedFolder.icon)}
              </span>
            )}
            {selectedFolder?.id === 'inbox' && (
              <span style={{ fontSize: '20px' }}>📥</span>
            )}
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedFolder?.id === 'inbox' ? 'Inbox' : selectedFolder ? selectedFolder.name : 'Loose Thoughts'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/graph')}
            className="glass-btn px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #1E293B',padding:'5px',display:'flex',alignSelf:'center',justifyContent:'center',alignItems:'center' }}
          >
            ◎ View Graph
          </button>
          <button
            onClick={handleOpenForm}
            className="glass-btn px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#06b6d4', color: '#0A0F1E',padding:'5px',display:'flex',alignSelf:'center',justifyContent:'center',alignItems:'center' }}
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
          className="glass-btn flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: '#111827',
            border: '1px solid #1E293B',
            color: '#F8FAFC',
            padding:'5px',marginBottom:'5px'
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="glass-btn rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: '#111827',
            border: '1px solid #1E293B',
            color: filterType ? '#F8FAFC' : '#94A3B8',height:'100%',padding:'10px',marginBottom:'5px',display:'flex',alignSelf:'center',justifyContent:'center',alignItems:'center'
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
              className="w-full max-w-lg rounded-xl"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                padding: '32px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{
                color: 'var(--text-primary)', fontSize: '20px',
                fontWeight: 600, marginBottom: '28px',
                letterSpacing: '-0.02em',
              }}>
                New note
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '10px', padding: '14px 16px',
                    color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                    width: '100%',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                />

                {/* Content */}
                <textarea
                  placeholder="What's on your mind?"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={6}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '10px', padding: '14px 16px',
                    color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                    width: '100%', resize: 'none', lineHeight: '1.8',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                />

                {/* Type + URL row */}
                <div className="flex gap-3">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{
                      flex: 1,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '10px', padding: '12px 14px',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                    }}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="url"
                    placeholder="Source URL (optional)"
                    value={form.source_url}
                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    style={{
                      flex: 1,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '10px', padding: '12px 14px',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                    }}
                  />
                </div>

                {/* Tags */}
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
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
                        style={{
                          padding: '4px 12px', borderRadius: '999px', fontSize: '11px',
                          background: form.tag_ids.includes(tag.id) ? tag.color + '33' : 'transparent',
                          border: `1px solid ${form.tag_ids.includes(tag.id) ? tag.color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')}`,
                          color: form.tag_ids.includes(tag.id) ? tag.color : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
                      style={{
                        flex: 1,
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '8px', padding: '8px 12px',
                        color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        background: 'rgba(6,182,212,0.2)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        color: '#06b6d4', fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Folders */}
                {folders.length > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                      Add to folders
                    </p>
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
                          style={{
                            padding: '4px 12px', borderRadius: '999px', fontSize: '11px',
                            background: form.folder_ids.includes(folder.id) ? folder.color + '33' : 'transparent',
                            border: `1px solid ${form.folder_ids.includes(folder.id) ? folder.color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')}`,
                            color: form.folder_ids.includes(folder.id) ? folder.color : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: '14px',
                      borderRadius: '10px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                      color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      flex: 1, padding: '14px',
                      borderRadius: '10px',
                      background: creating ? 'rgba(6,182,212,0.3)' : '#06b6d4',
                      border: '1px solid #06b6d4',
                      color: '#0A0F1E', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 600,
                    }}
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
              style={{ background: (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' ) }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '12px', padding: '60px 20px', textAlign: 'center',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)',
            marginTop: '16px',
          }}
        >
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>
            {search || filterType ? 'No notes match your filter.' : 'Nothing here yet.'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            {search || filterType ? 'Try a different search or filter.' : 'Add your first idea to this space.'}
          </p>
          {!search && !filterType && (
            <button
              onClick={handleOpenForm}
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: '#06b6d4', color: '#0A0F1E',
                fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}
            >
              + New note
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ position: 'relative' }}>
          {filtered.map((note, index) => (
            <AnimatedItem key={note.id} index={index}>
              <motion.div
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="cursor-pointer group"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
                  borderLeft: `3px solid ${TYPE_COLORS[note.type] || '#06b6d4'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      background: TYPE_COLORS[note.type] + '22',
                      color: TYPE_COLORS[note.type],
                      fontSize: '10px', fontWeight: 600,
                      padding: '2px 8px', borderRadius: '999px',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}>
                      {note.type}
                    </span>
                    <p style={{
                      color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {note.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      style={{ color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer' }}
                    >✕</button>
                  </div>
                </div>

                {/* Content */}
                <p style={{
                  color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {note.content}
                </p>

                {/* Tags + folders */}
                {(note.tags.length > 0 || note.folders?.length > 0) && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {note.tags.map(tag => (
                      <span key={tag.id} style={{
                        background: tag.color + '22', color: tag.color,
                        fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                      }}>
                        {tag.name}
                      </span>
                    ))}
                    {note.folders?.map(folder => (
                      <span key={folder.id} style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: 'var(--text-muted)',
                        fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                      }}>
                        {folder.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatedItem>
          ))}
        </div>
      )}
    </div>
  );
}
