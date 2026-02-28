/**
 * Project API client.
 *
 * Image uploads use presigned MinIO URLs via the storage module.
 */
import apiClient from "./client";
import { uploadFileViaPresigned, getPresignedDownloadUrl } from "./storage";

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export const getProjectsApi = async (language) => {
  const params = language ? { language } : {};
  const { data } = await apiClient.get("/projects/", { params });
  return data;
};

export const getProjectApi = async (projectId) => {
  const { data } = await apiClient.get(`/projects/${projectId}`);
  return data;
};

export const createProjectApi = async (projectData) => {
  const payload = {
    title: projectData.title,
    description: projectData.description,
    link: projectData.link,
    health_check_urls: projectData.health_check_urls || [],
    language: projectData.language || "en",
  };

  if (projectData.position != null && projectData.position !== "") {
    payload.position = parseInt(projectData.position, 10);
  }

  const { data } = await apiClient.post("/projects/", payload);
  return data;
};

export const updateProjectApi = async (projectId, projectData) => {
  const payload = {
    title: projectData.title,
    description: projectData.description,
    link: projectData.link,
    position: projectData.position,
    health_check_urls: projectData.health_check_urls ?? [],
    image_object_name: projectData.image_object_name,
  };

  // Remove undefined values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  const { data } = await apiClient.put(`/projects/${projectId}`, payload);
  return data;
};

export const deleteProjectApi = async (projectId) => {
  await apiClient.delete(`/projects/${projectId}`);
  return { success: true, projectId };
};

export const checkProjectStatusApi = async (projectId) => {
  const { data } = await apiClient.post(`/projects/${projectId}/check-status`);
  return data;
};

// ---------------------------------------------------------------------------
// Image handling (presigned URLs)
// ---------------------------------------------------------------------------

/**
 * Upload a project cover image via presigned URL.
 *
 * @param {number} projectId - Existing project ID
 * @param {File}   file      - Browser File object
 * @returns {Promise<{ object_name: string }>}
 */
export const uploadProjectImageApi = async (projectId, file) => {
  return uploadFileViaPresigned(file, "projects", projectId);
};

/**
 * Get a presigned download URL for an object stored in MinIO.
 *
 * @param {string} objectName - MinIO object key (e.g. "projects/1/cover.png")
 * @returns {Promise<string>} Presigned download URL
 */
export const getProjectImageUrl = async (objectName) => {
  return getPresignedDownloadUrl(objectName);
};
