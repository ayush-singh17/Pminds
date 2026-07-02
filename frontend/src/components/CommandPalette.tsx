import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { getNotes } from '../api/notes';
import { getFolders } from '../api/folders';
import type { Note, Folder } from '../types';

interface Result {
  id: string;
  type: 'note' | 'folder';
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data once
  useEffect(() => {
    const load = async () => {
      const [notes, folders] = await Promise.all([getNotes(), getFolders()]);
      setAllNotes(notes);
      setAllFolders(folders);
    };
    load();
  }, []);

  // Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  // Search
  useEffect(() => {
    const q = query.toLowerCase();
    if (!q) {
      // Show recent notes when empty
      const recent = allNotes.slice(0, 5).map(note => ({
        id: note.id,
        type: 'note' as const,
        title: note.title,
        subtitle: note.type,
        color: TYPE_COLORS[note.type] || '#94A3B8',
        action: () => { navigate(`/notes/${note.id}`); setOpen(false); },
      }));
      setResults(recent);
      return;
    }

    const noteResults: Result[] = allNotes
      .filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(note => ({
        id: note.id,
        type: 'note',
        title: note.title,
        subtitle: note.content.slice(0, 60) + '...',
        color: TYPE_COLORS[note.type] || '#94A3B8',
        action: () => { navigate(`/notes/${note.id}`); setOpen(false); },
      }));

    const folderResults: Result[] = allFolders
      .filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(folder => ({
        id: folder.id,
        type: 'folder',
        title: folder.name,
        subtitle: `${folder.note_count} notes`,
        color: folder.color,
        action: () => {
          navigate('/notes');
          setOpen(false);
        },
      }));

    setResults([...folderResults, ...noteResults]);
    setSelected(0);
  }, [query, allNotes, allFolders]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    }
    if (e.key === 'Enter' && results[selected]) {
      results[selected].action();
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-32"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '560px',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(226,226,214,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: isDark
                  ? '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 24px 64px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {/* Search input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '18px 20px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: '16px' }}>⌘</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search notes, folders..."
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                  }}
                />
                <kbd style={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: 'var(--text-muted)',
                  fontSize: '11px', padding: '4px 8px',
                  borderRadius: '6px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                }}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {results.length === 0 ? (
                  <p style={{
                    color: '#94A3B8', fontSize: '13px',
                    padding: '20px', textAlign: 'center',
                  }}>
                    No results for "{query}"
                  </p>
                ) : (
                  <>
                    {!query && (
                      <p style={{
                        color: 'var(--text-muted)', fontSize: '10px',
                        padding: '12px 20px 4px',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontWeight: 700,
                      }}>
                        Recent
                      </p>
                    )}
                    {results.map((result, i) => (
                      <motion.div
                        key={result.id}
                        onClick={result.action}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '14px 20px', cursor: 'pointer',
                          background: i === selected
                            ? (isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.08)')
                            : 'transparent',
                          borderLeft: i === selected ? '3px solid #06B6D4' : '3px solid transparent',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <span style={{
                          color: result.color,
                          fontSize: result.type === 'folder' ? '14px' : '8px',
                          flexShrink: 0,
                        }}>
                          {result.type === 'folder' ? '📁' : '●'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: 'var(--text-primary)', fontSize: '14px',
                            fontWeight: 500, marginBottom: '2px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {result.title}
                          </p>
                          <p style={{
                            color: 'var(--text-muted)', fontSize: '11px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {result.subtitle}
                          </p>
                        </div>
                        <span style={{
                          color: result.color, fontSize: '10px', fontWeight: 600,
                          background: result.color + '22',
                          padding: '3px 10px', borderRadius: '999px', flexShrink: 0,
                          border: `1px solid ${result.color}44`,
                        }}>
                          {result.type}
                        </span>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex', gap: '16px',
              }}>
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵', label: 'open' },
                  { key: 'esc', label: 'close' },
                ].map(hint => (
                  <div key={hint.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      color: 'var(--text-muted)', fontSize: '10px',
                      padding: '3px 7px', borderRadius: '5px',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    }}>
                      {hint.key}
                    </kbd>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{hint.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
