/**
 * User API client.
 *
 * Avatar uploads go through the backend multipart endpoint
 * (server-side upload to MinIO, max 5 MB).
 */
import apiClient from './client';

export const getUsersApi = async () => {
  const { data } = await apiClient.get('/users/');
  return data;
};

export const getUserApi = async (userId) => {
  const { data } = await apiClient.get(`/users/${userId}`);
  return data;
};

export const updateUserApi = async (userId, userData) => {
  const { data } = await apiClient.put(`/users/${userId}`, userData);
  return data;
};

export const deleteUserApi = async (userId) => {
  await apiClient.delete(`/users/${userId}`);
  return { success: true, userId };
};

/** Upload avatar for the current user. `file` is a File object. */
export const uploadAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/** Permanently delete the currently authenticated (non-admin) user's account. */
export const deleteSelfApi = async () => {
  await apiClient.delete('/users/me/account');
  return { success: true };
};

/**
 * Return the API-proxied avatar URL for a user.
 * The backend will 307-redirect to a presigned MinIO URL.
 */
export const getAvatarUrl = (userId) => `/api/users/${userId}/avatar`;
