import axios from "axios";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

const getApiBaseUrl = (): string => {
  if (isNative) {
    return (
      import.meta.env.VITE_API_URL_MOBILE ||
      "https://delivery-singo-backend.onrender.com"
    ).replace(/\/$/, "");
  }

  // Web browser: use the deployed HTTPS backend
  return (
    import.meta.env.VITE_API_URL ||
    "https://delivery-singo-backend.onrender.com"
  ).replace(/\/$/, "");
};

export const API_BASE_URL = getApiBaseUrl();

console.log("🔗 API Base URL:", API_BASE_URL, "Is Native:", isNative);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("📤 Request:", config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status);
    return response;
  },
  async (error) => {
    console.error(
      "❌ Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Refreshing token...");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { token: refreshToken }
        );

        const newAccessToken = res.data.accessToken || res.data.token;

        if (newAccessToken) {
          localStorage.setItem("token", newAccessToken);
        }

        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("🚫 Token refresh failed");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
