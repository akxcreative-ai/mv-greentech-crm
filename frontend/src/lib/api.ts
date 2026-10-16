import axios from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Lead,
  LeadActivity,
  Customer,
  Contact,
  Item,
  Quotation,
  Order,
  FollowUp,
  CustomerVisit,
  SalesTarget,
  Notification,
  Setting,
  DashboardStats,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: User }>> => {
    const res = await api.post('/v1/auth/login', credentials);
    return res.data;
  },
  me: async (): Promise<ApiResponse<User>> => {
    const res = await api.get('/v1/auth/me');
    return res.data;
  },
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const res = await api.put('/v1/auth/profile', data);
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
    const res = await api.put('/v1/auth/password', data);
    return res.data;
  },
};

export const leadsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Lead>> => {
    const res = await api.get('/v1/leads', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<Lead>> => {
    const res = await api.get(`/v1/leads/${id}`);
    return res.data;
  },
  create: async (data: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    const res = await api.post('/v1/leads', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    const res = await api.put(`/v1/leads/${id}`, data);
    return res.data;
  },
  archive: async (id: string): Promise<ApiResponse<Lead>> => {
    const res = await api.put(`/v1/leads/${id}/archive`);
    return res.data;
  },
  assign: async (id: string, data: { userId: string; notes?: string }): Promise<ApiResponse<Lead>> => {
    const res = await api.put(`/v1/leads/${id}/assign`, data);
    return res.data;
  },
  getActivities: async (id: string): Promise<ApiResponse<LeadActivity[]>> => {
    const res = await api.get(`/v1/leads/${id}/activities`);
    return res.data;
  },
  addActivity: async (id: string, data: { type: string; description: string; metadata?: Record<string, unknown> }): Promise<ApiResponse<LeadActivity>> => {
    const res = await api.post(`/v1/leads/${id}/activities`, data);
    return res.data;
  },
  exportCsv: async (params?: Record<string, unknown>): Promise<Blob> => {
    const res = await api.get('/v1/leads/export/csv', { params, responseType: 'blob' });
    return res.data;
  },
  convertToCustomer: async (id: string, data?: { status?: string }): Promise<ApiResponse<{ customer: Customer; lead: Lead }>> => {
    const res = await api.post(`/v1/leads/${id}/convert-to-customer`, data);
    return res.data;
  },
};

export const customersApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Customer>> => {
    const res = await api.get('/v1/customers', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<Customer>> => {
    const res = await api.get(`/v1/customers/${id}`);
    return res.data;
  },
  create: async (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.post('/v1/customers', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const res = await api.put(`/v1/customers/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/v1/customers/${id}`);
    return res.data;
  },
  addContact: async (customerId: string, data: Partial<Contact>): Promise<ApiResponse<Contact>> => {
    const res = await api.post(`/v1/customers/${customerId}/contacts`, data);
    return res.data;
  },
  updateContact: async (customerId: string, contactId: string, data: Partial<Contact>): Promise<ApiResponse<Contact>> => {
    const res = await api.put(`/v1/customers/${customerId}/contacts/${contactId}`, data);
    return res.data;
  },
  deleteContact: async (customerId: string, contactId: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/v1/customers/${customerId}/contacts/${contactId}`);
    return res.data;
  },
};

export const itemsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Item>> => {
    const res = await api.get('/v1/items', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<Item>> => {
    const res = await api.get(`/v1/items/${id}`);
    return res.data;
  },
  create: async (data: Partial<Item>): Promise<ApiResponse<Item>> => {
    const res = await api.post('/v1/items', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Item>): Promise<ApiResponse<Item>> => {
    const res = await api.put(`/v1/items/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/v1/items/${id}`);
    return res.data;
  },
  importItems: async (items: any[]): Promise<ApiResponse<{ total: number; imported: number; skipped: number; errors: string[] }>> => {
    const res = await api.post('/v1/items/import', { items });
    return res.data;
  },
  importCsv: async (file: File): Promise<ApiResponse<any>> => {
    // Read text from file and parse as CSV, then send to /v1/items/import
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    
    // Header index finder
    const getIndex = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));
    const codeIdx = getIndex(['item code', 'itemcode', 'code', 'part']);
    const descIdx = getIndex(['description', 'desc', 'name']);
    const unitIdx = getIndex(['unit', 'uom']);
    const costIdx = getIndex(['cost', 'standard cost']);
    const priceIdx = getIndex(['price', 'standard price', 'rate']);
    const stockIdx = getIndex(['stock', 'quantity', 'qty']);
    const leadIdx = getIndex(['lead time', 'lead']);
    const supIdx = getIndex(['supplier', 'vendor']);

    const items = lines.slice(1).map((line) => {
      // Basic CSV field parser handling quotes
      const values: string[] = [];
      let inQuote = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
          values.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += c;
        }
      }
      values.push(cur.trim().replace(/^"|"$/g, ''));

      return {
        itemCode: codeIdx >= 0 ? values[codeIdx] : values[0],
        description: descIdx >= 0 ? values[descIdx] : values[1],
        unit: unitIdx >= 0 ? values[unitIdx] : 'PCS',
        standardCost: costIdx >= 0 ? parseFloat(values[costIdx]) || 0 : 0,
        standardPrice: priceIdx >= 0 ? parseFloat(values[priceIdx]) || 0 : 0,
        currentStock: stockIdx >= 0 ? parseInt(values[stockIdx], 10) || 0 : 0,
        leadTimeDays: leadIdx >= 0 ? parseInt(values[leadIdx], 10) || 7 : 7,
        supplierCode: supIdx >= 0 ? values[supIdx] : '',
        currency: 'INR',
        status: 'ACTIVE',
      };
    });

    const res = await api.post('/v1/items/import', { items });
    return res.data;
  },
};

export const quotationsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Quotation>> => {
    const res = await api.get('/v1/quotations', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<Quotation>> => {
    const res = await api.get(`/v1/quotations/${id}`);
    return res.data;
  },
  create: async (data: Partial<Quotation>): Promise<ApiResponse<Quotation>> => {
    const res = await api.post('/v1/quotations', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Quotation>): Promise<ApiResponse<Quotation>> => {
    const res = await api.put(`/v1/quotations/${id}`, data);
    return res.data;
  },
  updateStatus: async (id: string, status: string, lostReason?: string): Promise<ApiResponse<Quotation>> => {
    const res = await api.put(`/v1/quotations/${id}/status`, { status, lostReason });
    return res.data;
  },
  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await api.get(`/v1/quotations/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  },
  convertToOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const res = await api.post(`/v1/quotations/${id}/convert-order`);
    return res.data;
  },
};

export const ordersApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Order>> => {
    const res = await api.get('/v1/orders', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<Order>> => {
    const res = await api.get(`/v1/orders/${id}`);
    return res.data;
  },
  create: async (data: Partial<Order>): Promise<ApiResponse<Order>> => {
    const res = await api.post('/v1/orders', data);
    return res.data;
  },
  updateStatus: async (id: string, status: string): Promise<ApiResponse<Order>> => {
    const res = await api.put(`/v1/orders/${id}/status`, { status });
    return res.data;
  },
};

export const followUpsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<FollowUp>> => {
    const res = await api.get('/v1/follow-ups', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<FollowUp>> => {
    const res = await api.get(`/v1/follow-ups/${id}`);
    return res.data;
  },
  create: async (data: Partial<FollowUp>): Promise<ApiResponse<FollowUp>> => {
    const res = await api.post('/v1/follow-ups', data);
    return res.data;
  },
  update: async (id: string, data: Partial<FollowUp>): Promise<ApiResponse<FollowUp>> => {
    const res = await api.put(`/v1/follow-ups/${id}`, data);
    return res.data;
  },
  markComplete: async (id: string, notes?: string, nextAction?: string): Promise<ApiResponse<FollowUp>> => {
    const res = await api.put(`/v1/follow-ups/${id}/complete`, { notes, nextAction });
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/v1/follow-ups/${id}`);
    return res.data;
  },
};

export const visitsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<CustomerVisit>> => {
    const res = await api.get('/v1/visits', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<CustomerVisit>> => {
    const res = await api.get(`/v1/visits/${id}`);
    return res.data;
  },
  create: async (data: Partial<CustomerVisit>): Promise<ApiResponse<CustomerVisit>> => {
    const res = await api.post('/v1/visits', data);
    return res.data;
  },
  update: async (id: string, data: Partial<CustomerVisit>): Promise<ApiResponse<CustomerVisit>> => {
    const res = await api.put(`/v1/visits/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete(`/v1/visits/${id}`);
    return res.data;
  },
};

export const targetsApi = {
  list: async (params?: Record<string, unknown>): Promise<ApiResponse<SalesTarget[]>> => {
    const res = await api.get('/v1/targets', { params });
    return res.data;
  },
  getByUser: async (userId: string, year: number): Promise<ApiResponse<SalesTarget[]>> => {
    const res = await api.get(`/v1/targets/user/${userId}`, { params: { year } });
    return res.data;
  },
  setTarget: async (data: { userId: string; month: number; year: number; targetAmount: number; currency?: string }): Promise<ApiResponse<SalesTarget>> => {
    const res = await api.post('/v1/targets', data);
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async (params?: Record<string, unknown>): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get('/v1/dashboard/stats', { params });
    return res.data;
  },
};

export const usersApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<User>> => {
    const res = await api.get('/v1/users', { params });
    return res.data;
  },
  get: async (id: string): Promise<ApiResponse<User>> => {
    const res = await api.get(`/v1/users/${id}`);
    return res.data;
  },
  create: async (data: Partial<User> & { password?: string }): Promise<ApiResponse<User>> => {
    const res = await api.post('/v1/users', data);
    return res.data;
  },
  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const res = await api.put(`/v1/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<User>> => {
    const res = await api.put(`/v1/users/${id}/toggle-status`);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.delete(`/v1/users/${id}`);
    return res.data;
  },
};

export const notificationsApi = {
  list: async (): Promise<ApiResponse<Notification[]>> => {
    const res = await api.get('/v1/notifications');
    return res.data;
  },
  markRead: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.put(`/v1/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (): Promise<ApiResponse<void>> => {
    const res = await api.put('/v1/notifications/mark-all-read');
    return res.data;
  },
};

export const settingsApi = {
  getAll: async (): Promise<ApiResponse<Setting[]>> => {
    const res = await api.get('/v1/settings');
    return res.data;
  },
  getByKey: async (key: string): Promise<ApiResponse<Setting>> => {
    const res = await api.get(`/v1/settings/${key}`);
    return res.data;
  },
  update: async (key: string, value: Record<string, unknown> | string | number | boolean): Promise<ApiResponse<Setting>> => {
    const res = await api.put(`/v1/settings/${key}`, { value });
    return res.data;
  },
};

export const locationsApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const res = await api.get('/v1/locations/all');
    return res.data;
  },
  getCountries: async (): Promise<ApiResponse<Array<{ code: string; name: string; phoneCode: string; currency: string }>>> => {
    const res = await api.get('/v1/locations/countries');
    return res.data;
  },
  getStates: async (countryCode: string): Promise<ApiResponse<Array<{ code: string; name: string; cityCount: number }>>> => {
    const res = await api.get('/v1/locations/states', { params: { countryCode } });
    return res.data;
  },
  getCities: async (countryCode: string, stateCode: string): Promise<ApiResponse<string[]>> => {
    const res = await api.get('/v1/locations/cities', { params: { countryCode, stateCode } });
    return res.data;
  },
};

export const otpApi = {
  getPolicy: async (): Promise<ApiResponse<any>> => {
    const res = await api.get('/v1/auth/policy');
    return res.data;
  },
  sendOtp: async (data: { identifier: string; purpose?: string; channel?: 'EMAIL' | 'SMS' }): Promise<ApiResponse<any>> => {
    const res = await api.post('/v1/auth/send-otp', data);
    return res.data;
  },
  verifyOtpLogin: async (data: { identifier: string; otp: string }): Promise<ApiResponse<{ token: string; user: User }>> => {
    const res = await api.post('/v1/auth/verify-otp-login', data);
    return res.data;
  },
  resetPassword: async (data: { identifier: string; otp: string; newPassword: string }): Promise<ApiResponse<any>> => {
    const res = await api.post('/v1/auth/reset-password-otp', data);
    return res.data;
  },
};

export const auditLogsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/v1/audit-logs', { params });
    return res.data;
  },
};
