import axios from "axios";

const defaultApiBaseUrl =
  typeof window !== "undefined"
    ? window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "https://signup-c2z3.onrender.com" // Production backend URL
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

export const extractApiErrorMessage = (error: unknown): string => {
  // Debug: Log the error to see what we're receiving
  console.log('[Error Handler] Received error:', error);
  
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Debug: Log status and data
    console.log('[Error Handler] Status:', status);
    console.log('[Error Handler] Data:', data);

    // Handle different HTTP status codes with user-friendly messages
    if (status === 409) {
      return "This email is already registered. Please try signing in instead, or use a different email address.";
    }

    if (status === 401) {
      if (isObjectRecord(data)) {
        // Check for specific error messages from backend
        const rawMessage = typeof data.message === "string" ? data.message : "";
        const message = rawMessage.toLowerCase();
        
        // Debug: Log the message we're checking
        console.log('[Error Handler 401] Raw message:', rawMessage);
        console.log('[Error Handler 401] Lower message:', message);
        
        if (message.includes("invalid credential")) {
          return "The email/phone or password you entered is incorrect. Please check your credentials and try again.";
        }
        if (message.includes("user not found") || message.includes("account not found") || message.includes("no matching account")) {
          return "No account found with this email/phone. Please sign up first or check your email/phone number.";
        }
        if (message.includes("verification")) {
          return "Your account needs to be verified first. Please check your email for the verification link.";
        }
        if (message.includes("locked")) {
          return "Your account has been temporarily locked due to multiple failed attempts. Please try again later or reset your password.";
        }
        if (message.includes("mfa") || message.includes("multi-factor")) {
          return "Multi-factor authentication is required. Please enter the code from your authenticator app.";
        }
        if (message.includes("otp") || message.includes("code")) {
          return "The verification code is incorrect or has expired. Please request a new code and try again.";
        }
        // If there's a message but doesn't match above patterns, use it
        if (rawMessage) {
          return rawMessage;
        }
      }
      return "Invalid credentials. Please check your email/phone and password, and try again.";
    }

    if (status === 400) {
      if (isObjectRecord(data)) {
        // Handle validation errors
        if (typeof data.message === "string") {
          return data.message;
        }
        if (isStringArray(data.message)) {
          return data.message.join(". ");
        }
        if (Array.isArray(data.message)) {
          return data.message
            .map((issue) => {
              if (isObjectRecord(issue) && typeof issue.message === "string") return issue.message;
              return JSON.stringify(issue);
            })
            .join(". ");
        }
      }
      return "Please check your input and try again. Some fields may be missing or incorrect.";
    }

    if (status === 403) {
      return "You don't have permission to perform this action. Please contact support if you believe this is an error.";
    }

    if (status === 404) {
      return "The requested resource was not found. Please try again or contact support.";
    }

    if (status === 429) {
      return "Too many attempts. Please wait a moment before trying again.";
    }

    if (status === 500) {
      return "Something went wrong on our end. Please try again later or contact support.";
    }

    // Try to extract message from response data
    if (isObjectRecord(data)) {
      if (typeof data.message === "string") return data.message;
      if (isStringArray(data.message)) return data.message.join(". ");
      if (Array.isArray(data.message)) {
        return data.message
          .map((issue) => {
            if (isObjectRecord(issue) && typeof issue.message === "string") return issue.message;
            return JSON.stringify(issue);
          })
          .join(". ");
      }
      if (typeof data.error === "string") return data.error;
    }
    
    // If we have a status code but no specific message, provide context
    if (status) {
      return `Request failed with status ${status}. Please try again.`;
    }
  }

  if (error instanceof Error) {
    // Don't show generic "Request failed" messages with status codes
    const errorMsg = error.message;
    if (errorMsg.includes("Request failed with status code")) {
      // Extract status code if present
      const match = errorMsg.match(/status code (\d+)/);
      if (match) {
        const status = parseInt(match[1]);
        if (status === 401) {
          return "Invalid credentials. Please check your email/phone and password, and try again.";
        }
        if (status === 409) {
          return "This email is already registered. Please try signing in instead.";
        }
        if (status === 500) {
          return "Something went wrong on our end. Please try again later.";
        }
      }
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return errorMsg;
  }

  return "An unexpected error occurred. Please try again or contact support.";
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
  coordinatorSignup: (data: ApiPayload) => api.post("/auth/coordinator/signup", data).then((response) => response.data),
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
