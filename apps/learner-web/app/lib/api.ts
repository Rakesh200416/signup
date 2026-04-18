const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const parseError = async (response: Response, fallback: string) => {
  let message = fallback;

  try {
    const error = await response.json();
    
    // Extract message from backend response
    if (typeof error?.message === "string") {
      message = error.message;
    } else if (Array.isArray(error?.message)) {
      message = error.message.join(" ");
    } else if (typeof error?.error === "string") {
      message = error.error;
    }
    
    // Handle specific status codes with user-friendly messages
    if (response.status === 401) {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("invalid credential")) {
        message = "The email or password you entered is incorrect. Please check your credentials and try again.";
      } else if (lowerMessage.includes("user not found") || lowerMessage.includes("account not found") || lowerMessage.includes("no matching account")) {
        message = "No account found with this email. Please sign up first or check your email address.";
      } else if (lowerMessage.includes("verification")) {
        message = "Your account needs to be verified first. Please check your email for the verification link.";
      } else if (lowerMessage.includes("locked")) {
        message = "Your account has been temporarily locked due to multiple failed attempts. Please try again later.";
      } else if (lowerMessage.includes("otp") || lowerMessage.includes("code")) {
        message = "The verification code is incorrect or has expired. Please request a new code and try again.";
      } else if (!lowerMessage.includes("invalid") && !lowerMessage.includes("credential")) {
        // If no specific message found, provide a generic user-friendly one
        message = "Invalid credentials. Please check your email and password, and try again.";
      }
    } else if (response.status === 409) {
      message = "This email is already registered. Please try signing in instead, or use a different email address.";
    } else if (response.status === 400) {
      if (!message || message === fallback) {
        message = "Please check your input and try again. Some fields may be missing or incorrect.";
      }
    } else if (response.status === 500) {
      message = "Something went wrong on our end. Please try again later or contact support.";
    }
  } catch {
    // Keep the fallback message when the response body is empty or invalid JSON.
    if (response.status === 401) {
      message = "Invalid credentials. Please check your email and password, and try again.";
    } else if (response.status === 409) {
      message = "This email is already registered. Please try signing in instead.";
    } else if (response.status === 500) {
      message = "Something went wrong on our end. Please try again later.";
    }
  }

  throw new Error(message);
};

export const authApi = {
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/learner/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        acceptTerms: true,
        acceptPrivacy: true,
        marketingConsent: false,
      }),
    });

    if (!response.ok) {
      await parseError(response, "Signup failed");
    }

    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
        captchaToken: "valid-captcha-token-2024",
        acceptTerms: true,
      }),
    });

    if (!response.ok) {
      await parseError(response, "Login failed");
    }

    return response.json();
  },

  verifyOTP: async (data: { email: string; otp: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email.trim(),
        otpCode: data.otp,
      }),
    });

    if (!response.ok) {
      await parseError(response, "OTP verification failed");
    }

    return response.json();
  },

  sendOtp: async (data: { channel: "email" | "phone"; target: string; purpose: "signup_email" | "signin" | "recovery" }) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await parseError(response, "Failed to send OTP");
    }

    return response.json();
  },

  resetPassword: async (data: {
    email?: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    otpCode: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await parseError(response, "Failed to reset password");
    }

    return response.json();
  },

  resendOTP: async (data: { email: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: data.email.trim(),
        channel: "email",
        purpose: "signup_email",
      }),
    });

    if (!response.ok) {
      await parseError(response, "Failed to resend OTP");
    }

    return response.json();
  },
};
