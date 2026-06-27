import api from './axios';
import type { Connection } from '../types';

export const getConnections = async (folder?: string): Promise<Connection[]> => {
  const response = await api.get('/connections/', { params: folder ? { folder } : {} });
  return response.data;
};

export const getConnectionsByNote = async (noteId: string): Promise<Connection[]> => {
  const response = await api.get(`/connections/by-note/${noteId}/`);
  return response.data;
};

export const createConnection = async (data: {
  note_from: string;
  note_to: string;
  reason?: string;
  strength?: number;
  ai_generated?: boolean;
}): Promise<Connection> => {
  const response = await api.post('/connections/', data);
  return response.data;
};

export const deleteConnection = async (id: string): Promise<void> => {
  await api.delete(`/connections/${id}/`);
};
