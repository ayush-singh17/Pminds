import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNoteStore } from '../store/noteStore';

export default function Folders() {
  const navigate = useNavigate();
  const { folders, setSelectedFolder } = useNoteStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>Folders</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>{folders.length} collections</p>
      </div>

      {folders.length === 0 ? (
        <div className="rounded-lg p-12 text-center"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            No folders yet. Create one from the sidebar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              whileHover={{ y: -2 }}
              onClick={() => { setSelectedFolder(folder); navigate('/notes'); }}
              className="rounded-xl p-6 cursor-pointer"
              style={{ background: '#111827', border: `1px solid ${folder.color}33` }}
            >
              <div className="text-3xl mb-3">{folder.icon}</div>
              <h2 className="text-sm font-medium mb-1" style={{ color: '#F8FAFC' }}>
                {folder.name}
              </h2>
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                {folder.note_count} notes
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFolder(folder);
                    navigate('/graph');
                  }}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: folder.color + '22', color: folder.color }}
                >
                  ◎ Graph
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
