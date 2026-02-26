// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// class ApiClient {

//   async request(endpoint, options = {}) {

//     const url = `${API_BASE}${endpoint}`;

//     const config = {

//       headers: {

//         'Content-Type': 'application/json',

//         ...options.headers,

//       },

//       ...options,

//     };

//     // Add auth token if available

//     const taUser = localStorage.getItem('current_ta_user');

//     if (taUser) {

//       const { token } = JSON.parse(taUser);

//       config.headers.Authorization = `Bearer ${token}`;

//     }

//     const response = await fetch(url, config);

//     if (!response.ok) {

//       const error = await response.json();

//       throw new Error(error.message || 'API Error');

//     }

//     return response.json();

//   }

//   // TA endpoints

//   async signIn(pin) {

//     return this.request('/api/auth/signin', {

//       method: 'POST',

//       body: JSON.stringify({ ta_code: pin }),

//     });

//   }

//   async clockIn(taId) {

//     return this.request('/api/attendance/clock-in', {

//       method: 'POST',

//       body: JSON.stringify({ ta_id: taId }),

//     });

//   }

//   async getShifts(taId) {

//     return this.request(`/api/shifts?ta_id=${taId}`);

//   }

//   // VP endpoints

//   async getAllTAs() {

//     return this.request('/api/data');

//   }

//   async createTA(data) {

//     return this.request('/api/data', {

//       method: 'POST',

//       body: JSON.stringify(data),

//     });

//   }

// }

// export const api = new ApiClient();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  async request(endpoint, options = {}) {
    // Ensure the URL is constructed correctly
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // 1. Get auth token from 'current_ta_user'
    const taUser = localStorage.getItem('current_ta_user');
    if (taUser) {
      try {
        const { token } = JSON.parse(taUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing stored user for token", e);
      }
    }

    try {
      const response = await fetch(url, config);

      // 2. Handle unauthorized/expired tokens
      if (response.status === 401) {
        localStorage.removeItem('current_ta_user');
        // Optional: window.location.href = '/login';
        throw new Error('Session expired. Please sign in again.');
      }

      // 3. Robust JSON parsing to prevent "Unexpected token" errors
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Error: ${response.status}`);
      }

      // 4. THE CRITICAL FIX: Always return an array for data endpoints if possible
      // This prevents "nt.sort is not a function" crashes
      return data;
    } catch (error) {
      console.error(`API Request Failed (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  async signIn(email, pin) {
    // Note: Added email as your backend auth.js expects { email, ta_code }
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, ta_code: pin }),
    });
  }

  // TA endpoints
  async getAllTAs() {
    // Updated path to match your backend mount: app.use('/api/tas', tasRoutes)
    const data = await this.request('/api/tas');
    return Array.isArray(data) ? data : []; // Force array to prevent .sort() crashes
  }

  async clockIn(taId) {
    return this.request('/api/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ ta_id: taId }),
    });
  }

  async clockOut(taId) {
    return this.request(`/api/attendance/clock-out/${taId}`, {
      method: 'POST'
    });
  }

  async getShifts(taId) {
    return this.request(`/api/shifts?ta_id=${taId}`);
  }

  // VP / Admin endpoints
  async createTA(data) {
    return this.request('/api/auth/create-account', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();