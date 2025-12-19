const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {

  async request(endpoint, options = {}) {

    const url = `${API_BASE}${endpoint}`;

    const config = {

      headers: {

        'Content-Type': 'application/json',

        ...options.headers,

      },

      ...options,

    };

    // Add auth token if available

    const taUser = localStorage.getItem('current_ta_user');

    if (taUser) {

      const { token } = JSON.parse(taUser);

      config.headers.Authorization = `Bearer ${token}`;

    }

    const response = await fetch(url, config);

    if (!response.ok) {

      const error = await response.json();

      throw new Error(error.message || 'API Error');

    }

    return response.json();

  }

  // TA endpoints

  async signIn(pin) {

    return this.request('/api/signin', {

      method: 'POST',

      body: JSON.stringify({ ta_code: pin }),

    });

  }

  async clockIn(taId) {

    return this.request('/api/attendance/clock-in', {

      method: 'POST',

      body: JSON.stringify({ ta_id: taId }),

    });

  }

  async getShifts(taId) {

    return this.request(`/api/shifts?ta_id=${taId}`);

  }

  // VP endpoints

  async getAllTAs() {

    return this.request('/api/data');

  }

  async createTA(data) {

    return this.request('/api/data', {

      method: 'POST',

      body: JSON.stringify(data),

    });

  }

}

export const api = new ApiClient();