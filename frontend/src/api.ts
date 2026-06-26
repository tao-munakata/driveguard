import axios from 'axios';
import type { User, Vehicle, AlcoholCheck, DrivingReport, DashboardStats } from './types';

const api = axios.create({
  baseURL: (import.meta as { env: Record<string, string> }).env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post<{ token: string; user: User }>('/auth/login', { email, password });

export const getMe = () => api.get<User>('/auth/me');

// Vehicles
export const getVehicles = () => api.get<Vehicle[]>('/vehicles');

// Alcohol checks
export const getAlcoholChecks = (params?: { driver_id?: string; date?: string }) =>
  api.get<AlcoholCheck[]>('/alcohol-checks', { params });

export const createAlcoholCheck = (data: {
  report_id?: string | null;
  phase: 'before' | 'after';
  value: number;
}) => api.post<AlcoholCheck>('/alcohol-checks', data);

// Reports
export const getReports = (params?: {
  driver_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}) => api.get<DrivingReport[]>('/reports', { params });

export const createReport = (data: {
  report_date: string;
  vehicle_id: string;
  work_content: string;
}) => api.post<DrivingReport>('/reports', data);

export const getReport = (id: string) => api.get<DrivingReport>(`/reports/${id}`);

export const updateReport = (id: string, data: Partial<DrivingReport>) =>
  api.put<DrivingReport>(`/reports/${id}`, data);

export const createTrip = (
  reportId: string,
  data: {
    depart_at: string;
    arrive_at: string;
    distance_km: number;
    refueled: boolean;
    fuel_amount?: number | null;
    fuel_cost?: number | null;
    fuel_place?: string | null;
  }
) => api.post(`/reports/${reportId}/trips`, data);

// Admin
export const getDashboard = () => api.get<DashboardStats>('/admin/dashboard');

export const approveReport = (id: string) =>
  api.put(`/admin/reports/${id}/approve`);

export const rejectReport = (id: string, note?: string) =>
  api.put(`/admin/reports/${id}/reject`, { note });

export default api;
