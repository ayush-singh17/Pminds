import type { Connection } from '../types';

export const findPath = (fromId: string, toId: string, connections: Connection[]): string[] => {
  const adj: Record<string, string[]> = {};
  connections.forEach(conn => {
    if (!adj[conn.note_from]) adj[conn.note_from] = [];
    if (!adj[conn.note_to]) adj[conn.note_to] = [];
    adj[conn.note_from].push(conn.note_to);
    adj[conn.note_to].push(conn.note_from);
  });

  const queue = [[fromId]];
  const visited = new Set([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (node === toId) return path;
    for (const neighbor of adj[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [];
};
