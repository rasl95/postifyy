import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('welcome'); // welcome, firstAction, none

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            withCredentials: true
          });
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName, referralCode = null) => {
    const payload = { email, password, full_name: fullName };
    if (referralCode) payload.referral_code = referralCode;
    
    const response = await axios.post(`${API_URL}/api/auth/register`, payload);
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(user);
    
    // Show onboarding for new users
    setShowOnboarding(true);
    setOnboardingStep('welcome');
    
    return response.data;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(user);
    return response.data;
  };

  /**
   * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
   * Initiate Google OAuth by redirecting to Emergent Auth
   */
  const loginWithGoogle = () => {
    // Use window.location.origin to dynamically get the current domain
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  /**
   * Process Google OAuth callback - exchange session_id for user data
   */
  const processGoogleAuth = async (sessionId) => {
    const response = await axios.post(
      `${API_URL}/api/auth/google/session`,
      { session_id: sessionId },
      { withCredentials: true }
    );
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(user);
    
    // Show onboarding for new Google users (those without prior usage)
    if (user.current_usage === 0 || user.current_usage === undefined) {
      setShowOnboarding(true);
      setOnboardingStep('welcome');
    }
    
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep('none');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      token, 
      register, 
      login,
      loginWithGoogle,
      processGoogleAuth,
      logout, 
      checkAuth,
      showOnboarding,
      onboardingStep,
      setOnboardingStep,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};