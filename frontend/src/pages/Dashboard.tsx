import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotes, getPatternInsight } from '../api/notes';
import { getTags } from '../api/tags';
import { useNoteStore } from '../store/noteStore';
import type { Note } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { notes, setNotes, tags, setTags } = useNoteStore();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [streak, setStreak] = useState(0);

  const calculateStreak = (notes: Note[]) => {
    if (notes.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique days that have notes
    const days = new Set(
      notes.map(n => {
        const d = new Date(n.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let streak = 0;
    const current = new Date(today);

    while (true) {
      if (days.has(current.getTime())) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesData, tagsData] = await Promise.all([
          getNotes(), // no params = all notes
          getTags(),
        ]);
        setNotes(notesData);
        setTags(tagsData);
        setStreak(calculateStreak(notesData));

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
    fetch();
  }, []);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const typeCounts = notes.reduce((acc, note) => {
    acc[note.type] = (acc[note.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Your mind, mapped.
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {notes.length} ideas captured so far.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Notes', value: notes.length },
            { label: 'Tags', value: tags.length },
            { label: 'Types', value: Object.keys(typeCounts).length },
            { label: 'This week', value: notes.filter(n => {
              const d = new Date(n.created_at);
              const now = new Date();
              return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
            }).length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-5 mb-8 flex items-center justify-between"
            style={{ background: 'var(--surface)', border: '1px solid #F59E0B33' }}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔥</div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {streak} day streak
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {streak === 1
                    ? "You added a note today. Keep going."
                    : streak < 5
                    ? "Building momentum. Don't break the chain."
                    : streak < 10
                    ? "Solid streak. Your mind is active."
                    : "Exceptional. You think every day."}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="w-2 h-8 rounded-full"
                  style={{
                    background: `rgba(245, 158, 11, ${0.3 + (i / Math.min(streak, 7)) * 0.7})`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Insight */}
        {(insight || insightLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-5 mb-8"
            style={{
              background: 'var(--surface)',
              border: '1px solid #06B6D422',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)',
            }} />

            <div className="flex items-start gap-3">
              <span style={{ color: '#06B6D4', fontSize: '16px' }}>✦</span>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-2"
                  style={{ color: '#06B6D4' }}>
                  AI Insight
                </p>
                {insightLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#06B6D4' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing your thoughts...</p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {insight}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Type breakdown */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-medium uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-muted)' }}>
              By Type
            </h2>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: 'var(--surface)', border: `1px solid ${TYPE_COLORS[type] || 'var(--border)'}` }}>
                  <span style={{ color: TYPE_COLORS[type] || 'var(--text-muted)' }}>●</span>
                  <span style={{ color: 'var(--text-primary)' }}>{type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent notes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}>
              Recent
            </h2>
            <button onClick={() => navigate('/recent')}
              className="text-xs" style={{ color: '#06B6D4' }}>
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg animate-pulse"
                  style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="rounded-lg p-8 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                No ideas yet. Start capturing.
              </p>
              <button onClick={() => navigate('/notes')}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: '#06B6D4', color: 'var(--input-bg)' }}>
                Add your first note
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentNotes.map((note) => (
                <motion.div
                  key={note.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: TYPE_COLORS[note.type] || 'var(--text-muted)', fontSize: 8 }}>●</span>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{note.title}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(note.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })} · {new Date(note.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
