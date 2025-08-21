import apiClient from './index';

export const getMessagesApi = async () => {
    const response = await apiClient.get('/messages/');
    return response.data;
};

export const createMessageApi = async (content) => {
    const response = await apiClient.post('/messages/', { content });
    return response.data;
};

export const markMessageAsReadApi = async (messageId) => {
    const response = await apiClient.put(`/messages/${messageId}/read`);
    return response.data;
};

export const deleteMessageApi = async (messageId) => {
    await apiClient.delete(`/messages/${messageId}`);
    return { success: true, messageId };
};