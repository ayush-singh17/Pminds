import api from './axios';
import type { Tag } from '../types';

export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags/');
  return response.data;
};

export const createTag = async (data: {
  name: string;
  color: string;
}): Promise<Tag> => {
  const response = await api.post('/tags/', data);
  return response.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/tags/${id}/`);
};
