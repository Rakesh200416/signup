const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const facultyAuthApi = {
  signup: async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    googleId?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/faculty/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Faculty signup failed.");
    }

    return response.json();
  },

  login: async (data: { email: string; password: string; googleId?: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        acceptTerms: true,
        captchaToken: "test-token",
        googleId: data.googleId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Faculty login failed.");
    }

    return response.json();
  },

  sendOtp: async (data: { channel: "email" | "phone"; target: string; purpose: "recovery" | "signin" }) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "OTP request failed.");
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
        email: data.email,
        otpCode: data.otp,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "OTP verification failed.");
    }

    return response.json();
  },

  resetPassword: async (data: { email: string; password: string; confirmPassword: string; otpCode: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password reset failed.");
    }

    return response.json();
  },
};
