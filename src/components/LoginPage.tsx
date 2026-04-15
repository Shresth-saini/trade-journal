'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') return;
      toast.error(error?.message || 'Google sign in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (mode !== 'reset' && !password)) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsEmailLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created! Welcome to TradeJournal.');
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent!');
        setMode('signin');
      }
    } catch (error: any) {
      const msg =
        error?.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : error?.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : error?.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : error?.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters'
          : error?.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background gradient blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-wrapper">
        {/* Brand logo */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <rect x="2" y="14" width="6" height="12" rx="1" fill="currentColor" />
              <rect x="11" y="8" width="6" height="18" rx="1" fill="currentColor" />
              <rect x="20" y="2" width="6" height="24" rx="1" fill="currentColor" />
              <path d="M3 17 L10 11 L17 14 L25 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="login-brand-name">TRADEJOURNAL</span>
        </div>

        {/* Card */}
        <div className="login-card-v2">
          <p className="login-card-subtitle">
            {mode === 'signin'
              ? 'Sign in to your account'
              : mode === 'signup'
              ? 'Create your account'
              : 'Reset your password'}
          </p>

          {/* Google Button */}
          {mode !== 'reset' && (
            <button
              id="google-signin-btn"
              className="google-btn-v2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="btn-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>
          )}

          {/* OR divider */}
          {mode !== 'reset' && (
            <div className="login-divider">
              <span>OR</span>
            </div>
          )}

          {/* Email/Password form */}
          <form onSubmit={handleEmailAuth} className="login-form">
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-field-label">EMAIL</label>
              <input
                id="login-email"
                type="email"
                className="login-field-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {mode !== 'reset' && (
              <div className="login-field-group">
                <div className="login-field-label-row">
                  <label htmlFor="login-password" className="login-field-label">PASSWORD</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="login-forgot-btn"
                      onClick={() => setMode('reset')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="login-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-field-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              id="email-auth-btn"
              type="submit"
              className="login-submit-btn"
              disabled={isEmailLoading}
            >
              {isEmailLoading ? (
                <div className="btn-spinner btn-spinner-dark" />
              ) : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </button>
          </form>

          {/* Mode switcher */}
          <div className="login-switch">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button className="login-switch-btn" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button className="login-switch-btn" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                Remember your password?{' '}
                <button className="login-switch-btn" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Shresth Saini</p>
          <p>© 2026 TradeJournal &middot; <a href="#">Privacy</a> &middot; <a href="#">Terms</a></p>
        </div>
      </div>
    </div>
  );
}
