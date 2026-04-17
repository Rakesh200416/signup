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

const normalizeOtpPayload = (data: any) => {
  if (data.otp && !data.otpCode) {
    return { ...data, otpCode: data.otp };
  }
  return data;
};

const normalizeLoginPayload = (data: any) => {
  const payload: any = {
    ...data,
    captchaToken: data.captchaToken ?? "none",
    acceptTerms: data.acceptTerms ?? true,
  };

  if (payload.identifier) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.identifier);
    if (isEmail) {
      payload.email = payload.identifier;
    } else {
      payload.phone = payload.identifier;
    }
    delete payload.identifier;
  }

  return payload;
};

export const authApi = {
  login: (data: unknown) => api.post("/auth/login", normalizeLoginPayload(data)).then((response) => response.data),
  signup: (data: unknown) => api.post("/auth/institution-admin/signup", data).then((response) => response.data),
  sendOtp: (data: unknown) => api.post("/auth/send-otp", data).then((response) => response.data),
  verifyOtp: (data: any) => api.post("/auth/verify-otp", normalizeOtpPayload(data)).then((response) => response.data),
  verifyMfa: (data: any) => api.post("/auth/setup-2fa", { ...normalizeOtpPayload(data), totpCode: data.otp ?? data.totpCode }).then((response) => response.data),
  setupMfa: (data: unknown) => api.post("/auth/setup-2fa", data).then((response) => response.data),
  forgotPassword: (data: unknown) => api.post("/auth/recover", data).then((response) => response.data),
  resetPassword: (data: unknown) => api.post("/auth/reset-password", data).then((response) => response.data),
  resendOtp: (data: unknown) => api.post("/auth/send-otp", data).then((response) => response.data),
};

export default api;
