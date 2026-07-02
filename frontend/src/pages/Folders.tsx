import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { FaFolder, FaBrain, FaLightbulb, FaMicroscope, FaFireFlameCurved } from 'react-icons/fa6';
import { IoBook } from 'react-icons/io5';
import { AiFillThunderbolt } from 'react-icons/ai';
import { GiBullseye, GiBigWave } from 'react-icons/gi';
import { SiPolestar } from 'react-icons/si';

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  folder: <FaFolder />,
  brain: <FaBrain />,
  lightbulb: <FaLightbulb />,
  book: <IoBook />,
  microscope: <FaMicroscope />,
  bullseye: <GiBullseye />,
  thunder: <AiFillThunderbolt />,
  wave: <GiBigWave />,
  fire: <FaFireFlameCurved />,
  star: <SiPolestar />,
};

const renderFolderIcon = (iconKey: string) => FOLDER_ICONS[iconKey] || <FaFolder />;

export default function Folders() {
  const navigate = useNavigate();
  const { folders, setSelectedFolder } = useNoteStore();
  const { isDark } = useThemeStore();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <h1 style={{
          fontSize: '32px', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: '6px',
          letterSpacing: '-0.02em',
        }}>
          Folders
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {folders.length} {folders.length === 1 ? 'collection' : 'collections'}
        </p>
      </motion.div>

      {folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            borderRadius: '16px', padding: '60px 20px', textAlign: 'center',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
            border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📁</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>
            No folders yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Create one from the sidebar to organize your thoughts.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {folders.map((folder, i) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => { setSelectedFolder(folder); navigate('/notes'); }}
              style={{
                borderRadius: '16px', padding: '24px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                border: isDark
                  ? `1px solid ${folder.color}33`
                  : `1px solid ${folder.color}44`,
                boxShadow: isDark
                  ? `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`
                  : `0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDark
                  ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${folder.color}44`
                  : `0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px ${folder.color}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isDark
                  ? `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`
                  : `0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`;
              }}
            >
              {/* Color accent top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg, ${folder.color}, ${folder.color}88)`,
                borderRadius: '16px 16px 0 0',
              }} />

              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: folder.color + '22',
                border: `1px solid ${folder.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: folder.color, fontSize: '20px',
                marginBottom: '16px',
              }}>
                {renderFolderIcon(folder.icon)}
              </div>

              {/* Name */}
              <h2 style={{
                color: 'var(--text-primary)', fontSize: '16px',
                fontWeight: 600, marginBottom: '4px',
              }}>
                {folder.name}
              </h2>

              {/* Note count */}
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                {folder.note_count} {folder.note_count === 1 ? 'note' : 'notes'}
              </p>

              {/* Graph button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolder(folder);
                  navigate('/graph');
                }}
                style={{
                  padding: '6px 14px', borderRadius: '999px', fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer',
                  background: folder.color + '22',
                  border: `1px solid ${folder.color}44`,
                  color: folder.color,
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                ◎ View Graph
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
