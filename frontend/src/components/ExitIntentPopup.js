import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Sparkles, Zap, ArrowRight, X } from 'lucide-react';

const EXIT_INTENT_KEY = 'postify_exit_shown';

export const ExitIntentPopup = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const triggered = useRef(false);

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  useEffect(() => {
    if (isPro || !user) return;
    
    // Only show once per session
    const wasShown = sessionStorage.getItem(EXIT_INTENT_KEY);
    if (wasShown) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 5 && !triggered.current) {
        triggered.current = true;
        sessionStorage.setItem(EXIT_INTENT_KEY, 'true');
        setShow(true);
      }
    };

    // Delay adding listener (don't trigger on page load)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 10000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPro, user]);

  if (isPro || !user) return null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#111113] to-[#0A0A0B] border-[#FF3B30]/20" data-testid="exit-intent-popup">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#FF3B30]" />
          </div>
          <DialogTitle className="text-2xl text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Подождите!' : 'Wait!'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-base">
            {language === 'ru'
              ? 'Специальное предложение — только сейчас'
              : 'Special offer — just for you'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FF3B30]/15 text-[#FF3B30] px-4 py-2 rounded-full text-sm font-bold">
            <Zap className="w-4 h-4" />
            {language === 'ru' ? 'Pro со скидкой' : 'Pro discount'}
          </div>
          
          <p className="text-gray-300 text-sm max-w-xs mx-auto">
            {language === 'ru'
              ? 'Перейдите на Pro сейчас и получите 200 генераций/мес вместо 3. Ваш контент ждёт.'
              : 'Upgrade to Pro now and get 200 generations/mo instead of 3. Your content awaits.'}
          </p>

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => { setShow(false); navigate('/pricing'); }}
              className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-bold shadow-lg shadow-[#FF3B30]/25"
              data-testid="exit-intent-upgrade-btn"
            >
              {language === 'ru' ? 'Посмотреть тарифы' : 'View plans'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={() => setShow(false)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {language === 'ru' ? 'Нет, спасибо' : 'No, thanks'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
