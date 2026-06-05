import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function LoginPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSendOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setStep('otp');
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) setError(error.message);
    setLoading(false);
    // on success, App.jsx's onAuthStateChange fires automatically
  }

  return (
      <div className="login-form-container">
        <h1 className="login-title">Login</h1>
        {step === 'email' ? (
          <form className="login-form" onSubmit={handleSendOtp}>
            <input className="login-input" placeholder="Enter your PBX email" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <p>Check your email for a 6-digit code.</p>
            <input className="login-input" placeholder="Enter the 6-digit code" type="text" id="otp" value={token} onChange={e => setToken(e.target.value)} required />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}
        {error && <p>{error}</p>}
      </div>
  );
}
