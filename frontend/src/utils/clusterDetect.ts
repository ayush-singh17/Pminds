import type { Note, Connection } from '../types';

export interface Cluster {
  id: string;
  noteIds: string[];
  color: string;
  label: string;
}

const CLUSTER_COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899'];

export const detectClusters = (notes: Note[], connections: Connection[]): Cluster[] => {
  const parent: Record<string, string> = {};

  const find = (id: string): string => {
    if (parent[id] !== id) parent[id] = find(parent[id]);
    return parent[id];
  };

  const union = (a: string, b: string) => { parent[find(a)] = find(b); };

  notes.forEach(n => parent[n.id] = n.id);
  connections.forEach(conn => {
    if (find(conn.note_from) !== find(conn.note_to)) union(conn.note_from, conn.note_to);
  });

  const clusters: Record<string, string[]> = {};
  notes.forEach(n => {
    const root = find(n.id);
    if (!clusters[root]) clusters[root] = [];
    clusters[root].push(n.id);
  });

  return Object.entries(clusters)
    .filter(([_, ids]) => ids.length > 0)
    .map(([root, noteIds], i) => ({
      id: root,
      noteIds,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      label: '',
    }));
};
