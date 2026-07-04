import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactFlow, { useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { getNotes } from '../api/notes';
import { getConnections } from '../api/connections';
import type { Folder, Note, Connection } from '../types';
import { FaFolder, FaBrain, FaLightbulb, FaMicroscope, FaFireFlameCurved } from 'react-icons/fa6';
import { IoBook } from 'react-icons/io5';
import { AiFillThunderbolt } from 'react-icons/ai';
import { GiBullseye, GiBigWave } from 'react-icons/gi';
import { SiPolestar } from 'react-icons/si';

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  folder: <FaFolder />, brain: <FaBrain />, lightbulb: <FaLightbulb />,
  book: <IoBook />, microscope: <FaMicroscope />, bullseye: <GiBullseye />,
  thunder: <AiFillThunderbolt />, wave: <GiBigWave />, fire: <FaFireFlameCurved />,
  star: <SiPolestar />,
};

const renderFolderIcon = (iconKey: string) => FOLDER_ICONS[iconKey] || <FaFolder />;

const TYPE_COLORS: Record<string, string> = {
  thought: '#06b6d4', quote: '#10B981', article: '#F59E0B',
  question: '#F43F5E', idea: '#8B5CF6',
};

// Animated item for scroll animation
const AnimatedItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {children}
    </motion.div>
  );
};

function MiniGraph({ folder }: { folder: Folder | null }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeStore();

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
            background: TYPE_COLORS[note.type] || '#06b6d4',
            border: 'none', borderRadius: '50%',
            width: 10, height: 10, minWidth: 10,
          },
        }));

        const flowEdges: Edge[] = connsData.map((conn) => {
          const strength = conn.strength || 0;
          return {
            id: conn.id,
            source: conn.note_from,
            target: conn.note_to,
            style: {
              stroke: `rgba(6, 182, 212, ${0.3 + strength * 0.7})`,
              strokeWidth: 1 + strength * 2,
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Loading...</p>
    </div>
  );

  if (nodes.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '24px' }}>◎</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No notes yet</p>
    </div>
  );

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      fitView nodesDraggable={false} nodesConnectable={false}
      elementsSelectable={false} zoomOnScroll={false} panOnDrag={false}
      style={{ background: 'transparent' }}
      proOptions={{ hideAttribution: true }}
    />
  );
}

export default function Graphs() {
  const navigate = useNavigate();
  const { folders, setSelectedFolder } = useNoteStore();
  const { isDark } = useThemeStore();

  const handleOpen = (folder: Folder | null) => {
    setSelectedFolder(folder);
    navigate('/graph');
  };

  const allGraphs = [
    { folder: null, name: 'Loose Thoughts', icon: null, color: '#06b6d4' },
    ...folders.map(f => ({ folder: f, name: f.name, icon: f.icon, color: f.color })),
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Graphs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {allGraphs.length} mind maps
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {allGraphs.map((g, i) => (
          <AnimatedItem key={g.folder?.id || 'unfiled'} index={i}>
            <motion.div
              whileHover={{ y: -4 }}
              style={{
                borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                border: isDark ? `1px solid ${g.color}33` : `1px solid ${g.color}44`,
                boxShadow: isDark
                  ? '0 4px 16px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDark
                  ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${g.color}44`
                  : `0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px ${g.color}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isDark
                  ? '0 4px 16px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.06)';
              }}
              onClick={() => handleOpen(g.folder)}
            >
              {/* Color accent top bar */}
              <div style={{
                height: '3px',
                background: `linear-gradient(90deg, ${g.color}, ${g.color}88)`,
              }} />

              {/* Mini graph preview */}
              <div style={{
                height: '200px',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                position: 'relative',
              }}>
                {/* Dot pattern */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: isDark
                    ? 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)'
                    : 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }} />
                <div style={{ position: 'relative', height: '100%' }}>
                  <MiniGraph folder={g.folder} />
                </div>
              </div>

              {/* Card footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: g.color + '22', border: `1px solid ${g.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: g.color, fontSize: '14px',
                  }}>
                    {g.folder ? renderFolderIcon(g.folder.icon) : '✦'}
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                      {g.name}
                    </p>
                  </div>
                </div>
                <button
                  style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '11px',
                    fontWeight: 600, cursor: 'pointer',
                    background: g.color + '22', border: `1px solid ${g.color}44`,
                    color: g.color,
                  }}
                >
                  Open →
                </button>
              </div>
            </motion.div>
          </AnimatedItem>
        ))}
      </div>
    </div>
  );
}
