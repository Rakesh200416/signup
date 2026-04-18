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

const isObjectRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

export const extractApiErrorMessage = (error: unknown, fallback: string = "An error occurred. Please try again."): string => {
  // First, check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle different HTTP status codes with user-friendly messages
    if (status === 409) {
      return "This email is already registered. Please try signing in instead, or use a different email address.";
    }

    if (status === 401) {
      // First try to extract the actual message from backend
      if (isObjectRecord(data)) {
        const rawMessage = typeof data.message === "string" ? data.message : "";
        const lowerMessage = rawMessage.toLowerCase();
        
        // Check for specific backend error messages
        if (lowerMessage.includes("invalid credential")) {
          return "The email or password you entered is incorrect. Please check your credentials and try again.";
        }
        if (lowerMessage.includes("user not found") || lowerMessage.includes("account not found") || lowerMessage.includes("no matching account")) {
          return "No account found with this email. Please sign up first or check your email address.";
        }
        if (lowerMessage.includes("verification")) {
          return "Your account needs to be verified first. Please check your email for the verification link.";
        }
        if (lowerMessage.includes("locked")) {
          return "Your account has been temporarily locked due to multiple failed attempts. Please try again later or reset your password.";
        }
        if (lowerMessage.includes("mfa") || lowerMessage.includes("multi-factor")) {
          return "Multi-factor authentication is required. Please enter the code from your authenticator app.";
        }
        if (lowerMessage.includes("otp") || lowerMessage.includes("code")) {
          return "The verification code is incorrect or has expired. Please request a new code and try again.";
        }
        // If there's a message but doesn't match above patterns, use it
        if (rawMessage) {
          return rawMessage;
        }
      }
      // Default 401 message
      return "Invalid credentials. Please check your email and password, and try again.";
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

    // Try to extract message from response data for other status codes
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

  // Handle non-Axios errors
  if (error instanceof Error) {
    // Don't show generic "Request failed" messages with status codes
    const errorMsg = error.message;
    if (errorMsg.includes("Request failed with status code")) {
      // Extract status code if present
      const match = errorMsg.match(/status code (\d+)/);
      if (match) {
        const status = parseInt(match[1]);
        if (status === 401) {
          return "Invalid credentials. Please check your email and password, and try again.";
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

  return fallback;
};

export default api;
