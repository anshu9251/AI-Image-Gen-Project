const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // In case the response is not JSON
      try {
        errorMessage = await response.text() || errorMessage;
      } catch (textErr) {
        // Fallback
      }
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  auth: {
    register: async (username, email, password) => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      return handleResponse(res);
    },
    login: async (email, password) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    }
  },
  sessions: {
    list: async () => {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (title) => {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      return handleResponse(res);
    },
    update: async (sessionId, title) => {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      return handleResponse(res);
    },
    delete: async (sessionId) => {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  images: {
    generate: async (sessionId, prompt) => {
      const res = await fetch(`${API_URL}/api/images/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ session_id: sessionId, prompt })
      });
      return handleResponse(res);
    },
    getSessionImages: async (sessionId) => {
      const res = await fetch(`${API_URL}/api/images/session/${sessionId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getHistory: async (limit = 30, skip = 0) => {
      const res = await fetch(`${API_URL}/api/images/history?limit=${limit}&skip=${skip}`, {
        method: 'GET',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
export default api;
