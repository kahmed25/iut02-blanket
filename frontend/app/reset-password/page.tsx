'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { authService } from '@/auth/services/authService';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

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
      const response = await authService.resetPassword(token, password);
      if (response.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to reset password. Please try again or request a new reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f172a' }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-8" style={{ backgroundColor: '#1e293b' }}>
          <div className="text-center mb-6">
            <Image
              src="/images/logo.png"
              alt="IUT02 Logo"
              width={80}
              height={80}
              className="mx-auto mb-4"
              priority
            />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
            <p className="text-gray-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-8" style={{ backgroundColor: '#1e293b' }}>
        <div className="text-center mb-6">
          <Image
            src="/images/logo.png"
            alt="IUT02 Logo"
            width={80}
            height={80}
            className="mx-auto mb-4"
            priority
          />
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400">Enter your new password below</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              disabled={isSubmitting || !!success}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Confirm password"
              required
              disabled={isSubmitting || !!success}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !!success}
            className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Resetting...' : success ? 'Password Reset!' : 'Reset Password'}
          </button>
          <p className="text-center text-sm text-gray-400">
            <a
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Back to Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
