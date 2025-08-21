import apiClient from './index';

export const loginUserApi = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await apiClient.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
};

export const registerUserApi = async (username, email, password) => {
    const response = await apiClient.post('/register', { username, email, password });
    return response.data;
};

export const fetchCurrentUserApi = async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
};
