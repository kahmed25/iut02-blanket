'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { authService, OAuthProvider } from '../services/authService';

export function LoginScreen() {
  const { login } = useAuth();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      const availableProviders = await authService.getAvailableProviders();
      console.log('Fetched providers:', availableProviders);
      setProviders(availableProviders);
      setLoading(false);
    };

    fetchProviders();
  }, []);

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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to access your account</p>
          </div>

          <div className="space-y-3">
            {providers.filter(p => p.configured).length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 font-medium mb-2">No OAuth providers configured</p>
                <p className="text-sm text-gray-500">
                  Please configure at least one OAuth provider.
                </p>
              </div>
            ) : (
              <>
                {/* Google Button */}
                {providers.find(p => p.name === 'google' && p.configured) && (
                  <button
                    onClick={() => login('google')}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-200 bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg"
                  >
                    <div className="flex-shrink-0">
                      {getProviderIcon('google')}
                    </div>
                    <span className="flex-1 text-left">Continue with Google</span>
                  </button>
                )}

                {/* Facebook Button */}
                {providers.find(p => p.name === 'facebook' && p.configured) && (
                  <button
                    onClick={() => login('facebook')}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-200 text-white hover:shadow-lg"
                    style={{ backgroundColor: '#1877F2' }}
                  >
                    <div className="flex-shrink-0">
                      {getProviderIcon('facebook')}
                    </div>
                    <span className="flex-1 text-left">Continue with Facebook</span>
                  </button>
                )}

                {/* Amazon Button */}
                {providers.find(p => p.name === 'amazon' && p.configured) && (
                  <button
                    onClick={() => login('amazon')}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-200 text-gray-900 hover:shadow-lg"
                    style={{ backgroundColor: '#FF9900' }}
                  >
                    <div className="flex-shrink-0">
                      {getProviderIcon('amazon')}
                    </div>
                    <span className="flex-1 text-left">Continue with Amazon</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-red-400 hover:text-red-300">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-red-400 hover:text-red-300">Privacy Policy</a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure authentication powered by OAuth 2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
