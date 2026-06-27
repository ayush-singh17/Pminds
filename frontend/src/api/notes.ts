import api from './axios';
import type { Note } from '../types';

export const getNotes = async (params?: {
  search?: string;
  type?: string;
  folder?: string;
  unfiled?: boolean;
}): Promise<Note[]> => {
  const response = await api.get('/notes/', { params });
  return response.data;
};

export const getNote = async (id: string): Promise<Note> => {
  const response = await api.get(`/notes/${id}/`);
  return response.data;
};

export const createNote = async (data: {
  title: string;
  content: string;
  type: string;
  source_url?: string;
  tag_ids?: string[];
  folder_ids?: string[];
}): Promise<Note> => {
  const response = await api.post('/notes/', data);
  return response.data;
};

export const updateNote = async (id: string, data: Partial<{
  title: string;
  content: string;
  type: string;
  source_url: string;
  tag_ids: string[];
  folder_ids: string[];
}>): Promise<Note> => {
  const response = await api.patch(`/notes/${id}/`, data);
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/notes/${id}/`);
};

export const suggestConnections = async (noteId: string) => {
  const response = await api.post(`/notes/${noteId}/suggest-connections/`);
  return response.data;
};
