/**
 * Messages API client.
 */
import apiClient from './client';

export const getMessagesApi = async () => {
  const { data } = await apiClient.get('/messages/');
  return data;
};

export const createMessageApi = async (content) => {
  const { data } = await apiClient.post('/messages/', { content });
  return data;
};

export const markMessageAsReadApi = async (messageId) => {
  const { data } = await apiClient.put(`/messages/${messageId}/read`);
  return data;
};

export const deleteMessageApi = async (messageId) => {
  await apiClient.delete(`/messages/${messageId}`);
  return { success: true, messageId };
};
