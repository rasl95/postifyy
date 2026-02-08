import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

export const LanguageSwitch = ({ variant = 'default' }) => {
  const { language, toggleLanguage } = useLanguage();

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase font-medium">{language}</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 hover:bg-white/10 text-gray-400 hover:text-white"
      title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase font-medium">{language}</span>
    </Button>
  );
};
