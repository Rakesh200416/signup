import AuthShell from "../components/auth/AuthShell";
import NeuButton from "../components/auth/NeuButton";

export default function RecoveryPage() {
  return (
    <AuthShell
      title="Recovery Escalation"
      subtitle="Too many failed attempts detected."
    >
      <div className="space-y-4">
        <div className="neu-inset p-5 text-sm leading-6 text-slate-600">
          Email OTP, mobile OTP, forgot password OTP, or QR / MFA verification
          failed too many times. Super Admin must reset the user ID or password.
        </div>

        <NeuButton className="w-full">Request Super Admin Reset</NeuButton>
      </div>
    </AuthShell>
  );
}
