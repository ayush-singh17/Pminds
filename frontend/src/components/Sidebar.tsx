import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { createFolder, deleteFolder } from '../api/folders';
import type { Folder } from '../types';
import { FaFolder, FaBrain, FaLightbulb, FaMicroscope, FaFireFlameCurved } from 'react-icons/fa6';
import { IoBook } from 'react-icons/io5';
import { AiFillThunderbolt } from 'react-icons/ai';
import { GiBullseye, GiBigWave } from 'react-icons/gi';
import { SiPolestar } from 'react-icons/si';

const FOLDER_COLORS = [
  '#06B6D4', '#10B981', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

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

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useThemeStore();
  const {
    folders, addFolder, deleteFolder: removeFolderFromStore,
    selectedFolder, setSelectedFolder,
  } = useNoteStore();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', icon: 'folder', color: '#06B6D4' });
  const [creating, setCreating] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [graphsExpanded, setGraphsExpanded] = useState(true);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const folder = await createFolder(form);
      addFolder(folder);
      setShowCreate(false);
      setForm({ name: '', icon: 'folder', color: '#06B6D4' });
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

  const handleGraphClick = (folder: Folder | null) => {
    setSelectedFolder(folder);
    navigate('/graph');
  };

  const isActive = (path: string) => location.pathname === path;

  const sectionHeaderStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    // border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '8px',
  };

  const activeBarStyle = (active: boolean) => ({
    borderLeft: active ? '3px solid #e2e2e6' : '1px solid transparent',
    paddingLeft: active ? '13px' : '15px',
    background: active
      ? (isDark ? 'rgba(226, 226, 214,0.08)' : 'rgba(6,182,212,0.08)')
      : 'transparent',
    color: active ? '#e2e2e6' : 'var(--text-primary)',
    transition: 'all 0.15s',
  });

  const renderFolderIcon = (iconKey: string) => {
    return FOLDER_ICONS[iconKey] || <FaFolder />;
  };

  return (
    <aside
      style={{
        width: '230px', borderRadius: '12px',
        margin: '0 12px 12px 12px',
        display: 'flex', flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">

        {/* Dashboard */}
        <motion.button
          onClick={() => { setSelectedFolder(null); navigate('/dashboard'); }}
          whileHover={{ x: 4 }}
          className="flex items-center gap-2.5 text-sm w-full text-left relative"
          style={{
            ...sectionHeaderStyle,
            ...activeBarStyle(isActive('/dashboard')),
            marginTop: '25px', width: '90%', display: 'flex', alignSelf: 'center',
            padding: '10px', paddingTop: '12px', paddingLeft: '15px',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          <span>⊡</span> Dashboard
        </motion.button>

        {/* Loose Thoughts */}
        <motion.button
          onClick={() => { setSelectedFolder(null); navigate('/notes'); }}
          whileHover={{ x: 4 }}
          className="flex items-center gap-2.5 rounded-md text-sm w-full text-left"
          style={{
            ...activeBarStyle(isActive('/notes') && !selectedFolder),
            marginTop: '5px', width: '90%', display: 'flex', alignSelf: 'center',
            padding: '10px', paddingTop: '12px', paddingLeft: '15px',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          <span>✦</span> Loose Thoughts
        </motion.button>

        {/* FOLDERS section */}
        <div style={{ marginTop: '8px' }}>
          <div
            className="flex items-center justify-between w-full px-3 py-2.5 text-sm mx-auto"
            style={{background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderRadius: '8px',width:'95%',margin:'2%'
            }}
          >
            <button
              onClick={() => navigate('/folders')}
              style={{ color: 'var(--text-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                width:'95%',display:'flex',alignSelf:'center',
                padding:'10px',paddingTop:'12px',paddingLeft:'15px'
               }}
            >
              Folders
            </button>
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              style={{
                color: 'var(--text-muted)', fontSize: '11px',
                transform: foldersExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px',width:'20px'
              }}
            >
              ▾
            </button>
          </div>

          <AnimatePresence>
            {foldersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '8px 4px' }}>
                  {/* Add folder button */}
                  <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left mb-1"
                    style={{ color: '#06B6D4', 
                      width:'95%',display:'flex',
                      padding:'10px',paddingLeft:'5px'
                    }}
                  >
                    + New folder
                  </button>

                  {/* Create form */}
                  <AnimatePresence>
                    {showCreate && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreateFolder}
                        className="overflow-hidden mb-2"
                      >
                        <div className="rounded-lg p-3" style={sectionHeaderStyle}>
                          <input
                            type="text"
                            placeholder="Folder name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full rounded px-2 py-1.5 text-xs outline-none mb-2"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                              color: 'var(--text-primary)',display:'flex',alignSelf:'center',
                              padding:'10px',paddingTop:'12px',paddingLeft:'15px',
                              marginBottom:'10px'
                            }}
                          />
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Object.entries(FOLDER_ICONS).map(([key, icon]) => (
                              <button key={key} type="button"
                                onClick={() => setForm({ ...form, icon: key })}
                                style={{
                                  background: form.icon === key
                                    ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                                    : 'transparent',
                                  border: 'none', cursor: 'pointer',
                                  padding: '6px', borderRadius: '6px',
                                  color: form.icon === key ? '#06B6D4' : 'var(--text-muted)',
                                  fontSize: '16px',
                                  display: 'flex', alignItems: 'center',
                                }}
                              >
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
                                  outlineOffset: '2px',display:'flex',alignSelf:'center',
                                  marginLeft:'5.5px',justifyContent:'center'
                                }}
                              />
                            ))}
                          </div>
                          <button type="submit" disabled={creating}
                            className="w-full py-1.5 rounded text-xs font-medium"
                            style={{ background: '#06B6D4', color: '#0A0F1E', border: 'none', cursor: 'pointer',
                              display:'flex',alignSelf:'center',
                              padding:'8px',paddingLeft:'10px',
                              marginTop:'10px',justifyContent:'center'
                            }}>
                            {creating ? 'Creating...' : 'Create'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Folders list */}
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {/* All Notes */}
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between rounded-md cursor-pointer"
                      style={{
                        ...activeBarStyle(!selectedFolder && isActive('/notes')),
                        width: '90%', alignSelf: 'center', display: 'flex',
                        padding: '10px', paddingLeft: '15px', marginBottom: '2px',
                      }}
                      onClick={() => { setSelectedFolder(null); navigate('/notes'); }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span style={{ color: '#e2e2e6', fontSize: '14px', display: 'flex' }}>✦</span>
                        <span className="text-sm truncate leading-none" style={{ color: (!selectedFolder && isActive('/notes')) ? 'var(--text-primary)' : 'var(--text-muted)' }}>All Notes</span>
                      </div>
                    </motion.div>

                    {folders.length === 0 ? (
                      <p className="text-xs px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                        No folders yet
                      </p>
                    ) : (
                      folders.map((folder) => {
                        const active = selectedFolder?.id === folder.id && isActive('/notes');
                        return (
                          <motion.div key={folder.id} whileHover={{ x: 4 }}
                            className="flex items-center justify-between rounded-md cursor-pointer group"
                            style={{
                              ...activeBarStyle(active),
                              width: '90%', alignSelf: 'center', display: 'flex',
                              padding: '10px', paddingLeft: '15px', marginBottom: '2px',
                            }}
                            onClick={() => handleFolderClick(folder)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span style={{ color: folder.color, fontSize: '14px', display: 'flex' }}>
                                {renderFolderIcon(folder.icon)}
                              </span>
                              <span 
                                className="text-sm truncate leading-none" 
                                style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                              >
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
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GRAPHS section */}
        <div>
          <div
            className="flex items-center justify-between w-full px-3 py-2.5 text-sm"
            style={{background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderRadius: '8px',width:'95%',margin:'2%'
            }}
          >
            <button
              onClick={() => navigate('/graphs')}
              style={{ color: 'var(--text-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', 
                width:'95%',display:'flex',alignSelf:'center',
                padding:'10px',paddingTop:'12px',paddingLeft:'15px'
              }}
            >
              Graphs
            </button>
            <button
              onClick={() => setGraphsExpanded(!graphsExpanded)}
              style={{
                color: 'var(--text-muted)', fontSize: '11px',
                transform: graphsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px',width:'20px'
              }}
            >
              ▾
            </button>
          </div>

          <AnimatePresence>
            {graphsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '8px 4px', }}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    onClick={() => handleGraphClick(null)}
                    className="flex items-center gap-2.5 py-2 rounded-md cursor-pointer"
                    style={activeBarStyle(isActive('/graph') && (!selectedFolder || selectedFolder.id !== 'inbox'))}
                  >
                    <span style={{ color: '#06B6D4', fontSize: '11px' }}>◎</span>
                    <span className="text-sm" style={{ color: isActive('/graph') && (!selectedFolder || selectedFolder.id !== 'inbox') ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      Lose Thoughts
                    </span>
                  </motion.div>

                  {folders.map((folder) => {
                    const active = selectedFolder?.id === folder.id && isActive('/graph');
                    return (
                      <motion.div key={folder.id} whileHover={{ x: 4 }}
                        onClick={() => handleGraphClick(folder)}
                        className="flex items-center gap-2.5 py-2 rounded-md cursor-pointer p-2.5 m-1.5"
                        style={activeBarStyle(active)}
                      >
                        <span style={{ color: folder.color, fontSize: '14px', display: 'flex' }}>
                          {renderFolderIcon(folder.icon)}
                        </span>
                        <span className="text-sm truncate" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {folder.name}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
