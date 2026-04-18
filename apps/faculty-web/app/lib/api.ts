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

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeEmail = (value: unknown) => (typeof value === "string" ? value.trim() : "");

type ApiPayload = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is ApiPayload => typeof value === "object" && value !== null;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

export const extractApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && isObjectRecord(error.response?.data)) {
    const data = error.response.data;

    if (typeof data.message === "string") return data.message;
    if (isStringArray(data.message)) return data.message.join(" ");
    if (Array.isArray(data.message)) {
      return data.message
        .map((issue) => {
          if (isObjectRecord(issue) && typeof issue.message === "string") return issue.message;
          return JSON.stringify(issue);
        })
        .join(" ");
    }
    if (typeof data.error === "string") return data.error;
    return JSON.stringify(data);
  }

  if (error instanceof Error) return error.message;
  return "Request failed.";
};

const normalizeOtpPayload = (data: ApiPayload): ApiPayload => {
  const payload = { ...data };
  if (payload.otp && !payload.otpCode) {
    return { ...payload, otpCode: payload.otp };
  }
  return payload;
};

const normalizeResetPasswordPayload = (data: ApiPayload): ApiPayload => {
  const payload = { ...data } as ApiPayload;

  if (payload.otp && !payload.otpCode) {
    payload.otpCode = payload.otp;
    delete payload.otp;
  }

  if (typeof payload.identifier === "string") {
    const normalizedIdentifier = payload.identifier.trim();
    if (isEmail(normalizedIdentifier)) {
      payload.email = normalizedIdentifier;
    } else {
      payload.phone = normalizedIdentifier;
    }
    delete payload.identifier;
  }

  if (typeof payload.email === "string") payload.email = payload.email.trim();
  if (typeof payload.phone === "string") payload.phone = payload.phone.trim();

  return payload;
};

const normalizeLoginPayload = (data: ApiPayload): ApiPayload => {
  const payload: ApiPayload = {
    ...data,
    captchaToken: data?.captchaToken ?? "none",
    acceptTerms: data?.acceptTerms ?? true,
  };

  if (typeof payload.identifier === "string") {
    const isEmailValue = isEmail(payload.identifier);
    if (isEmailValue) {
      payload.email = payload.identifier;
    } else {
      payload.phone = payload.identifier;
    }
    delete payload.identifier;
  }

  if (payload.role !== undefined) {
    delete payload.role;
  }

  return payload;
};

const normalizeOtpChannel = (data: ApiPayload): ApiPayload => {
  const payload = { ...data } as ApiPayload;
  if (payload.channel === "mobile") {
    payload.channel = "phone";
  }
  return payload;
};

export const authApi = {
  login: (data: ApiPayload) => {
    const normalized = normalizeLoginPayload(data);
    return api.post("/auth/login", normalized).then((response) => response.data).catch((error) => {
      throw error;
    });
  },
  loginWithMfa: (data: ApiPayload) => {
    const normalized = normalizeLoginPayload(data);
    return api.post("/auth/login", normalized).then((response) => response.data).catch((error) => {
      throw error;
    });
  },
  signup: (data: ApiPayload) => api.post("/auth/institution-admin/signup", data).then((response) => response.data),
  sendOtp: (data: ApiPayload) => api.post("/auth/send-otp", normalizeOtpChannel(data)).then((response) => response.data),
  verifyOtp: (data: ApiPayload) => api.post("/auth/verify-otp", normalizeOtpPayload(data)).then((response) => response.data),
  verifyMfa: (data: ApiPayload) => {
    const payload: ApiPayload = {
      email: normalizeEmail(data.email),
      totpCode: data.otp ?? data.totpCode,
    };
    return api.post("/auth/setup-2fa", payload).then((response) => response.data);
  },
  setupMfa: (data: ApiPayload) => {
    const payload: ApiPayload = { ...data };
    if (typeof payload.email === "string") payload.email = normalizeEmail(payload.email);
    return api.post("/auth/setup-2fa", payload).then((response) => response.data);
  },
  forgotPassword: (data: ApiPayload) => api.post("/auth/recover", data).then((response) => response.data),
  resetPassword: (data: ApiPayload) => api.post("/auth/reset-password", normalizeResetPasswordPayload(data)).then((response) => response.data),
  resendOtp: (data: ApiPayload) => api.post("/auth/send-otp", normalizeOtpChannel(data)).then((response) => response.data),
};

export default api;
