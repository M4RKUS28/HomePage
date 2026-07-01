/**
 * CV API client.
 *
 * CV data is stored as a JSONB blob in the database.
 * Image uploads (profile pic inside CV) use presigned MinIO URLs.
 */
import apiClient from './client';
import { uploadFileViaPresigned } from './storage';

export const getCVDataApi = async (language) => {
  const params = language ? { language } : {};
  const { data } = await apiClient.get('/cv/', { params });
  return data;
};

export const updateCVDataApi = async (cvData, language) => {
  const params = language ? { language } : {};
  const { data } = await apiClient.put('/cv/', cvData, { params });
  return data;
};

/**
 * AI-assisted CV import: upload a CV/resume file (PDF, image or text) and
 * have the configured Gemini model extract it into the CV JSON structure.
 *
 * The result is returned for review (not saved automatically) - call
 * `updateCVDataApi` afterwards to persist it.
 *
 * @param {File}   file     - Browser File object (PDF/PNG/JPEG/WEBP/TXT)
 * @param {string} mode     - 'replace' (fresh data) or 'merge' (extend existing data)
 * @param {string} language - CV language to merge into / save as
 * @returns {Promise<object>} Generated CV data
 */
export const importCVApi = async (file, mode, language) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const params = language ? { language } : {};
  const { data } = await apiClient.post('/cv/import', formData, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data;
};

/**
 * Upload a CV-related image via presigned URL.
 *
 * @param {File}        file       - Browser File object
 * @param {string}      [filename] - Desired filename (e.g. "profile.webp")
 * @param {number|null} [projectId] - Optional project reference
 * @returns {Promise<{ object_name: string }>}
 */
export const uploadCVImageApi = async (file, filename, projectId = null) => {
  // Rename the file if a custom filename was provided
  const renamedFile = filename
    ? new File([file], filename, { type: file.type })
    : file;
  return uploadFileViaPresigned(renamedFile, 'cv', projectId);
};

/** Alias for backwards compatibility */
export const uploadImageApi = uploadCVImageApi;
