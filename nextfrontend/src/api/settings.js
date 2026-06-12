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

export const getPublicSettingsApi = async () => {
  const { data } = await apiClient.get('/settings/public');
  return data; // { accent_color, default_accent_color }
};

/** Pass null to reset to the default color. */
export const updateAccentColorApi = async (color) => {
  const { data } = await apiClient.put('/settings/accent-color', { color });
  return data; // { accent_color, default_accent_color }
};

/** Bust the SSR cache so the new color is live immediately. */
export const revalidateThemeApi = async () => {
  await apiClient.post('/revalidate-theme');
};
