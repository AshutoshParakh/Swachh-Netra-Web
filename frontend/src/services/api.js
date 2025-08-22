// API service for making HTTP requests
import axios from 'axios';
import { auth } from '../config/firebase';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // PRODUCTION MODE: Add real Firebase token
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔥 PRODUCTION MODE: Added Firebase token to request');
      } else {
        console.log('⚠️ No authenticated user found');
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - sign out from Firebase
      console.log('🔥 PRODUCTION MODE: Token expired, signing out');
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth endpoints
  auth: {
    verify: (token) => api.post('/auth/verify', { token }),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
  },

  // User management endpoints
  users: {
    getAll: (params) => api.get('/users', { params }),
    getApprovalRequests: () => api.get('/users/approval-requests'),
    approveRequest: (id, approved) => api.post(`/users/approve-request/${id}`, { approved }),
    updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    delete: (id) => api.delete(`/users/${id}`),
  },

  // Vehicle management endpoints
  vehicles: {
    getAll: (params) => api.get('/vehicles', { params }),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    updateStatus: (id, status) => api.put(`/vehicles/${id}/status`, { status }),
    getAssignments: (id) => api.get(`/vehicles/${id}/assignments`),
    getStats: () => api.get('/vehicles/stats'),
  },

  // Assignment management endpoints
  assignments: {
    getVehicleAssignments: (params) => api.get('/assignments/vehicles', { params }),
    getFeederPointAssignments: (params) => api.get('/assignments/feeder-points', { params }),
    createVehicleAssignment: (data) => api.post('/assignments/vehicles', data),
    createFeederPointAssignment: (data) => api.post('/assignments/feeder-points', data),
    updateVehicleAssignmentStatus: (id, status) => api.put(`/assignments/vehicles/${id}/status`, { status }),
    updateFeederPointAssignmentStatus: (id, status) => api.put(`/assignments/feeder-points/${id}/status`, { status }),
    getStats: () => api.get('/assignments/stats'),
  },

  // Reports endpoints
  reports: {
    getDashboard: () => api.get('/reports/dashboard'),
    getUsers: (params) => api.get('/reports/users', { params }),
    getVehicles: (params) => api.get('/reports/vehicles', { params }),
    getAssignments: (params) => api.get('/reports/assignments', { params }),
    export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  },

  // Settings endpoints
  settings: {
    getSystem: () => api.get('/settings/system'),
    updateSystem: (data) => api.put('/settings/system', data),
    getNotifications: () => api.get('/settings/notifications'),
    updateNotifications: (data) => api.put('/settings/notifications', data),
    getAuditLogs: (params) => api.get('/settings/audit-logs', { params }),
    createBackup: (data) => api.post('/settings/backup', data),
    getBackups: () => api.get('/settings/backups'),
    getSystemStatus: () => api.get('/settings/system-status'),
    clearCache: () => api.post('/settings/clear-cache'),
  },
};

export default api;
