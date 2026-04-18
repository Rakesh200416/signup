export default function OTPPage() {
  return (
    <div className="container">
      <div className="card">
        <h2>Verify OTP</h2>

        <p>OTP sent. Check your inbox.</p>

        <input className="input" placeholder="Enter OTP" />

        <button className="button">Verify</button>

        <p className="warning">
          Did not receive the code? Resend in 30s
        </p>
      </div>
    </div>
  );
}