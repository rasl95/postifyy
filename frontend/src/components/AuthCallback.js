import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 * This component handles the OAuth callback from Emergent Auth.
 * It extracts the session_id from the URL fragment and exchanges it for user data.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processGoogleAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment (after #)
        const hash = location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch || !sessionIdMatch[1]) {
          console.error('No session_id found in URL');
          navigate('/', { replace: true });
          return;
        }

        const sessionId = sessionIdMatch[1];
        console.log('Processing Google OAuth with session_id');
        
        // Exchange session_id for user data via backend
        await processGoogleAuth(sessionId);
        
        // Redirect to dashboard on success
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF3B30] mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};
