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
    // Check if token exists in localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error('Authentication token missing. Please log in again.');
        throw new Error('Authentication token missing');
    }
    
    const payload = {
        image_data: imageData,
        image_type: imageType
    };
    
    if (projectId !== null) {
        payload.project_id = projectId;
    }
    
    console.log('Sending upload request with token:', token.substring(0, 10) + '...');
    
    try {
        const response = await apiClient.post('/cv/upload-image', payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Image upload failed:', error.response?.status, error.response?.data);
        throw error;
    }
};