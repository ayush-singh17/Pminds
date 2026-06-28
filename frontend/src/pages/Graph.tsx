import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  useNodesState, useEdgesState,
  MiniMap, Controls
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { getNotes, createNote, suggestConnections } from '../api/notes';
import { getConnections } from '../api/connections';
import DotField from '../components/DotField/DotField';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';
import type { Note, Connection } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

const TYPES = ['thought', 'quote', 'article', 'question', 'idea'];

export default function Graph() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPanelNote, setSelectedPanelNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const { selectedFolder } = useNoteStore();
  const [showCreateInPanel, setShowCreateInPanel] = useState(false);
  const [panelForm, setPanelForm] = useState({
    title: '',
    content: '',
    type: 'thought',
    folder_ids: [] as string[],
  });
  const [panelCreating, setPanelCreating] = useState(false);
  const [activeTypes, setActiveTypes] = useState<string[]>([
    'thought', 'quote', 'article', 'question', 'idea'
  ]);
  const [rawNotes, setRawNotes] = useState<Note[]>([]);
  const [rawConnections, setRawConnections] = useState<Connection[]>([]);

  const toggleType = (type: string) => {
    setActiveTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const buildGraph = (notesList: Note[], connectionsList: Connection[]) => {
    const filteredNotes = notesList.filter(n => activeTypes.includes(n.type));
    const filteredConnections = connectionsList.filter(conn => {
      const fromNote = notesList.find(n => n.id === conn.note_from);
      const toNote = notesList.find(n => n.id === conn.note_to);
      return fromNote && toNote &&
        activeTypes.includes(fromNote.type) &&
        activeTypes.includes(toNote.type);
    });

    const connectionCount: Record<string, number> = {};
    filteredConnections.forEach((conn) => {
      connectionCount[conn.note_from] = (connectionCount[conn.note_from] || 0) + 1;
      connectionCount[conn.note_to] = (connectionCount[conn.note_to] || 0) + 1;
    });

    const centralNoteId = Object.entries(connectionCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || filteredNotes[0]?.id;

    const angleStep = (2 * Math.PI) / Math.max(filteredNotes.length - 1, 1);
    const radius = 320;
    const cx = 500;
    const cy = 400;
    let angleIndex = 0;

    const flowNodes: Node[] = filteredNotes.map((note) => {
      const isCentral = note.id === centralNoteId;
      const position = isCentral
        ? { x: cx, y: cy }
        : {
            x: cx + radius * Math.cos(angleStep * angleIndex),
            y: cy + radius * Math.sin(angleStep * angleIndex++),
          };

      return {
        id: note.id,
        position,
        data: { label: note.title, type: note.type },
        style: {
          background: isCentral ? '#06B6D4' : '#111827',
          border: `1px solid ${isCentral ? '#06B6D4' : TYPE_COLORS[note.type] || '#1E293B'}`,
          borderRadius: isCentral ? '50%' : '8px',
          color: isCentral ? '#0A0F1E' : '#F8FAFC',
          fontSize: isCentral ? '13px' : '12px',
          fontWeight: isCentral ? '600' : '400',
          padding: isCentral ? '20px' : '8px 14px',
          width: isCentral ? '140px' : '160px',
          height: isCentral ? '140px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: isCentral ? '0 0 30px rgba(6,182,212,0.3)' : 'none',
        },
      };
    });

    const flowEdges: Edge[] = filteredConnections.map((conn) => {
      const strength = conn.strength || 0;
      
      // Map strength (0-1) to stroke width (1-4)
      const strokeWidth = 1 + strength * 3;
      
      // Map strength to opacity
      const opacity = 0.3 + strength * 0.7;

      return {
        id: conn.id,
        source: conn.note_from,
        target: conn.note_to,
        style: {
          stroke: `rgba(6, 182, 212, ${opacity})`,
          strokeWidth,
        },
        animated: strength > 0.7, // animate strong connections
        label: conn.strength ? `${Math.round(conn.strength * 100)}%` : '',
        labelStyle: { fill: '#94A3B8', fontSize: 10 },
        labelBgStyle: { fill: '#111827' },
        labelBgPadding: [4, 4] as [number, number],
        labelBgBorderRadius: 4,
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handlePanelCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelCreating(true);
    try {
      const note = await createNote({
        ...panelForm,
        folder_ids: selectedFolder ? [selectedFolder.id] : [],
      });
      const newNotes = [note, ...notes];
      setNotes(newNotes);
      setShowCreateInPanel(false);
      setPanelForm({ title: '', content: '', type: 'thought', folder_ids: [] });

      await suggestConnections(note.id);

      const newConns = await getConnections(selectedFolder?.id);
      buildGraph(newNotes, newConns);
    } finally {
      setPanelCreating(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesData, connectionsData] = await Promise.all([
          getNotes(selectedFolder ? { folder: selectedFolder.id } : { unfiled: true }),
          getConnections(selectedFolder?.id),
        ]);
        
        setNotes(notesData);
        setRawNotes(notesData);
        setRawConnections(connectionsData);
        buildGraph(notesData, connectionsData);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedFolder]);

  useEffect(() => {
    if (rawNotes.length > 0) buildGraph(rawNotes, rawConnections);
  }, [activeTypes]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0F1E' }}>
      {/* Dot field background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <DotField
          dotRadius={1}
          dotSpacing={20}
          bulgeStrength={19}
          cursorForce={0.04}
          gradientFrom="rgba(6,182,212,0.15)"
          gradientTo="rgba(16,185,129,0.08)"
          glowColor="#0A0F1E"
          bulgeOnly
        />
      </div>

      {/* React Flow on top */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: '#94A3B8' }}>Building your mind map...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => navigate(`/notes/${node.id}`)}
            fitView
            style={{ background: 'transparent' }}
          >
            <MiniMap
              style={{ 
                background: '#111827', 
                border: '1px solid #1E293B',
                borderRadius: '8px',
              }}
              maskColor="rgba(0,0,0,0.6)"
              nodeColor={(n) => TYPE_COLORS[n.data?.type] || '#1E293B'}
            />
            <Controls style={{ background: '#111827', border: '1px solid #1E293B' }} />
          </ReactFlow>
        )}
      </div>

      {/* Header overlay */}
      <div style={{
        position: 'absolute', top: 24, left: 24, zIndex: 2,
        background: '#111827', border: '1px solid #1E293B',
        borderRadius: '8px', padding: '10px 16px',
      }}>
        <p style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 500 }}>Mind Map</p>
        <p style={{ color: '#94A3B8', fontSize: 12 }}>
          {nodes.length} ideas · {edges.length} connections
        </p>
      </div>

      {/* Type filters */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)', zIndex: 2,
        display: 'flex', gap: '8px',
        background: '#111827', border: '1px solid #1E293B',
        borderRadius: '999px', padding: '6px 12px',
      }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            style={{
              padding: '4px 12px', borderRadius: '999px',
              border: 'none', cursor: 'pointer', fontSize: '12px',
              background: activeTypes.includes(type) ? color + '33' : 'transparent',
              color: activeTypes.includes(type) ? color : '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            ● {type}
          </button>
        ))}
      </div>

      {/* Navigation buttons */}
      <div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 2,
        display: 'flex', gap: '8px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#111827', border: '1px solid #1E293B',
            borderRadius: '8px', padding: '8px 14px',
            color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
          }}
        >
          ← Dashboard
        </button>

        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{
            background: showPanel ? '#06B6D4' : '#111827',
            border: `1px solid ${showPanel ? '#06B6D4' : '#1E293B'}`,
            borderRadius: '8px', padding: '8px 14px',
            color: showPanel ? '#0A0F1E' : '#94A3B8',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          ✦ Notes
        </button>
      </div>

      {/* Floating notes panel */}
      {showPanel && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{
            position: 'absolute', top: 72, right: 24, zIndex: 2,
            width: '300px', maxHeight: '75vh',
            background: '#111827', border: '1px solid #1E293B',
            borderRadius: '12px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {selectedPanelNote ? (
            <>
              {/* Note detail view */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #1E293B',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <button
                  onClick={() => setSelectedPanelNote(null)}
                  style={{
                    color: '#94A3B8', fontSize: '13px',
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  ←
                </button>
                <p style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 500 }}>
                  {selectedPanelNote.title}
                </p>
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                {/* Type badge */}
                <span style={{
                  background: TYPE_COLORS[selectedPanelNote.type] + '22',
                  color: TYPE_COLORS[selectedPanelNote.type],
                  fontSize: '11px', padding: '2px 8px',
                  borderRadius: '999px', marginBottom: '12px',
                  display: 'inline-block',
                }}>
                  {selectedPanelNote.type}
                </span>

                {/* Content */}
                <p style={{
                  color: '#94A3B8', fontSize: '13px',
                  lineHeight: '1.8', marginTop: '10px',
                }}>
                  {selectedPanelNote.content}
                </p>

                {/* Source */}
                {selectedPanelNote.source_url && (
                  <a
                    href={selectedPanelNote.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#06B6D4', fontSize: '12px',
                      marginTop: '12px', display: 'inline-block',
                    }}
                  >
                    Source →
                  </a>
                )}

                {/* Tags */}
                {selectedPanelNote.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {selectedPanelNote.tags.map(tag => (
                      <span key={tag.id} style={{
                        background: tag.color + '22', color: tag.color,
                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                      }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '16px' }}>
                  {new Date(selectedPanelNote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>

                {/* Open full page */}
                <button
                  onClick={() => navigate(`/notes/${selectedPanelNote.id}`)}
                  style={{
                    marginTop: '16px', width: '100%',
                    padding: '8px', borderRadius: '8px',
                    background: '#1E293B', color: '#94A3B8',
                    fontSize: '12px', cursor: 'pointer',
                    border: '1px solid #1E293B',
                  }}
                >
                  Open full page →
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Panel header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 500 }}>
                    Your notes
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                    {notes.length} ideas
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateInPanel(!showCreateInPanel);
                    setSelectedPanelNote(null);
                  }}
                  style={{
                    background: showCreateInPanel ? '#06B6D4' : '#1E293B',
                    color: showCreateInPanel ? '#0A0F1E' : '#94A3B8',
                    border: 'none', borderRadius: '6px',
                    padding: '4px 10px', fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>

              {/* Inline create form */}
              {showCreateInPanel && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePanelCreate}
                  style={{ padding: '12px', borderBottom: '1px solid #1E293B' }}
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={panelForm.title}
                    onChange={(e) => setPanelForm({ ...panelForm, title: e.target.value })}
                    required
                    style={{
                      width: '100%', marginBottom: '8px',
                      background: '#0A0F1E', border: '1px solid #1E293B',
                      borderRadius: '6px', padding: '6px 10px',
                      color: '#F8FAFC', fontSize: '12px', outline: 'none',
                    }}
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    value={panelForm.content}
                    onChange={(e) => setPanelForm({ ...panelForm, content: e.target.value })}
                    required
                    rows={3}
                    style={{
                      width: '100%', marginBottom: '8px',
                      background: '#0A0F1E', border: '1px solid #1E293B',
                      borderRadius: '6px', padding: '6px 10px',
                      color: '#F8FAFC', fontSize: '12px', outline: 'none',
                      resize: 'none',
                    }}
                  />
                  <select
                    value={panelForm.type}
                    onChange={(e) => setPanelForm({ ...panelForm, type: e.target.value })}
                    style={{
                      width: '100%', marginBottom: '8px',
                      background: '#0A0F1E', border: '1px solid #1E293B',
                      borderRadius: '6px', padding: '6px 10px',
                      color: '#F8FAFC', fontSize: '12px', outline: 'none',
                    }}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateInPanel(false)}
                      style={{
                        flex: 1, padding: '6px',
                        background: '#1E293B', border: 'none',
                        borderRadius: '6px', color: '#94A3B8',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={panelCreating}
                      style={{
                        flex: 1, padding: '6px',
                        background: '#06B6D4', border: 'none',
                        borderRadius: '6px', color: '#0A0F1E',
                        fontSize: '12px', fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {panelCreating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </motion.form>
              )}

              <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedPanelNote(note)}
                    style={{
                      padding: '10px 12px', borderRadius: '8px',
                      cursor: 'pointer', marginBottom: '4px',
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.background = '#1E293B'}
                    onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: TYPE_COLORS[note.type] || '#94A3B8', fontSize: '8px' }}>●</span>
                      <p style={{
                        color: '#F8FAFC', fontSize: '12px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {note.title}
                      </p>
                    </div>
                    <p style={{
                      color: '#94A3B8', fontSize: '11px',
                      marginTop: '3px', marginLeft: '16px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {note.content.slice(0, 60)}...
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
