/**
 * Storage API client — presigned MinIO upload & download URLs.
 *
 * Upload flow:
 *   1. POST /storage/upload-url → { upload_url, object_name }
 *   2. PUT file directly to upload_url (browser → MinIO)
 *
 * Download flow:
 *   GET /storage/download-url/<object_name> → { download_url }
 */
import apiClient from './client';

/**
 * Request a presigned PUT URL for uploading a file to MinIO.
 *
 * @param {Object}      opts
 * @param {string}      opts.filename     - Original filename
 * @param {string}      opts.contentType  - MIME type (e.g. "image/png")
 * @param {string}      opts.category     - "projects" | "cv" | "avatars"
 * @param {number|null} [opts.resourceId] - Optional resource ID
 * @returns {Promise<{ upload_url: string, object_name: string, expires_in: number }>}
 */
export const getPresignedUploadUrl = async ({ filename, contentType, category, resourceId = null }) => {
  const payload = { filename, content_type: contentType, category };
  if (resourceId != null) payload.resource_id = resourceId;

  const { data } = await apiClient.post('/storage/upload-url', payload);
  return data;
};

/**
 * Upload a file directly to MinIO using a presigned PUT URL.
 *
 * @param {string} uploadUrl   - Presigned PUT URL from getPresignedUploadUrl
 * @param {File}   file        - Browser File object
 */
export const uploadFileToPresignedUrl = async (uploadUrl, file) => {
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
};

/**
 * Get a presigned download URL for an object stored in MinIO.
 *
 * @param {string} objectName - MinIO object key (e.g. "projects/1/cover.png")
 * @returns {Promise<string>} Presigned GET URL
 */
export const getPresignedDownloadUrl = async (objectName) => {
  const encoded = encodeURIComponent(objectName);
  const { data } = await apiClient.get(`/storage/download-url/${encoded}`);
  return data.download_url;
};

/**
 * Full upload helper: get presigned URL → upload file → return object_name.
 *
 * @param {File}        file       - Browser File object
 * @param {string}      category   - "projects" | "cv" | "avatars"
 * @param {number|null} resourceId - Optional resource ID
 * @returns {Promise<{ object_name: string }>}
 */
export const uploadFileViaPresigned = async (file, category, resourceId = null) => {
  const presigned = await getPresignedUploadUrl({
    filename: file.name,
    contentType: file.type,
    category,
    resourceId,
  });

  await uploadFileToPresignedUrl(presigned.upload_url, file);
  return { object_name: presigned.object_name };
};
