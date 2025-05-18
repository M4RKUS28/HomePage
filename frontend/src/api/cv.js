// frontend/src/api/cv.js (updated)
import apiClient from './index';

export const getCVDataApi = async () => {
    const response = await apiClient.get('/cv/');
    return response.data;
};

export const updateCVDataApi = async (cvData) => {
    const response = await apiClient.put('/cv/', cvData);
    return response.data;
};

export const getSiteConfigApi = async () => {
    const response = await apiClient.get('/cv/site-config');
    return response.data;
};

export const updateSiteConfigApi = async (configData) => {
    const response = await apiClient.put('/cv/site-config', configData);
    return response.data;
};

export const uploadImageApi = async (imageData, imageType, projectId = null) => {
    const payload = {
        image_data: imageData,
        image_type: imageType
    };
    
    if (projectId !== null) {
        payload.project_id = projectId;
    }
    
    const response = await apiClient.post('/cv/upload-image', payload);
    return response.data;
};