export function validateLoginForm(identifier: string, password: string) {
  if (!identifier.trim()) {
    return "Enter your email or mobile number.";
  }
  if (!password) {
    return "Enter your password.";
  }
  return "";
}

export function validateMfaCode(code: string) {
  if (!code || code.length < 6) {
    return "Enter a valid 6-digit code.";
  }
  return "";
}
