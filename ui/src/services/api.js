import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  register: (userData) => api.post('/register', userData),
  getCurrentUser: () => api.get('/users/me'),
};

// User API
export const userAPI = {
  updateTheme: (theme) => api.post('/users/theme', { theme }),
  getSettings: () => api.get('/users/settings'),
  updateSettings: (settings) => api.put('/users/settings', settings),
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chats'),
  getRecentChats: () => api.get('/chats/recent'),
  createChat: (data) => {
    // Handle both string and object formats
    if (typeof data === 'string') {
      return api.post('/chats', { message: data });
    }
    return api.post('/chats', data);
  },
  getChat: (id) => api.get(`/chats/${id}`),
};

// Document API
export const documentAPI = {
  getDocuments: () => api.get('/documents'),
  uploadDocument: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  getDocument: (id) => api.get(`/documents/${id}`),
  getDocumentStatus: (id) => api.get(`/documents/${id}/status`),
};

// Knowledge Graph API
export const knowledgeGraphAPI = {
  getGraph: () => api.get('/knowledge-graph'),
  queryGraph: (query) => api.post('/knowledge-graph/query', { query }),
};

export default api;
