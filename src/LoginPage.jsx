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
    if (!email.toLowerCase().endsWith('@pbxtruck.ca')) {
      setError('Sorry, that email is not authorized.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error(error);
      setError('Could not send verification code. Please try again later.');
    }
    else setStep('otp');
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      console.error(error);
      setError('Invalid or expired code. Please try again.');
    }
    setLoading(false);
    // on success, App.jsx's onAuthStateChange fires automatically
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-titlebar">
          <span>PBX TRUCK SERVICE</span>
          <span className="login-titlebar-red">SCHEDULE</span>
        </div>
        <div className="login-body">
          <p className="login-sub">Work order board — staff sign-on</p>
          {step === 'email' ? (
            <form className="login-form" onSubmit={handleSendOtp}>
              <label className="login-label" htmlFor="email">PBX Email</label>
              <span className="term-field">
                <input className="login-input" placeholder="Enter your PBX email" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <span className="cursor-block" aria-hidden="true">▮</span>
              </span>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleVerifyOtp}>
              <p className="login-note">Check your email for a verification code.</p>
              <label className="login-label" htmlFor="otp">6-Digit Code</label>
              <span className="term-field">
                <input className="login-input" placeholder="Enter the 6-digit code" type="text" id="otp" value={token} onChange={e => setToken(e.target.value)} required />
                <span className="cursor-block" aria-hidden="true">▮</span>
              </span>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}
          {error && <p className="login-error">{error}</p>}
        </div>
        <div className="login-foot">Authorized @pbxtruck.ca accounts only</div>
      </div>
    </div>
  );
}
