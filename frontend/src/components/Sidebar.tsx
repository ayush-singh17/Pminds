import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { createFolder, deleteFolder } from '../api/folders';
import { logout } from '../api/auth';
import type { Folder } from '../types';

const FOLDER_COLORS = [
  '#06B6D4', '#10B981', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

const FOLDER_ICONS = ['📁', '🧠', '💡', '📖', '🔬', '🎯', '⚡', '🌊', '🔥', '✦'];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: logoutStore, user } = useAuthStore();
  const {
    folders, addFolder, deleteFolder: removeFolderFromStore,
    selectedFolder, setSelectedFolder,
  } = useNoteStore();
  const { isDark, toggle } = useThemeStore();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📁', color: '#06B6D4' });
  const [creating, setCreating] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } finally {
      logoutStore();
      navigate('/login');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const folder = await createFolder(form);
      addFolder(folder);
      setShowCreate(false);
      setForm({ name: '', icon: '📁', color: '#06B6D4' });
      setSelectedFolder(folder);
      navigate('/notes');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    await deleteFolder(folder.id);
    removeFolderFromStore(folder.id);
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null);
      navigate('/notes');
    }
  };

  const handleFolderClick = (folder: Folder) => {
    setSelectedFolder(folder);
    navigate('/notes');
  };

  const handleGraphClick = (folder: Folder) => {
    setSelectedFolder(folder);
    navigate('/graph');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
      className="w-56 flex flex-col shrink-0 h-screen"
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px' }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>PMinds</h1>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', maxWidth: '140px' }}>
            {user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={toggle}
            title="Toggle theme"
            style={{
              color: 'var(--text-muted)', background: 'none',
              border: 'none', cursor: 'pointer',
              fontSize: '14px', padding: '4px',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              color: 'var(--text-muted)', background: 'none',
              border: 'none', cursor: 'pointer',
              fontSize: '14px', padding: '4px',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">

        {/* Search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            window.dispatchEvent(event);
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '6px 8px', marginBottom: '8px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '6px', cursor: 'pointer',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Search...</span>
          <kbd style={{
            background: 'var(--border)', color: 'var(--text-muted)',
            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
          }}>⌘K</kbd>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => { setSelectedFolder(null); navigate('/dashboard'); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full text-left"
          style={{
            background: isActive('/dashboard') ? 'var(--border)' : 'transparent',
            color: isActive('/dashboard') ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <span>⊡</span> Dashboard
        </button>

        {/* Unfiled */}
        <button
          onClick={() => { setSelectedFolder(null); navigate('/notes'); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full text-left"
          style={{
            background: isActive('/notes') && !selectedFolder ? 'var(--border)' : 'transparent',
            color: isActive('/notes') && !selectedFolder ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <span>✦</span> Unfiled
        </button>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

        {/* FOLDERS section */}
        <div className="flex items-center justify-between px-2 mb-1">
          <button
            onClick={() => navigate('/folders')}
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Folders
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{ color: '#06B6D4', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            +
          </button>
        </div>

        {/* Create folder form */}
        <AnimatePresence>
          {showCreate && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateFolder}
              className="overflow-hidden mb-2"
            >
              <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <input
                  type="text"
                  placeholder="Folder name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded px-2 py-1.5 text-xs outline-none mb-2"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <div className="flex flex-wrap gap-1 mb-2">
                  {FOLDER_ICONS.map(icon => (
                    <button key={icon} type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className="text-sm rounded p-1"
                      style={{ background: form.icon === icon ? 'var(--border)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {FOLDER_COLORS.map(color => (
                    <button key={color} type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-4 h-4 rounded-full"
                      style={{
                        background: color, border: 'none', cursor: 'pointer',
                        outline: form.color === color ? `2px solid ${color}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={creating}
                  className="w-full py-1.5 rounded text-xs font-medium"
                  style={{ background: '#06B6D4', color: 'var(--input-bg)', border: 'none', cursor: 'pointer' }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Folders list */}
        {folders.map((folder) => {
          const active = selectedFolder?.id === folder.id && isActive('/notes');
          return (
            <motion.div key={folder.id} whileHover={{ x: 2 }}
              className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group"
              style={{ background: active ? 'var(--border)' : 'transparent' }}
              onClick={() => handleFolderClick(folder)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ color: folder.color, fontSize: '13px' }}>{folder.icon}</span>
                <span className="text-sm truncate" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {folder.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{folder.note_count}</span>
                <button
                  onClick={(e) => handleDeleteFolder(e, folder)}
                  className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                  style={{ color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer' }}
                >✕</button>
              </div>
            </motion.div>
          );
        })}

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

        {/* GRAPHS section */}
        <button
          onClick={() => navigate('/graphs')}
          className="flex items-center justify-between px-2 mb-1 w-full"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Graphs
          </span>
        </button>

        {/* Graph for unfiled */}
        <motion.div
          whileHover={{ x: 2 }}
          onClick={() => { setSelectedFolder(null); navigate('/graph'); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer"
          style={{
            background: isActive('/graph') && !selectedFolder ? 'var(--border)' : 'transparent',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>◎</span>
          <span className="text-sm" style={{ color: isActive('/graph') && !selectedFolder ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            Unfiled
          </span>
        </motion.div>

        {/* Graph per folder */}
        {folders.map((folder) => {
          const active = selectedFolder?.id === folder.id && isActive('/graph');
          return (
            <motion.div key={folder.id} whileHover={{ x: 2 }}
              onClick={() => handleGraphClick(folder)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer"
              style={{ background: active ? 'var(--border)' : 'transparent' }}
            >
              <span style={{ color: folder.color, fontSize: '11px' }}>◎</span>
              <span className="text-sm truncate" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {folder.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
