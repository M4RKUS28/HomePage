/**
 * Access-log API client.
 */
import apiClient from './client';

export const getAccessLogsApi = async (hours = null, limit = 500) => {
  const params = { limit };
  if (hours) params.hours = hours;
  const { data } = await apiClient.get('/access/', { params });
  return data;
};

export const getAccessStatsApi = async () => {
  const { data } = await apiClient.get('/access/stats');
  return data;
};
