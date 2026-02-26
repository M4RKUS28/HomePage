/**
 * Project API client.
 *
 * Image uploads now use presigned MinIO URLs:
 *  1. POST /storage/upload-url → get presigned PUT URL + object_name
 *  2. PUT to presigned URL directly (browser → MinIO)
 *  3. Attach object_name to project via update
 */
import apiClient from './index';

export const getProjectsApi = async () => {
    const response = await apiClient.get('/projects/');
    return response.data;
};

export const getProjectApi = async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
};

export const createProjectApi = async (projectData) => {
    const essentialData = {
        title: projectData.title,
        description: projectData.description,
        link: projectData.link,
        health_check_urls: projectData.health_check_urls || [],
    };

    if (projectData.position !== '' && projectData.position !== undefined && projectData.position !== null) {
        essentialData.position = parseInt(projectData.position);
    }

    const response = await apiClient.post('/projects/', essentialData);
    return response.data;
};

export const updateProjectApi = async (projectId, projectData) => {
    const essentialData = {
        title: projectData.title,
        description: projectData.description,
        link: projectData.link,
        position: projectData.position,
        health_check_urls: projectData.health_check_urls !== undefined
            ? projectData.health_check_urls
            : [],
    };

    Object.keys(essentialData).forEach(key =>
        essentialData[key] === undefined && delete essentialData[key]
    );

    const response = await apiClient.put(`/projects/${projectId}`, essentialData);
    return response.data;
};

export const deleteProjectApi = async (projectId) => {
    await apiClient.delete(`/projects/${projectId}`);
    return { success: true, projectId };
};

export const checkProjectStatusApi = async (projectId) => {
    const response = await apiClient.post(`/projects/${projectId}/check-status`);
    return response.data;
};

// ---------------------------------------------------------------------------
// Presigned image upload (replaces old base64 upload)
// ---------------------------------------------------------------------------

/**
 * Upload a project cover image via presigned URL.
 *
 * @param {number} projectId - existing project ID
 * @param {File}   file      - browser File object
 * @returns {{ object_name: string }} - the MinIO object key stored in DB
 */
/**
 * Get presigned download URL for a project's cover image.
 * @param {string} objectName - the MinIO object_name stored in the project
 * @returns {string} presigned URL
 */
export const getProjectImageApi = async (objectName) => {
    const { data } = await apiClient.get(`/storage/download-url`, {
        params: { object_name: objectName },
    });
    return data.download_url;
};

export const uploadProjectImageApi = async (projectId, file) => {
    // Step 1: Request a presigned PUT URL
    const { data: presigned } = await apiClient.post('/storage/upload-url', {
        filename: file.name,
        content_type: file.type,
        category: 'projects',
        resource_id: projectId,
    });

    // Step 2: PUT the file directly to MinIO
    await fetch(presigned.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
    });

    return { object_name: presigned.object_name };
};
