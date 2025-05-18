// frontend/src/api/users.js
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