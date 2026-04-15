import axios from "axios";

const defaultApiBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://127.0.0.1:3001";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? defaultApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default api;
