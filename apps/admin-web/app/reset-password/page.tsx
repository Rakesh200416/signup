import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset Password | LMS Admin",
  description: "Reset your LMS admin password with a secure OTP.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
