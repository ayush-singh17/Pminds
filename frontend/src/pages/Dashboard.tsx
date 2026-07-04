import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotes, getPatternInsight } from '../api/notes';
import { getTags } from '../api/tags';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import type { Note } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06b6d4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { notes, setNotes, tags, setTags, isStale, setLastFetched,
          notesCache, setNotesForKey } = useNoteStore();
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    const cacheKey = 'dashboard';
    const cached = notesCache[cacheKey];

    // If we have fresh cached data, restore instantly — no fetch needed
    if (cached && !isStale(cacheKey)) {
      setNotes(cached);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    const doFetch = async () => {
      try {
        const [notesData, tagsData] = await Promise.all([
          getNotes(),
          getTags(),
        ]);
        setNotesForKey(cacheKey, notesData);
        setTags(tagsData);
        setLastFetched(cacheKey);
        setLastFetched('tags');

        if (notesData.length >= 3) {
          setInsightLoading(true);
          getPatternInsight(
            notesData.slice(0, 10).map(n => ({ title: n.title, content: n.content }))
          ).then(result => {
            setInsight(result);
            setInsightLoading(false);
          });
        }
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, []);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const typeCounts = notes.reduce((acc, note) => {
    acc[note.type] = (acc[note.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto" style={{ paddingBottom: '32px', paddingLeft: '8px', paddingRight: '8px' ,width: '100%'}}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
            borderRadius: '16px', padding: '28px 32px',
            marginBottom: '24px', cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = isDark
              ? '0 8px 24px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h1 style={{
            fontSize: '36px', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: '8px',
            letterSpacing: '-0.03em', lineHeight: 1.2,
          }}>
            Your mind,<br />mapped.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {notes.length} ideas captured so far.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Notes', value: notes.length, icon: '✦' },
            { label: 'Tags', value: tags.length, icon: '⊙' },
            { label: 'Types', value: Object.keys(typeCounts).length, icon: '◈' },
            { label: 'This week', value: notes.filter(n => {
              const d = new Date(n.created_at);
              const now = new Date();
              return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
            }).length, icon: '◷' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px', padding: '24px',
                cursor: 'default',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDark
                  ? '0 8px 24px rgba(0,0,0,0.3)'
                  : '0 8px 24px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = isDark
                  ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = isDark
                  ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
                {stat.icon} {stat.label}
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* AI Insight */}
        {(insight || insightLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: isDark ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '16px', padding: '24px 28px',
              marginBottom: '24px', position: 'relative', overflow: 'hidden',marginTop: '24px'
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
              background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span style={{ color: '#06b6d4', fontSize: '18px', marginTop: '2px' }}>✦</span>
              <div>
                <p style={{
                  color: '#06b6d4', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px',
                }}>
                  AI Insight
                </p>
                {insightLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#06b6d4', animation: 'pulse 1.5s infinite',
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      Analyzing your thoughts...
                    </p>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.7' }}>
                    {insight}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent notes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{
              color: 'var(--text-muted)', fontSize: '11px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Recent
            </p>
            <button onClick={() => navigate('/recent')}
              style={{ color: '#06b6d4', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg animate-pulse"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="rounded-lg p-8 text-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                No ideas yet. Start capturing.
              </p>
              <button onClick={() => navigate('/notes')}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: '#06b6d4', color: '#0A0F1E', fontWeight: 600 }}>
                Add your first note
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderLeft: `3px solid ${TYPE_COLORS[note.type] || '#06b6d4'}`,
                    borderRadius: '10px', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}
                >
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                    {note.title}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0, marginLeft: '12px' }}>
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(note.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
