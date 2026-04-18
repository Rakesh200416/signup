export const alerts = {
  email: {
    empty: "Email cannot be empty.",
    invalid: "This email does not look valid.",
    weird: "This email looks unusual. Please double-check.",
    registered: "This email is already registered. Try logging in instead.",
    domainNotAllowed: "This email is not allowed for this institution.",
  },

  password: {
    empty: "Password cannot be empty.",
    weak: "Password is too weak. Try something stronger.",
    short: "Use at least 8 characters.",
    basic: "This password is too basic.",
    strongHint: "Your password is okay but could be stronger.",
  },

  username: {
    empty: "Name cannot be empty.",
    taken: "Username is already taken. Try another one.",
    invalid: "Special characters are not allowed here.",
    hint: "Make your username unique.",
  },

  system: {
    error: "Something went wrong. Try again.",
    server: "Server issue. Please try again shortly.",
    network: "Network issue. Check your connection.",
    tooMany: "Too many attempts. Please wait and try again.",
  },

  success: {
    welcome: "You are in. Welcome aboard.",
    created: "Account created. Let us get started.",
    registered: "You are officially registered.",
  },

  otp: {
    sent: "OTP sent. Check your inbox.",
    invalid: "Incorrect code. Try again.",
    expired: "This OTP has expired. Request a new one.",
  },

  edge: {
    sessionExpired: "Session expired. Please start again.",
    alreadyRegistered: "You are already registered. Try logging in.",
  },
};