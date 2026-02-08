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

export const LimitReachedModal = ({ isOpen, onClose, currentUsage, monthlyLimit }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleUpgrade = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#111113] border-white/10" data-testid="limit-reached-modal">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('limitReached.title')}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-4 space-y-2 text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>{t('limitReached.text')}</p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-base py-6 shadow-lg shadow-[#FF3B30]/30"
            data-testid="upgrade-pro-btn"
          >
            {t('limitReached.upgrade')}
          </Button>
          <p className="text-xs text-center text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            {language === 'ru' ? 'Отмена в любое время' : 'Cancel anytime'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
