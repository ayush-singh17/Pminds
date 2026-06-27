import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNoteStore } from '../store/noteStore';
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
  const { folders, addFolder, deleteFolder: removeFolderFromStore,
          selectedFolder, setSelectedFolder } = useNoteStore();

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

  return (
    <aside style={{ background: '#0D1424', borderRight: '1px solid #1E293B' }}
      className="w-56 flex flex-col py-6 px-4 shrink-0 h-screen">

      {/* Logo */}
      <div className="mb-6 px-2">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: '#F8FAFC' }}>
          PMinds
        </h1>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#94A3B8' }}>
          {user?.email}
        </p>
      </div>

      {/* Dashboard link */}
      <button
        onClick={() => { setSelectedFolder(null); navigate('/dashboard'); }}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 w-full text-left"
        style={{
          background: location.pathname === '/dashboard' && !selectedFolder ? '#1E293B' : 'transparent',
          color: location.pathname === '/dashboard' ? '#F8FAFC' : '#94A3B8',
        }}
      >
        <span>⊡</span> Dashboard
      </button>

      {/* Unfiled notes */}
      <button
        onClick={() => { setSelectedFolder(null); navigate('/notes'); }}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-4 w-full text-left"
        style={{
          background: location.pathname === '/notes' && !selectedFolder ? '#1E293B' : 'transparent',
          color: location.pathname === '/notes' && !selectedFolder ? '#F8FAFC' : '#94A3B8',
        }}
      >
        <span>✦</span> Unfiled
      </button>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1E293B', marginBottom: '12px' }} />

      {/* Folders header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#94A3B8' }}>
          Folders
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ color: '#06B6D4', fontSize: '16px', lineHeight: 1 }}
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
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-lg p-3" style={{ background: '#111827', border: '1px solid #1E293B' }}>
              <input
                type="text"
                placeholder="Folder name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded px-2 py-1.5 text-xs outline-none mb-2"
                style={{ background: '#0A0F1E', border: '1px solid #1E293B', color: '#F8FAFC' }}
              />

              {/* Icon picker */}
              <div className="flex flex-wrap gap-1 mb-2">
                {FOLDER_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className="text-sm rounded p-1"
                    style={{ background: form.icon === icon ? '#1E293B' : 'transparent' }}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Color picker */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {FOLDER_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: color,
                      outline: form.color === color ? `2px solid ${color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-1.5 rounded text-xs font-medium"
                style={{ background: '#06B6D4', color: '#0A0F1E' }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Folders list */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2px',
        maxHeight: '300px'
      }}>
        {folders.length === 0 ? (
          <p className="text-xs px-2" style={{ color: '#94A3B8' }}>
            No folders yet
          </p>
        ) : (
          folders.map((folder) => {
            const active = selectedFolder?.id === folder.id;
            return (
              <motion.div
                key={folder.id}
                whileHover={{ x: 2 }}
                onClick={() => handleFolderClick(folder)}
                className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group"
                style={{ background: active ? '#1E293B' : 'transparent' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ color: folder.color, fontSize: '13px' }}>{folder.icon}</span>
                  <span className="text-sm truncate"
                    style={{ color: active ? '#F8FAFC' : '#94A3B8' }}>
                    {folder.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs" style={{ color: '#94A3B8' }}>
                    {folder.note_count}
                  </span>
                  <button
                    onClick={(e) => handleDeleteFolder(e, folder)}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                    style={{ color: '#F43F5E' }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Graph + Logout */}
      <div style={{ borderTop: '1px solid #1E293B', paddingTop: '12px', marginTop: '8px' }}>
        <button
          onClick={() => navigate('/graph')}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-left mb-1"
          style={{
            background: location.pathname === '/graph' ? '#1E293B' : 'transparent',
            color: location.pathname === '/graph' ? '#F8FAFC' : '#94A3B8',
          }}
        >
          <span>◎</span> Graph
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-left"
          style={{ color: '#94A3B8' }}
        >
          <span>→</span> Logout
        </button>
      </div>
    </aside>
  );
}
