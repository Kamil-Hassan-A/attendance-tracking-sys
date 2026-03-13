import axios from "axios";

let _accessToken: string | null = null;
let _setAccessToken: ((token: string | null) => void) | null = null;

/** Called once by AuthProvider so the interceptor can update the context token */
export function bindTokenSetter(setter: (token: string | null) => void) {
  _setAccessToken = setter;
}

export function setToken(token: string | null) {
  _accessToken = token;
}

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Request interceptor to always attach access token ---
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// --- Response interceptor to auto-refresh on 401 ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken: string = res.data.access_token;
        _accessToken = newToken;
        _setAccessToken?.(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        _accessToken = null;
        _setAccessToken?.(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
