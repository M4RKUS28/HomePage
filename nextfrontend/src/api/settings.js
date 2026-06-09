/**
 * Admin settings API client.
 */
import apiClient from './client';

export const getTranslationModelApi = async () => {
  const { data } = await apiClient.get('/settings/translation-model');
  return data; // { model, default_model, suggestions }
};

export const updateTranslationModelApi = async (model) => {
  const { data } = await apiClient.put('/settings/translation-model', { model });
  return data;
};
