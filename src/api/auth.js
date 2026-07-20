import axios from "axios";

const API_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getProfile = (token) =>
  api.get("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
export const logout = (token) =>
  api.post(
    "/auth/logout",
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
