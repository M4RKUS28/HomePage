/**
 * CV API client.
 *
 * The CV data is stored as a JSONB blob in the database.
 * Image uploads (profile pic inside CV) use presigned MinIO URLs.
 */
import apiClient from './index';

export const getCVDataApi = async () => {
    const response = await apiClient.get('/cv/');
    return response.data;
};

export const updateCVDataApi = async (cvData) => {
    const response = await apiClient.put('/cv/', cvData);
    return response.data;
};

// ---------------------------------------------------------------------------
// Presigned image upload (replaces old base64 upload)
// ---------------------------------------------------------------------------

/**
 * Upload a CV-related image via presigned URL.
 *
 * @param {File}        file      – browser File object
 * @param {string}      filename  – desired filename (e.g. "profile.webp")
 * @param {number|null} projectId – optional project reference
 * @returns {{ object_name: string }}
 */
export const uploadCVImageApi = async (file, filename, projectId = null) => {
    // Step 1: Get presigned PUT URL
    const payload = {
        filename: filename || file.name,
        content_type: file.type,
        category: 'cv',
    };
    if (projectId !== null) {
        payload.resource_id = projectId;
    }

    const { data: presigned } = await apiClient.post('/storage/upload-url', payload);

    // Step 2: PUT file directly to MinIO
    await fetch(presigned.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
    });

    return { object_name: presigned.object_name };
};