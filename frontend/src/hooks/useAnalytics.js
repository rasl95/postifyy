import { useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ANALYTICS_EVENTS = {
  // Generation events
  CONTENT_GENERATED: 'content_generated',
  IMAGE_GENERATED: 'image_generated',
  GENERATION_FAILED: 'generation_failed',
  
  // Template events
  TEMPLATE_SELECTED: 'template_selected',
  TEMPLATE_APPLIED: 'template_applied',
  
  // Favorites events
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  FAVORITE_FOLDER_CREATED: 'favorite_folder_created',
  
  // Upgrade events
  UPGRADE_CLICKED: 'upgrade_clicked',
  UPGRADE_MODAL_SHOWN: 'upgrade_modal_shown',
  PRICING_VIEWED: 'pricing_viewed',
  
  // Interaction events
  CONTENT_COPIED: 'content_copied',
  CONTENT_SHARED: 'content_shared',
  IMAGE_DOWNLOADED: 'image_downloaded',
  REGENERATE_CLICKED: 'regenerate_clicked',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  FEATURE_EXPLORED: 'feature_explored'
};

export const useAnalytics = () => {
  const { token } = useAuth();

  const track = useCallback(async (eventName, properties = {}) => {
    // Always track locally for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }

    // Skip API call if no token (user not logged in)
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/api/analytics/track`,
        {
          event: eventName,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            url: window.location.pathname
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Silently fail analytics - don't interrupt user experience
      console.warn('Analytics tracking failed:', error.message);
    }
  }, [token]);

  const trackGeneration = useCallback((type, success = true, properties = {}) => {
    track(success ? ANALYTICS_EVENTS.CONTENT_GENERATED : ANALYTICS_EVENTS.GENERATION_FAILED, {
      content_type: type,
      ...properties
    });
  }, [track]);

  const trackTemplate = useCallback((templateId, action = 'selected') => {
    track(action === 'applied' ? ANALYTICS_EVENTS.TEMPLATE_APPLIED : ANALYTICS_EVENTS.TEMPLATE_SELECTED, {
      template_id: templateId
    });
  }, [track]);

  const trackFavorite = useCallback((action, contentId, folderId = null) => {
    track(action === 'add' ? ANALYTICS_EVENTS.FAVORITE_ADDED : ANALYTICS_EVENTS.FAVORITE_REMOVED, {
      content_id: contentId,
      folder_id: folderId
    });
  }, [track]);

  const trackUpgrade = useCallback((source, currentPlan = 'free') => {
    track(ANALYTICS_EVENTS.UPGRADE_CLICKED, {
      source,
      current_plan: currentPlan
    });
  }, [track]);

  const trackInteraction = useCallback((action, contentId = null, contentType = null) => {
    const eventMap = {
      copy: ANALYTICS_EVENTS.CONTENT_COPIED,
      share: ANALYTICS_EVENTS.CONTENT_SHARED,
      download: ANALYTICS_EVENTS.IMAGE_DOWNLOADED,
      regenerate: ANALYTICS_EVENTS.REGENERATE_CLICKED
    };
    
    track(eventMap[action] || action, {
      content_id: contentId,
      content_type: contentType
    });
  }, [track]);

  const trackPageView = useCallback((pageName) => {
    track(ANALYTICS_EVENTS.PAGE_VIEW, { page: pageName });
  }, [track]);

  return {
    track,
    trackGeneration,
    trackTemplate,
    trackFavorite,
    trackUpgrade,
    trackInteraction,
    trackPageView,
    EVENTS: ANALYTICS_EVENTS
  };
};
