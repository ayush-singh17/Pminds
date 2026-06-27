import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  useNodesState, useEdgesState,
  MiniMap, Controls
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { getNotes } from '../api/notes';
import { getConnections } from '../api/connections';
import DotField from '../components/DotField/DotField';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';
import type { Note } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

export default function Graph() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedPanelNote, setSelectedPanelNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const { selectedFolder } = useNoteStore();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesData, connectionsData] = await Promise.all([
          getNotes(selectedFolder ? { folder: selectedFolder.id } : { unfiled: true }),
          getConnections(selectedFolder?.id),
        ]);
        
        setNotes(notesData);

        // Count connections per note
        const connectionCount: Record<string, number> = {};
        connectionsData.forEach((conn) => {
          connectionCount[conn.note_from] = (connectionCount[conn.note_from] || 0) + 1;
          connectionCount[conn.note_to] = (connectionCount[conn.note_to] || 0) + 1;
        });

        // Find the most connected note
        const centralNoteId = Object.entries(connectionCount)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || notesData[0]?.id;

        // Layout
        const angleStep = (2 * Math.PI) / (notesData.length - 1 || 1);
        const radius = 320;
        const cx = 500;
        const cy = 400;

        let angleIndex = 0;

        const flowNodes: Node[] = notesData.map((note) => {
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

        const flowEdges: Edge[] = connectionsData.map((conn) => ({
          id: conn.id,
          source: conn.note_from,
          target: conn.note_to,
          style: { stroke: '#1E293B', strokeWidth: 1.5 },
          animated: false,
          label: conn.strength ? `${Math.round(conn.strength * 100)}%` : '',
          labelStyle: { fill: '#94A3B8', fontSize: 10 },
          labelBgStyle: { fill: '#111827' },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 4,
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedFolder]);

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
              {/* Notes list view */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #1E293B',
              }}>
                <p style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 500 }}>
                  Your notes
                </p>
                <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                  {notes.length} ideas
                </p>
              </div>

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
