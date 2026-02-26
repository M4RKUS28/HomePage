/**
 * User API client.
 *
 * Avatar uploads go through the backend multipart endpoint (server-side upload
 * to MinIO ≤ 5 MB) – no presigned URL needed for small files.
 */
import apiClient from './index';

export const getUsersApi = async () => {
    const response = await apiClient.get('/users/');
    return response.data;
};

export const getUserApi = async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
};

export const updateUserApi = async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
};

export const deleteUserApi = async (userId) => {
    await apiClient.delete(`/users/${userId}`);
    return { success: true, userId };
};

/** Upload avatar for the current user. `file` is a File object. */
export const uploadAvatarApi = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
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