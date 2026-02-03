'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenService } from '@/auth/services/tokenService';
import { useAuth } from '@/auth/hooks/useAuth';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      console.log('AuthSuccess: Got tokens from URL:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken 
      });

      if (accessToken && refreshToken) {
        console.log('AuthSuccess: Storing tokens in localStorage');
        // Store tokens
        tokenService.setTokens(accessToken, refreshToken);
        
        console.log('AuthSuccess: Tokens stored, verifying:', {
          storedAccessToken: !!tokenService.getAccessToken(),
          storedRefreshToken: !!tokenService.getRefreshToken()
        });
        
        // Refresh user data
        console.log('AuthSuccess: Refreshing user data');
        await refreshUser();
        
        // Wait a bit to ensure auth context is fully updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('AuthSuccess: Redirecting to home');
        // Redirect to home page
        router.push('/');
      } else {
        console.log('AuthSuccess: No tokens found, redirecting to login');
        // No tokens, redirect to login
        router.push('/login');
      }
    };

    handleAuthSuccess();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-700">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
