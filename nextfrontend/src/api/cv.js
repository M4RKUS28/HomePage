/**
 * CV API client.
 *
 * CV data is stored as a JSONB blob in the database.
 * Image uploads (profile pic inside CV) use presigned MinIO URLs.
 */
import apiClient from './client';
import { uploadFileViaPresigned } from './storage';

export const getCVDataApi = async () => {
  const { data } = await apiClient.get('/cv/');
  return data;
};

export const updateCVDataApi = async (cvData) => {
  const { data } = await apiClient.put('/cv/', cvData);
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
