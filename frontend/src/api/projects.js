import apiClient from './index';

export const getProjectsApi = async () => {
    const response = await apiClient.get('/projects/');
    return response.data;
};
export const createProjectApi = async (projectData) => {
    const response = await apiClient.post('/projects/', projectData);
    return response.data;
};
export const updateProjectApi = async (projectId, projectData) => {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data;
};
export const deleteProjectApi = async (projectId) => {
    // For 204 No Content, response.data might be empty
    await apiClient.delete(`/projects/${projectId}`);
    return { success: true, projectId };
};
export const checkProjectStatusApi = async (projectId) => {
    const response = await apiClient.post(`/projects/${projectId}/check-status`);
    return response.data;
};