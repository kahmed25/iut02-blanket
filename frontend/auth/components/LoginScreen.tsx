'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { authService, OAuthProvider } from '../services/authService';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'verify-email';

export function LoginScreen() {
  const { login, refreshUser } = useAuth();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      const availableProviders = await authService.getAvailableProviders();
      console.log('Fetched providers:', availableProviders);
      setProviders(availableProviders);
      setLoading(false);
    };

    fetchProviders();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authService.emailLogin(email, password);
      if (response.success) {
        console.log('Login successful, refreshing user context...');
        // Refresh auth context first to ensure user state is updated
        await refreshUser();
        console.log('User context refreshed, redirecting...');
        // Small delay to ensure state is propagated
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        setError(response.message || 'Login failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authService.emailRegister(email, username, password);
      if (response.success) {
        setSuccess('Registration successful! Please check your email to verify your account.');
        setAuthMode('verify-email');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSuccess('Password reset link sent to your email.');
      } else {
        setError(response.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authService.verifyEmail(email, verificationCode);
      console.log('Verification response:', response);
      if (response.success) {
        // Show success message
        setSuccess('Email verified successfully! Redirecting to dashboard...');

        // Give user time to see the success message, then redirect
        // The homepage will pick up the stored tokens automatically
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setError(response.message || 'Verification failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setVerificationCode('');
    setError('');
    setSuccess('');
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName) {
      case 'google':
        return (
          <svg className="w-6 h-6" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'amazon':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.544.406-3.14.61-4.79.61-2.69 0-5.227-.414-7.61-1.244-2.382-.83-4.343-1.91-5.88-3.24-.096-.082-.15-.164-.15-.25 0-.052.015-.1.046-.15zm7.223-3.555c-.288.1-.53.065-.724-.107-.195-.172-.277-.418-.25-.736l.22-2.645c.047-.53.273-.99.678-1.388.405-.397.88-.596 1.424-.596.568 0 1.054.204 1.458.612.404.408.61.895.61 1.46 0 .558-.206 1.037-.617 1.437-.412.4-.898.6-1.458.6h-.604l-.09 1.076c-.02.23-.1.392-.24.486-.14.094-.29.117-.447.072zm.547-2.732h.43c.256 0 .478-.092.665-.277.186-.185.28-.41.28-.674 0-.264-.094-.49-.28-.676-.187-.186-.41-.28-.665-.28s-.478.094-.665.28c-.186.186-.28.412-.28.676v.95z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getProviderStyles = (providerName: string, configured: boolean) => {
    if (!configured) {
      return {
        className: 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed',
        style: {}
      };
    }
    switch (providerName) {
      case 'google':
        return {
          className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md cursor-pointer',
          style: {}
        };
      case 'facebook':
        return {
          className: 'text-white hover:shadow-md cursor-pointer',
          style: { backgroundColor: '#1877F2' }
        };
      case 'amazon':
        return {
          className: 'text-gray-900 hover:shadow-md cursor-pointer',
          style: { backgroundColor: '#FF9900' }
        };
      default:
        return {
          className: 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer',
          style: {}
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1f3c' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#1e293b' }}>
        {/* Left Side - Logo & Branding */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-700">
          <Image
            src="/images/logo.png"
            alt="IUT02 Logo"
            width={160}
            height={160}
            className="mb-6"
            priority
          />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">IUT02 Care</h1>
          <p className="text-gray-300 mb-1">Legacy of Innovation</p>
          <p className="text-sm text-gray-500">Charity Fund Management System</p>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {authMode === 'login' && 'Welcome Back'}
              {authMode === 'register' && 'Create Account'}
              {authMode === 'forgot-password' && 'Reset Password'}
              {authMode === 'verify-email' && 'Verify Email'}
            </h2>
            <p className="text-gray-400">
              {authMode === 'login' && 'Sign in to access your account'}
              {authMode === 'register' && 'Fill in your details to get started'}
              {authMode === 'forgot-password' && 'Enter your email to reset password'}
              {authMode === 'verify-email' && 'Enter the code sent to your email'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-sm">
              {success}
            </div>
          )}

          {/* Email Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode('forgot-password'); }}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode('register'); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Create Account
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode('login'); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-gray-400">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode('login'); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Verify Email Form */}
          {authMode === 'verify-email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Email'}
              </button>
              <p className="text-center text-sm text-gray-400">
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode('login'); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          )}

          {/* OAuth Buttons - Only show for login/register modes */}
          {(authMode === 'login' || authMode === 'register') && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                {/* Google Button - Always show for now */}
                <button
                  onClick={() => login('google')}
                  className="w-full flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all duration-200 bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg"
                >
                  <div className="flex-shrink-0">
                    {getProviderIcon('google')}
                  </div>
                  <span className="flex-1 text-left">Continue with Google</span>
                </button>
              </div>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
