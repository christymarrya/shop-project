const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get headers with JWT token
const getHeaders = (isJson = true) => {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cybersec_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Generic fetch wrapper
const request = async (path: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(!options.body || typeof options.body === 'string'),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Auth
  auth: {
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cybersec_token');
        localStorage.removeItem('cybersec_user');
      }
      return Promise.resolve();
    },
    getCurrentUser: () => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('cybersec_user');
        return userStr ? JSON.parse(userStr) : null;
      }
      return null;
    }
  },

  // Products
  products: {
    list: (search?: string, category?: string, filters: any = {}) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.featured) params.append('featured', 'true');
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/products${query}`);
    },
    get: (id: number) => request(`/products/${id}`),
    create: (body: FormData) => request('/products', { method: 'POST', body }),
    update: (id: number, body: FormData) => request(`/products/${id}`, { method: 'PUT', body }),
    delete: (id: number) => request(`/products/${id}`, { method: 'DELETE' })
  },

  // Cart
  cart: {
    get: () => request('/cart'),
    add: (productId: number, quantity: number) => request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
    update: (id: number, quantity: number) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    delete: (id: number) => request(`/cart/${id}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' })
  },

  // Wishlist
  wishlist: {
    get: () => request('/wishlist'),
    add: (productId: number) => request('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
    delete: (productId: number) => request(`/wishlist/${productId}`, { method: 'DELETE' })
  },

  // Orders
  orders: {
    checkout: () => request('/orders/checkout', { method: 'POST' }),
    history: () => request('/orders/history'),
    adminAll: (search?: string, status?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/orders/admin/all${query}`);
    },
    adminUpdateStatus: (orderGroupId: string, status: string, paymentStatus?: string) => 
      request(`/orders/admin/status/${orderGroupId}`, { 
        method: 'PUT', 
        body: JSON.stringify({ status, paymentStatus }) 
      }),
    cancel: (orderGroupId: string) => request(`/orders/cancel/${orderGroupId}`, { method: 'POST' })
  },

  // Admin User Management & Stats
  admin: {
    usersList: () => request('/admin/users'),
    addUser: (body: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    stats: () => request('/admin/stats')
  }
};
