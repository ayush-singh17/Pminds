import { useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  useNodesState, useEdgesState,
  MiniMap, Controls,
  useReactFlow, ReactFlowProvider
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { getNotes, createNote, suggestConnections, getPatternInsight } from '../api/notes';
import { getConnections } from '../api/connections';
import DotField from '../components/DotField/DotField';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import type { Note, Connection } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

const TYPE_BG: Record<string, string> = {
  thought: 'rgba(6, 182, 212, 0.15)',
  quote: 'rgba(16, 185, 129, 0.15)',
  article: 'rgba(245, 158, 11, 0.15)',
  question: 'rgba(244, 63, 94, 0.15)',
  idea: 'rgba(139, 92, 246, 0.15)',
};

const TYPE_BG_RGB: Record<string, string> = {
  thought: '6, 182, 212',
  quote: '16, 185, 129',
  article: '245, 158, 11',
  question: '244, 63, 94',
  idea: '139, 92, 246',
};

const TYPE_BORDER: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

const TYPES = ['thought', 'quote', 'article', 'question', 'idea'];

function GraphInner() {
  const { fitView } = useReactFlow();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const rawNotesRef = useRef<Note[]>([]);
  const rawConnectionsRef = useRef<Connection[]>([]);
  
  useEffect(() => {
    rawNotesRef.current = rawNotes;
    rawConnectionsRef.current = rawConnections;
  }, [rawNotes, rawConnections]);

  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [timelineNodes, setTimelineNodes] = useState<Node[]>([]);
  const [timelineEdges, setTimelineEdges] = useState<Edge[]>([]);

  const buildTimeline = (notesList: Note[], connectionsList: Connection[]) => {
    // Sort by created_at
    const sorted = [...notesList].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Build all nodes but start hidden
    const angleStep = (2 * Math.PI) / Math.max(sorted.length - 1, 1);
    const radius = 320;
    const cx = 500;
    const cy = 400;
    let angleIndex = 0;

    const allNodes: Node[] = sorted.map((note, i) => {
      const randomRadius = radius + (Math.random() - 0.5) * 80;
      const randomAngleOffset = (Math.random() - 0.5) * 0.3;
      const isCentral = i === Math.floor(sorted.length / 2);

      return {
        id: note.id,
        position: isCentral
          ? { x: cx, y: cy }
          : {
              x: cx + randomRadius * Math.cos(angleStep * angleIndex + randomAngleOffset),
              y: cy + randomRadius * Math.sin(angleStep * angleIndex++ + randomAngleOffset),
            },
        data: {
          label: note.title,
          type: note.type,
          created_at: note.created_at,
          index: i,
        },
        style: {
          opacity: 0, // start hidden
          background: TYPE_BG[note.type] || 'rgba(17,24,39,0.8)',
          border: `1px solid ${TYPE_BORDER[note.type] || '#1E293B'}`,
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          padding: '8px 14px',
          cursor: 'pointer',
          maxWidth: '160px',
          backdropFilter: 'blur(10px)',
          transition: 'opacity 0.5s, transform 0.5s',
        },
      };
    });

    setTimelineNodes(allNodes);
    setTimelineEdges(connectionsList.map(conn => ({
      id: conn.id,
      source: conn.note_from,
      target: conn.note_to,
      style: { opacity: 0, stroke: `rgba(6,182,212,0.5)`, strokeWidth: 1.5 },
    })));
    setTimelineIndex(0);
  };

  useEffect(() => {
    if (!timelineMode || timelineNodes.length === 0) return;
    if (timelineIndex >= timelineNodes.length) return;

    const timer = setTimeout(() => {
      // Show next node
      setTimelineNodes(prev => prev.map((node, i) => {
        if (i === timelineIndex) {
          return {
            ...node,
            style: { ...node.style, opacity: 1 },
          };
        }
        return node;
      }));

      // Show edges connected to this node after it appears
      const currentNote = rawNotesRef.current
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        [timelineIndex];

      if (currentNote) {
        setTimelineEdges(prev => prev.map(edge => {
          const shouldShow = edge.source === currentNote.id || edge.target === currentNote.id;
          // Only show if the other node is already visible
          const otherNodeId = edge.source === currentNote.id ? edge.target : edge.source;
          const otherNodeIndex = timelineNodes.findIndex(n => n.id === otherNodeId);
          if (shouldShow && otherNodeIndex < timelineIndex) {
            return { ...edge, style: { ...edge.style, opacity: 1 } };
          }
          return edge;
        }));
      }

      setTimelineIndex(prev => prev + 1);
    }, 600); // 600ms between each note appearing

    return () => clearTimeout(timer);
  }, [timelineMode, timelineIndex, timelineNodes.length]);

  const toggleType = (type: string) => {
    setActiveTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getGraphCacheKey = () => `pminds_graph_${selectedFolder?.id || 'unfiled'}`;

  const saveGraphToCache = (notesList: Note[], connectionsList: Connection[]) => {
    const cache = { notes: notesList, connections: connectionsList, timestamp: Date.now() };
    localStorage.setItem(getGraphCacheKey(), JSON.stringify(cache));
  };

  const loadGraphFromCache = () => {
    try {
      const cached = localStorage.getItem(getGraphCacheKey());
      if (!cached) return null;
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const clearGraphCache = () => localStorage.removeItem(getGraphCacheKey());

  const fetchAISummary = async () => {
    if (rawNotes.length === 0) return;
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const insight = await getPatternInsight(
        rawNotes.map(n => ({ title: n.title, content: n.content }))
      );
      setAiSummary(insight);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleReorganise = () => {
    if (rawNotes.length === 0) return;
    clearGraphCache();
    buildGraph(rawNotes, rawConnections, isDark);
    saveGraphToCache(rawNotes, rawConnections);
    setTimeout(() => fitView({ duration: 800, padding: 0.3 }), 150);
  };

  const buildGraph = (notesList: Note[], connectionsList: Connection[], dark: boolean) => {
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
      
      const randomRadius = radius + (Math.random() - 0.5) * 80;
      const randomAngleOffset = (Math.random() - 0.5) * 0.3;

      const position = isCentral
        ? { x: cx, y: cy }
        : {
            x: cx + randomRadius * Math.cos(angleStep * angleIndex + randomAngleOffset),
            y: cy + randomRadius * Math.sin(angleStep * angleIndex++ + randomAngleOffset),
          };

      return {
        id: note.id,
        position,
        data: { label: note.title, type: note.type },
        style: isCentral ? {
          background: `rgba(${TYPE_BG_RGB[note.type] || '6, 182, 212'}, ${dark ? 0.15 : 0.25})`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `2px solid ${TYPE_BORDER[note.type] || '#06B6D4'}`,
          borderRadius: '50%',
          color: TYPE_BORDER[note.type] || '#06B6D4',
          fontSize: '13px',
          fontWeight: '600',
          padding: '20px',
          width: '140px',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: `0 0 30px ${TYPE_BORDER[note.type]}44, 
                      0 8px 32px rgba(0,0,0,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.1)`,
        } : {
          background: TYPE_BG[note.type] || 'rgba(17,24,39,0.8)',
          border: `1px solid ${TYPE_BORDER[note.type] || '#1E293B'}`,
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          padding: '8px 14px',
          cursor: 'pointer',
          maxWidth: '160px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 16px ${TYPE_BORDER[note.type]}22`,
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
        labelBgStyle: {
          fill: dark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          fillOpacity: 1,
          rx: 6,
          ry: 6,
        },
        labelStyle: {
          fill: dark ? '#06B6D4' : '#0891B2',
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgPadding: [6, 8] as [number, number],
        labelBgBorderRadius: 6,
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

      clearGraphCache();

      const updatedNotes = [note, ...rawNotes];
      setNotes(updatedNotes);
      setRawNotes(updatedNotes);

      setShowCreateInPanel(false);
      setPanelForm({ title: '', content: '', type: 'thought', folder_ids: [] });

      await suggestConnections(note.id);

      const newConns = await getConnections(selectedFolder?.id);
      setRawConnections(newConns);

      saveGraphToCache(updatedNotes, newConns);
      buildGraph(updatedNotes, newConns, isDark);
    } finally {
      setPanelCreating(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const cached = loadGraphFromCache();
        if (cached) {
          setNotes(cached.notes);
          setRawNotes(cached.notes);
          setRawConnections(cached.connections);
          buildGraph(cached.notes, cached.connections, isDark);
          setLoading(false);

          const params = selectedFolder?.id === 'inbox'
            ? {}
            : selectedFolder
            ? { folder: selectedFolder.id }
            : { unfiled: true };

          const [notesData, connectionsData] = await Promise.all([
            getNotes(params),
            getConnections(selectedFolder?.id === 'inbox' ? undefined : selectedFolder?.id),
          ]);

          const notesChanged = JSON.stringify(notesData.map(n => n.id)) !== 
                               JSON.stringify(cached.notes.map((n: Note) => n.id));
          const connsChanged = connectionsData.length !== cached.connections.length;

          if (notesChanged || connsChanged) {
            setNotes(notesData);
            setRawNotes(notesData);
            setRawConnections(connectionsData);
            saveGraphToCache(notesData, connectionsData);
            buildGraph(notesData, connectionsData, isDark);
          }
          return;
        }

        const params = selectedFolder?.id === 'inbox'
          ? {}
          : selectedFolder
          ? { folder: selectedFolder.id }
          : { unfiled: true };

        const [notesData, connectionsData] = await Promise.all([
          getNotes(params),
          getConnections(selectedFolder?.id === 'inbox' ? undefined : selectedFolder?.id),
        ]);

        setNotes(notesData);
        setRawNotes(notesData);
        setRawConnections(connectionsData);
        saveGraphToCache(notesData, connectionsData);
        buildGraph(notesData, connectionsData, isDark);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedFolder]);

  useEffect(() => {
    if (rawNotes.length > 0) buildGraph(rawNotes, rawConnections, isDark);
  }, [activeTypes, isDark]);

  const inputStyle = {
    width: '100%', marginBottom: '8px',
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px', padding: '8px 12px',
    color: 'var(--text-primary)', fontSize: '12px',
    outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: isDark ? '#000000' : '#e2e2d6' }}>
      {/* Dot field background */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={50}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#3b3a3a"
          gradientTo="#8c8c8c"
          glowColor={isDark ? '#000000' : "#e2e2d6"}
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
            nodes={timelineMode ? timelineNodes : nodes}
            edges={timelineMode ? timelineEdges : edges}
            onNodesChange={timelineMode ? undefined : onNodesChange}
            onEdgesChange={timelineMode ? undefined : onEdgesChange}
            onNodeClick={(_, node) => navigate(`/notes/${node.id}`)}
            fitView
            style={{ background: 'transparent' }}
            proOptions={{ hideAttribution: true }}
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

      {/* Mind Map header */}
      <div className="glass-btn"
        style={{
          position: 'absolute', top: 24, left: 24, zIndex: 2,
          borderRadius: '8px', padding: '10px 16px',
        }}>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>Mind Map</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {nodes.length} ideas · {edges.length} connections
        </p>
      </div>

      {/* Type filters */}
      <div className="glass-btn"
        style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', gap: '8px',
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
              color: activeTypes.includes(type) ? color : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            ● {type}
          </button>
        ))}
      </div>

      {/* Timeline Progress Bar */}
      {timelineMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 80, left: '50%',
            transform: 'translateX(-50%)', zIndex: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}
        >
          {/* Progress bar */}
          <div style={{
            width: '300px', height: '3px', borderRadius: '999px',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <motion.div
              style={{
                height: '100%', background: '#8B5CF6', borderRadius: '999px',
                width: `${(timelineIndex / Math.max(timelineNodes.length, 1)) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Current note timestamp */}
          <div className="glass-btn" style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '11px' }}>
            {timelineIndex < timelineNodes.length ? (
              <span style={{ color: '#8B5CF6' }}>
                {timelineIndex + 1} / {timelineNodes.length} · {
                  rawNotesRef.current
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    [timelineIndex] && new Date(
                      rawNotesRef.current
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        [timelineIndex].created_at
                    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
              </span>
            ) : (
              <span style={{ color: '#10B981' }}>✓ Timeline complete</span>
            )}
          </div>

          {/* Speed control */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTimelineIndex(0)}
              className="glass-btn"
              style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
              ↩ Restart
            </button>
          </div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div style={{
        position: 'absolute', top: 24, right: 24, zIndex: 2,
        display: 'flex', gap: '8px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="glass-btn"
          style={{
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          ← Dashboard
        </button>
        <button
          onClick={() => {
            if (!timelineMode) {
              buildTimeline(rawNotesRef.current, rawConnectionsRef.current);
              setTimelineMode(true);
            } else {
              setTimelineMode(false);
              setTimelineIndex(0);
              buildGraph(rawNotesRef.current, rawConnectionsRef.current, isDark);
            }
          }}
          className="glass-btn"
          style={{
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', cursor: 'pointer',
            background: timelineMode ? 'rgba(139,92,246,0.3)' : undefined,
            borderColor: timelineMode ? 'rgba(139,92,246,0.5)' : undefined,
            color: timelineMode ? '#8B5CF6' : undefined,
          }}
        >
          {timelineMode ? '⏸ Exit Timeline' : '⏵ Timeline'}
        </button>
        <button
          onClick={handleReorganise}
          className="glass-btn"
          style={{
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          ⟳ Reorganise
        </button>
        <button
          onClick={fetchAISummary}
          className="glass-btn"
          style={{
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          ✦ Read my mind
        </button>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="glass-btn"
          style={{
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', cursor: 'pointer',
            background: showPanel ? 'rgba(6,182,212,0.2)' : undefined,
            borderColor: showPanel ? 'rgba(6,182,212,0.4)' : undefined,
            color: showPanel ? '#06B6D4' : undefined,
          }}
        >
          ✦ Notes
        </button>
      </div>

      {/* AI Summary Panel */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute', top: 72, left: '50%',
              transform: 'translateX(-50%)', zIndex: 2,
              width: '420px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px', padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#06B6D4', fontSize: '14px' }}>✦</span>
                <p style={{
                  color: '#06B6D4', fontSize: '11px',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  What your mind reveals
                </p>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
              background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)',
              borderRadius: '1px',
            }} />

            {/* Content */}
            {summaryLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#06B6D4', animation: 'pulse 1.5s infinite',
                }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Your mind is wandering through the connections...
                </p>
              </div>
            ) : (
              <p style={{
                color: 'var(--text-primary)', fontSize: '14px',
                lineHeight: '1.7', fontStyle: 'italic',
              }}>
                "{aiSummary}"
              </p>
            )}

            {/* Footer */}
            {!summaryLoading && (
              <div style={{
                marginTop: '12px', paddingTop: '12px',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Based on {rawNotes.length} notes
                </p>
                <button
                  onClick={fetchAISummary}
                  style={{
                    background: 'none', border: 'none',
                    color: '#06B6D4', fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Refresh ↻
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating notes panel */}
      {showPanel && (
        <motion.div
          className="glass-btn"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{
            position: 'absolute', top: 72, right: 24, zIndex: 2,
            width: '300px', maxHeight: '75vh',
            background: '#111827', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {selectedPanelNote ? (
            <>
              {/* Note detail view */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
                <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.8', marginTop: '10px' }}>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '16px' }}>
                  {new Date(selectedPanelNote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>

                {/* Open full page */}
                <button
                  className="glass-btn"
                  onClick={() => navigate(`/notes/${selectedPanelNote.id}`)}
                  style={{
                    marginTop: '16px', width: '100%',
                    padding: '8px', borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                    color: 'var(--text-muted)',
                    fontSize: '12px', cursor: 'pointer',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
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
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>
                    Your notes
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                    {notes.length} ideas
                  </p>
                </div>
                <button
                  className="glass-btn"
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
                  style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={panelForm.title}
                    onChange={(e) => setPanelForm({ ...panelForm, title: e.target.value })}
                    required
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    value={panelForm.content}
                    onChange={(e) => setPanelForm({ ...panelForm, content: e.target.value })}
                    required
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                  <select
                    value={panelForm.type}
                    onChange={(e) => setPanelForm({ ...panelForm, type: e.target.value })}
                    style={inputStyle}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateInPanel(false)}
                      style={{
                        flex: 1, padding: '8px',
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '8px', color: 'var(--text-muted)',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={panelCreating}
                      style={{
                        flex: 1, padding: '8px',
                        background: 'black',
                        border: '1px solid black',
                        borderRadius: '8px', color: 'white',
                        fontSize: '12px', fontWeight: 500,
                        cursor: 'pointer', backdropFilter: 'blur(10px)',
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
                      background: 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                    onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: TYPE_COLORS[note.type] || '#94A3B8', fontSize: '8px' }}>●</span>
                      <p style={{
                        color: 'var(--text-primary)', fontSize: '12px',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {note.title}
                      </p>
                    </div>
                    <p style={{
                      color: 'var(--text-muted)', fontSize: '11px',
                      marginTop: '3px', marginLeft: '16px',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis',
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

export default function Graph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
