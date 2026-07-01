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


  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesData, tagsData] = await Promise.all([
          getNotes(), // no params = all notes
          getTags(),
        ]);
        setNotes(notesData);
        setTags(tagsData);

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
    <div className="mx-auto" style={{ paddingBottom: '32px', paddingLeft: '8px', paddingRight: '8px' ,width: '100%'}}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="glass-btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)' ,width: '100%',borderRadius: '20px',height:'100px',margin:'5px'}} >
          <h1 className="text-4xl font-semibold mb-1" style={{ color: 'var(--text-primary)' , padding:'10px',paddingTop:'12px',paddingLeft:'15px'}}>
            Connect Your Thoughts
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-primary)',padding:'10px',paddingLeft:'15px' }}>
            {notes.length} ideas captured so far.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-10" style={{width:'100%',height:'150px',margin:'5px',marginTop:'7px'}}>
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
            <div key={stat.label} className="glass-btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)' ,width: '100%',borderRadius: '20px',
              display:'flex',flexDirection: 'column',alignItems: 'center',justifyContent: 'center',padding: '24px',
            }} >
              <p className="text-3xl font-semibold mb-1" style={{ color: 'var(--text-primary)' ,padding:'10px',paddingTop:'12px',paddingLeft:'15px'}}>
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: '#e2e2d6' ,padding:'10px',paddingLeft:'15px' }}>{stat.label}</p>
            </div>
          ))}
        </div>


        {/* AI Insight */}
        {(insight || insightLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-btn"
            style={{
              background: 'var(--surface)',
              position: 'relative',
              overflow: 'hidden',
              borderRadius:'20px',
              padding:'10px',paddingTop:'12px',paddingLeft:'15px',marginLeft:'7px',marginTop:'7px',marginBottom:'7px'
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, lightgrey, transparent)',
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


        {/* Recent notes */}
        <div>
          <div className="flex items-center justify-between mb-4" style={{padding:'10px',paddingTop:'12px',paddingLeft:'15px'}}>
            <h2 className="text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}>
              Recent
            </h2>
            <button onClick={() => navigate('/recent')}
              className="text-sm" style={{ color: '#06B6D4' }}>
              View all →
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg animate-pulse"
                  style={{ background: '#1f1e21' }} />
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
                  className="glass-btn flex items-center justify-between px-4 py-3 cursor-pointer"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' ,padding:'10px',paddingTop:'12px',paddingLeft:'15px',borderRadius:'20px'}}
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
