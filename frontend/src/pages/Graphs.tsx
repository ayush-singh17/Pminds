import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactFlow, { useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNoteStore } from '../store/noteStore';
import { getNotes } from '../api/notes';
import { getConnections } from '../api/connections';
import type { Folder } from '../types';

const TYPE_COLORS: Record<string, string> = {
  thought: '#06B6D4',
  quote: '#10B981',
  article: '#F59E0B',
  question: '#F43F5E',
  idea: '#8B5CF6',
};

function MiniGraph({ folder }: { folder: Folder | null }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = folder ? { folder: folder.id } : { unfiled: true };
        const [notesData, connsData] = await Promise.all([
          getNotes(params),
          getConnections(folder?.id),
        ]);

        const angleStep = (2 * Math.PI) / Math.max(notesData.length, 1);
        const radius = 80;
        const cx = 150;
        const cy = 100;

        const flowNodes: Node[] = notesData.map((note, i) => ({
          id: note.id,
          position: {
            x: cx + radius * Math.cos(angleStep * i),
            y: cy + radius * Math.sin(angleStep * i),
          },
          data: { label: '' },
          style: {
            background: TYPE_COLORS[note.type] || '#06B6D4',
            border: 'none',
            borderRadius: '50%',
            width: 10,
            height: 10,
            minWidth: 10,
          },
        }));

        const flowEdges: Edge[] = connsData.map((conn) => {
          const strength = conn.strength || 0;
          const strokeWidth = 1 + strength * 2;
          const opacity = 0.3 + strength * 0.7;
          return {
            id: conn.id,
            source: conn.note_from,
            target: conn.note_to,
            style: {
              stroke: `rgba(6, 182, 212, ${opacity})`,
              strokeWidth,
            },
          };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [folder]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: '#94A3B8', fontSize: '11px' }}>Loading...</p>
    </div>
  );

  if (nodes.length === 0) return (
    <div className="flex items-center justify-center h-full">
      <p style={{ color: '#94A3B8', fontSize: '11px' }}>No notes yet</p>
    </div>
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      panOnDrag={false}
      style={{ background: 'transparent' }}
    >
    </ReactFlow>
  );
}

export default function Graphs() {
  const navigate = useNavigate();
  const { folders, setSelectedFolder } = useNoteStore();

  const handleOpen = (folder: Folder | null) => {
    setSelectedFolder(folder);
    navigate('/graph');
  };

  const allGraphs = [
    { folder: null, name: 'Unfiled', icon: '✦', color: '#06B6D4' },
    ...folders.map(f => ({ folder: f, name: f.name, icon: f.icon, color: f.color })),
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>Graphs</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          {allGraphs.length} mind maps
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {allGraphs.map((g) => (
          <motion.div
            key={g.folder?.id || 'unfiled'}
            whileHover={{ y: -2 }}
            className="rounded-xl overflow-hidden cursor-pointer"
            style={{ background: '#111827', border: `1px solid #1E293B` }}
            onClick={() => handleOpen(g.folder)}
          >
            {/* Mini graph preview */}
            <div style={{ height: '200px', background: '#0A0F1E', position: 'relative' }}>
              {/* Dot pattern */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, #1E293B 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }} />
              <div style={{ position: 'relative', height: '100%' }}>
                <MiniGraph folder={g.folder} />
              </div>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span style={{ color: g.color }}>{g.icon}</span>
                <span className="text-sm font-medium" style={{ color: '#F8FAFC' }}>
                  {g.name}
                </span>
              </div>
              <button
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: g.color + '22', color: g.color }}
              >
                Open →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
