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
    // Only include essential project data, not the image
    // Image upload will be handled separately
    const essentialData = {
        title: projectData.title,
        description: projectData.description,
        link: projectData.link
    };
    
    // Only include position if it's explicitly set (not empty)
    if (projectData.position !== '' && projectData.position !== undefined && projectData.position !== null) {
        essentialData.position = parseInt(projectData.position);
    }
    
    const response = await apiClient.post('/projects/', essentialData);
    return response.data;
};

export const updateProjectApi = async (projectId, projectData) => {
    // Only include essential project data, not the image
    // Image upload will be handled separately
    const essentialData = {
        title: projectData.title,
        description: projectData.description,
        link: projectData.link,
        position: projectData.position
    };
    
    // Filter out any undefined values
    Object.keys(essentialData).forEach(key => 
        essentialData[key] === undefined && delete essentialData[key]
    );
    
    const response = await apiClient.put(`/projects/${projectId}`, essentialData);
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
