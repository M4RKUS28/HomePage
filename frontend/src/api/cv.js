// frontend/src/api/cv.js
import apiClient from './index';

export const getCVDataApi = async () => {
    const response = await apiClient.get('/cv/');
    return response.data;
};

export const updateCVDataApi = async (cvData) => {
    const response = await apiClient.put('/cv/', cvData);
    return response.data;
};
