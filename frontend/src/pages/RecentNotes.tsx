import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotes } from '../api/notes';
import type { Note } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function RecentNotes() {
  const navigate = useNavigate();
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
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(note);
    });
    return groups;
  };

  const grouped = groupByDate(notes);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          style={{ color: '#94A3B8', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#F8FAFC' }}>Recent</h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>{notes.length} notes total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse"
              style={{ background: '#111827' }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, dateNotes]) => (
            <div key={date}>
              <p className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: '#94A3B8' }}>
                {date}
              </p>
              <div className="flex flex-col gap-2">
                {dateNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/notes/${note.id}`)}
                    className="flex items-start justify-between px-4 py-4 rounded-lg cursor-pointer group"
                    style={{ background: '#111827', border: '1px solid #1E293B' }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="mt-1.5 shrink-0"
                        style={{ color: TYPE_COLORS[note.type], fontSize: 8 }}>●</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium mb-1 truncate" style={{ color: '#F8FAFC' }}>
                          {note.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                          {note.content.slice(0, 80)}...
                        </p>
                        {/* Folder badges */}
                        {note.folders && note.folders.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {note.folders.map(folder => (
                              <span key={folder.id} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: folder.color + '22', color: folder.color }}>
                                {folder.icon} {folder.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {new Date(note.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs mt-1"
                        style={{ color: TYPE_COLORS[note.type] || '#94A3B8' }}>
                        {note.type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
