import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Share2, Gift, X, UserPlus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const DISMISSED_KEY = 'postify_viral_dismissed';

export const ViralPromptBanner = () => {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  const checkTrigger = useCallback(async () => {
    if (!token || !user) return;
    
    // Don't show if dismissed recently
    const dismissed = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '{}');
    
    try {
      const res = await axios.get(`${API_URL}/api/user/generation-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const count = res.data.total_generations;
      
      // Trigger at milestone 5, 10, 20, 50
      if (count === 5 && !dismissed['share_5']) {
        setPrompt({
          type: 'share',
          milestone: 5,
          icon: Share2,
          title: language === 'ru' ? 'Уже 5 постов!' : '5 posts already!',
          desc: language === 'ru' 
            ? 'Поделитесь Postify AI с коллегой — контент для двоих лучше, чем для одного.' 
            : 'Share Postify AI with a colleague — content for two is better than one.',
          action: language === 'ru' ? 'Поделиться' : 'Share',
          path: '/referrals'
        });
        setVisible(true);
      } else if (count >= 10 && count < 20 && !dismissed['invite_10']) {
        setPrompt({
          type: 'invite',
          milestone: 10,
          icon: Gift,
          title: language === 'ru' ? 'Пригласите друга — получите +5' : 'Invite a friend — get +5',
          desc: language === 'ru'
            ? 'Вы создали уже 10+ постов. Пригласите друга и оба получите бонусные генерации.'
            : "You've created 10+ posts. Invite a friend and both get bonus generations.",
          action: language === 'ru' ? 'Пригласить' : 'Invite',
          path: '/referrals'
        });
        setVisible(true);
      } else if (count >= 20 && !dismissed['referral_20']) {
        setPrompt({
          type: 'referral',
          milestone: 20,
          icon: UserPlus,
          title: language === 'ru' ? 'Вы продвинутый пользователь!' : 'You are a power user!',
          desc: language === 'ru'
            ? '20+ постов создано. Приведите друзей — каждый принесёт вам +5 генераций.'
            : '20+ posts created. Bring friends — each earns you +5 generations.',
          action: language === 'ru' ? 'Реферальная программа' : 'Referral program',
          path: '/referrals'
        });
        setVisible(true);
      }
    } catch { /* silent */ }
  }, [token, user, language]);

  useEffect(() => {
    // Check after a short delay (don't interrupt page load)
    const timer = setTimeout(checkTrigger, 3000);
    return () => clearTimeout(timer);
  }, [checkTrigger]);

  const dismiss = () => {
    if (prompt) {
      const dismissed = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '{}');
      dismissed[`${prompt.type}_${prompt.milestone}`] = true;
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
    setVisible(false);
  };

  if (!visible || !prompt) return null;

  const Icon = prompt.icon;

  return (
    <div 
      className="fixed bottom-6 right-6 z-40 max-w-sm animate-in slide-in-from-bottom-4 duration-500"
      data-testid="viral-prompt-banner"
    >
      <div className="bg-[#111113] border border-[#FF3B30]/30 rounded-2xl p-4 shadow-2xl shadow-[#FF3B30]/10">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-600 hover:text-white p-1"
          data-testid="viral-dismiss-btn"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">{prompt.title}</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{prompt.desc}</p>
            <Button
              size="sm"
              onClick={() => { dismiss(); navigate(prompt.path); }}
              className="mt-3 bg-[#FF3B30] hover:bg-[#FF4D42] text-white text-xs"
              data-testid="viral-action-btn"
            >
              {prompt.action}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
