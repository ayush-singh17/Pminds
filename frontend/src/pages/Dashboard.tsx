import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotes } from '../api/notes';
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

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesData, tagsData] = await Promise.all([getNotes(), getTags()]);
        setNotes(notesData);
        setTags(tagsData);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const recentNotes = notes.slice(0, 5);
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
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>
            Your mind, mapped.
          </h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
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
              style={{ background: '#111827', border: '1px solid #1E293B' }}>
              <p className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Type breakdown */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-medium uppercase tracking-widest mb-4"
              style={{ color: '#94A3B8' }}>
              By Type
            </h2>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: '#111827', border: `1px solid ${TYPE_COLORS[type] || '#1E293B'}` }}>
                  <span style={{ color: TYPE_COLORS[type] || '#94A3B8' }}>●</span>
                  <span style={{ color: '#F8FAFC' }}>{type}</span>
                  <span style={{ color: '#94A3B8' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent notes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium uppercase tracking-widest"
              style={{ color: '#94A3B8' }}>
              Recent
            </h2>
            <button onClick={() => navigate('/notes')}
              className="text-xs" style={{ color: '#06B6D4' }}>
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg animate-pulse"
                  style={{ background: '#111827' }} />
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="rounded-lg p-8 text-center"
              style={{ background: '#111827', border: '1px solid #1E293B' }}>
              <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>
                No ideas yet. Start capturing.
              </p>
              <button onClick={() => navigate('/notes')}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: '#06B6D4', color: '#0A0F1E' }}>
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
                  style={{ background: '#111827', border: '1px solid #1E293B' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: TYPE_COLORS[note.type] || '#94A3B8', fontSize: 8 }}>●</span>
                    <span className="text-sm" style={{ color: '#F8FAFC' }}>{note.title}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#94A3B8' }}>
                    {new Date(note.created_at).toLocaleDateString()}
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
