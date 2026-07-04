import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { getNotes } from '../api/notes';
import { useThemeStore } from '../store/themeStore';
import type { Note } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06b6d4', quote: '#10B981', article: '#F59E0B',
  question: '#F43F5E', idea: '#8B5CF6',
};

const AnimatedItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: false });
  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      {children}
    </motion.div>
  );
};

export default function RecentNotes() {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getNotes();
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotes(sorted);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const groupByDate = (notes: Note[]) => {
    const groups: Record<string, Note[]> = {};
    notes.forEach(note => {
      const date = new Date(note.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric'
        }).toUpperCase();
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(note);
    });
    return groups;
  };

  const grouped = groupByDate(notes);

  const cardStyle = (note: Note) => ({
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
    borderLeft: `3px solid ${TYPE_COLORS[note.type] || '#032582'}`,
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '8px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            color: 'var(--text-muted)', fontSize: '13px',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
          }}>
            Recent
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {notes.length} notes total
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              height: '72px', borderRadius: '12px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.entries(grouped).map(([date, dateNotes], groupIndex) => (
            <div key={date}>
              {/* Date label */}
              <p style={{
                color: 'var(--text-muted)', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.1em',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
              }}>
                {date}
              </p>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dateNotes.map((note, i) => (
                  <AnimatedItem key={note.id} index={i}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/notes/${note.id}`)}
                      style={cardStyle(note)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.9)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(255,255,255,0.6)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        {/* Left */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: 'var(--text-primary)', fontSize: '14px',
                            fontWeight: 600, marginBottom: '4px',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}>
                            {note.title}
                          </p>
                          <p style={{
                            color: 'var(--text-muted)', fontSize: '12px',
                            lineHeight: '1.5',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}>
                            {note.content.slice(0, 80)}...
                          </p>

                          {/* Folder + tag badges */}
                          {(note.folders?.length > 0 || note.tags?.length > 0) && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                              {note.folders?.map(folder => (
                                <span key={folder.id} style={{
                                  color: folder.color, fontSize: '10px',
                                  padding: '2px 8px', borderRadius: '999px',
                                  background: folder.color + '18',
                                  border: `1px solid ${folder.color}33`,
                                }}>
                                  {folder.name}
                                </span>
                              ))}
                              {note.tags?.map(tag => (
                                <span key={tag.id} style={{
                                  color: tag.color, fontSize: '10px',
                                  padding: '2px 8px', borderRadius: '999px',
                                  background: tag.color + '18',
                                  border: `1px solid ${tag.color}33`,
                                }}>
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {new Date(note.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          <span style={{
                            color: TYPE_COLORS[note.type] || '#06b6d4',
                            fontSize: '9px', fontWeight: 700,
                            padding: '2px 8px', borderRadius: '999px',
                            background: (TYPE_COLORS[note.type] || '#06b6d4') + '18',
                            border: `1px solid ${(TYPE_COLORS[note.type] || '#06b6d4')}33`,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {note.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatedItem>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
