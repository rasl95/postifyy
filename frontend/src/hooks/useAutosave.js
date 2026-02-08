import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useAutosave = (draftType, initialData = {}, delay = 3000) => {
  const { token } = useAuth();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isRestored, setIsRestored] = useState(false);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(JSON.stringify(initialData));

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/drafts/${draftType}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.draft?.draft_data) {
          setData(response.data.draft.draft_data);
          setLastSaved(response.data.draft.updated_at);
          setIsRestored(true);
          previousDataRef.current = JSON.stringify(response.data.draft.draft_data);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    loadDraft();
  }, [token, draftType]);

  // Auto-save with debounce
  useEffect(() => {
    if (!token) return;
    
    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === previousDataRef.current) return;
    
    // Don't save empty data
    const hasContent = Object.values(data).some(value => 
      value !== '' && value !== null && value !== undefined && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
    if (!hasContent) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for saving
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await axios.post(
          `${API_URL}/api/drafts`,
          { draft_type: draftType, draft_data: data },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLastSaved(response.data.updated_at);
        previousDataRef.current = currentData;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, token, draftType, delay]);

  // Update data
  const updateData = useCallback((newData) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  // Clear draft (call after successful generation)
  const clearDraft = useCallback(async () => {
    if (!token) return;
    
    try {
      await axios.delete(`${API_URL}/api/drafts/${draftType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(initialData);
      setLastSaved(null);
      previousDataRef.current = JSON.stringify(initialData);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [token, draftType, initialData]);

  // Reset to initial
  const resetData = useCallback(() => {
    setData(initialData);
    setIsRestored(false);
  }, [initialData]);

  return {
    data,
    setData,
    updateData,
    isSaving,
    lastSaved,
    isRestored,
    clearDraft,
    resetData
  };
};

// Format last saved time
export const formatLastSaved = (timestamp, language = 'en') => {
  if (!timestamp) return null;
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffSec < 10) {
    return language === 'ru' ? 'Только что сохранено' : 'Just saved';
  } else if (diffSec < 60) {
    return language === 'ru' ? `Сохранено ${diffSec}с назад` : `Saved ${diffSec}s ago`;
  } else if (diffMin < 60) {
    return language === 'ru' ? `Сохранено ${diffMin}м назад` : `Saved ${diffMin}m ago`;
  } else {
    return date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// Autosave indicator component
export const AutosaveIndicator = ({ isSaving, lastSaved, language = 'en' }) => {
  // Derive displayText directly without setState in effect
  const getDisplayText = () => {
    if (isSaving) {
      return language === 'ru' ? 'Сохранение...' : 'Saving...';
    }
    if (!lastSaved) {
      return '';
    }
    return formatLastSaved(lastSaved, language);
  };

  const [displayText, setDisplayText] = useState(getDisplayText);

  useEffect(() => {
    // Initial update
    setDisplayText(getDisplayText());
    
    if (isSaving || !lastSaved) return;

    // Update display every 10 seconds for "time ago" text
    const interval = setInterval(() => {
      setDisplayText(formatLastSaved(lastSaved, language));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isSaving, lastSaved, language]);

  if (!displayText) return null;

  return (
    <span className={`text-xs flex items-center gap-1 ${isSaving ? 'text-yellow-400' : 'text-gray-500'}`}>
      {isSaving && (
        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      )}
      {displayText}
    </span>
  );
};
