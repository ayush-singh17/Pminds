import api from './axios';
import type { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const register = async (data: {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const login = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/login/', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout/');
};

export const getMe = async (): Promise<User> => {
  const response = await api.get('/auth/me/');
  return response.data;
};
