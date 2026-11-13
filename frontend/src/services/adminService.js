import { api } from './api.js';

export const adminService = {
    getStats: () => api.get(`/admin/stats?_t=${Date.now()}`),
    getUsers: (search = '') => api.get(`/admin/users?_t=${Date.now()}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    getUser: (uid) => api.get(`/admin/users/${uid}?_t=${Date.now()}`),
    updateUser: (uid, data) => api.put(`/admin/users/${uid}`, data),
    updateUserRole: (uid, role) => api.put(`/admin/users/${uid}/role`, { role }),
    banUser: (uid) => api.post(`/admin/users/${uid}/ban`, {}),
    unbanUser: (uid) => api.post(`/admin/users/${uid}/unban`, {}),
    deleteUser: (uid) => api.del(`/admin/users/${uid}`),
    notifyUser: (uid, title, message) => api.post(`/admin/users/${uid}/notify`, { title, message }),
    getDiscussions: () => api.get(`/admin/discussions?_t=${Date.now()}`),
    deleteDiscussion: (id) => api.del(`/admin/discussions/${id}`),
    sendAnnouncement: (title, message) => api.post('/admin/announce', { title, message }),
    getLogs: () => api.get(`/admin/logs?_t=${Date.now()}`),
    deleteLog: (id) => api.del(`/admin/logs/${id}`),
    getUserAnime: (uid) => api.get(`/admin/users/${uid}/anime?_t=${Date.now()}`),
    getReports: () => api.get(`/admin/reports?_t=${Date.now()}`),
    dismissReport: (id) => api.del(`/admin/reports/${id}`)
};