import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, Tag, Connection, Folder } from '../types';

interface NoteState {
  notes: Note[];
  tags: Tag[];
  connections: Connection[];
  folders: Folder[];
  selectedFolder: Folder | null;
  selectedNote: Note | null;
  notesCache: Record<string, Note[]>;
  lastFetched: Record<string, number>;

  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  setTags: (tags: Tag[]) => void;
  setConnections: (connections: Connection[]) => void;
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  deleteFolder: (id: string) => void;
  setSelectedFolder: (folder: Folder | null) => void;
  setSelectedNote: (note: Note | null) => void;
  setNotesForKey: (key: string, notes: Note[]) => void;
  setLastFetched: (key: string) => void;
  isStale: (key: string, maxAge?: number) => boolean;
  invalidate: (key: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      tags: [],
      connections: [],
      folders: [],
      selectedFolder: null,
      selectedNote: null,
      notesCache: {},
      lastFetched: {},

      setNotes: (notes) => set({ notes }),
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (note) => set((state) => ({
        notes: state.notes.map((n) => n.id === note.id ? note : n),
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      })),
      setTags: (tags) => set({ tags }),
      setConnections: (connections) => set({ connections }),
      setFolders: (folders) => set({ folders }),
      addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        selectedFolder: state.selectedFolder?.id === id ? null : state.selectedFolder,
      })),
      setSelectedFolder: (folder) => set({ selectedFolder: folder }),
      setSelectedNote: (note) => set({ selectedNote: note }),

      setNotesForKey: (key, notes) => set(state => ({
        notes,
        notesCache: { ...state.notesCache, [key]: notes },
      })),

      setLastFetched: (key) => set(state => ({
        lastFetched: { ...state.lastFetched, [key]: Date.now() }
      })),

      isStale: (key, maxAge = 60000) => {
        const last = get().lastFetched[key];
        if (!last) return true;
        return Date.now() - last > maxAge;
      },

      invalidate: (key) => set(state => ({
        lastFetched: { ...state.lastFetched, [key]: 0 }
      })),
    }),
    {
      name: 'pminds-store',
      partialize: (state) => ({
        notes: state.notes,
        tags: state.tags,
        folders: state.folders,
        connections: state.connections,
        notesCache: state.notesCache,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
