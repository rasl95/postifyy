import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock, Check, Sparkles } from 'lucide-react';

export const LimitReachedModal = ({ isOpen, onClose, currentUsage, monthlyLimit }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const benefits = language === 'ru'
    ? ['200 генераций в месяц', 'Без водяных знаков', 'Brand AI и аналитика', 'AI-планировщик и шаблоны']
    : ['200 generations per month', 'No watermarks', 'Brand AI & analytics', 'AI scheduler & templates'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#111113] border-white/10" data-testid="limit-reached-modal">
        <DialogHeader>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#FF3B30]" />
          </div>
          <DialogTitle className="text-center text-xl text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Лимит достигнут' : 'Limit reached'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm pt-2 text-gray-400">
            {language === 'ru' 
              ? `Вы использовали ${currentUsage} из ${monthlyLimit} генераций`
              : `You've used ${currentUsage} of ${monthlyLimit} generations`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2.5 py-4">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#FF3B30]/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-[#FF3B30]" />
              </div>
              <span className="text-sm text-gray-300">{b}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleUpgrade}
            className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-semibold shadow-lg shadow-[#FF3B30]/30"
            data-testid="upgrade-pro-btn"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Разблокировать полный доступ' : 'Unlock full access'}
          </Button>
          <p className="text-xs text-center text-gray-500">
            {language === 'ru' ? 'Отмена в любое время' : 'Cancel anytime'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
