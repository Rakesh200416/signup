export const validateEmail = (email: string) => {
  if (!email) return "Email cannot be empty.";
  if (!email.includes("@")) return "This email does not look valid.";
  return "";
};

export const validatePassword = (password: string) => {
  if (!password) return "Password cannot be empty.";
  if (password.length < 8) return "Use at least 8 characters.";
  return "";
};

export const validateUsername = (name: string) => {
  if (!name) return "Name cannot be empty.";
  if (/[^a-zA-Z0-9 ]/.test(name))
    return "Special characters are not allowed here.";
  return "";
};
