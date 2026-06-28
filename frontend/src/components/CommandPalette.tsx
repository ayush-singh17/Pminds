import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
                background: '#111827', border: '1px solid #1E293B',
                borderRadius: '12px', overflow: 'hidden',
              }}
            >
              {/* Search input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px', borderBottom: '1px solid #1E293B',
              }}>
                <span style={{ color: '#94A3B8', fontSize: '16px' }}>⌘</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search notes, folders..."
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    outline: 'none', color: '#F8FAFC', fontSize: '14px',
                  }}
                />
                <kbd style={{
                  background: '#1E293B', color: '#94A3B8',
                  fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
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
                        color: '#94A3B8', fontSize: '11px',
                        padding: '10px 16px 4px',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        Recent
                      </p>
                    )}
                    {results.map((result, i) => (
                      <motion.div
                        key={result.id}
                        onClick={result.action}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          background: i === selected ? '#1E293B' : 'transparent',
                        }}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <span style={{
                          color: result.color,
                          fontSize: result.type === 'folder' ? '14px' : '8px',
                        }}>
                          {result.type === 'folder' ? '📁' : '●'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: '#F8FAFC', fontSize: '13px',
                            fontWeight: 500, marginBottom: '2px',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {result.title}
                          </p>
                          <p style={{
                            color: '#94A3B8', fontSize: '11px',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {result.subtitle}
                          </p>
                        </div>
                        <span style={{
                          color: result.color, fontSize: '11px',
                          background: result.color + '22',
                          padding: '2px 8px', borderRadius: '999px',
                          flexShrink: 0,
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
                padding: '10px 16px', borderTop: '1px solid #1E293B',
                display: 'flex', gap: '16px',
              }}>
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵', label: 'open' },
                  { key: 'esc', label: 'close' },
                ].map(hint => (
                  <div key={hint.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{
                      background: '#1E293B', color: '#94A3B8',
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                    }}>
                      {hint.key}
                    </kbd>
                    <span style={{ color: '#94A3B8', fontSize: '11px' }}>{hint.label}</span>
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
