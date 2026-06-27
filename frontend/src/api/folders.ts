import api from './axios';
import type { Folder } from '../types';

export const getFolders = async (): Promise<Folder[]> => {
  const response = await api.get('/folders/');
  return response.data;
};

export const createFolder = async (data: {
  name: string;
  icon: string;
  color: string;
}): Promise<Folder> => {
  const response = await api.post('/folders/', data);
  return response.data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await api.delete(`/folders/${id}/`);
};
