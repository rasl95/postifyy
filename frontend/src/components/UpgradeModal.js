import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, Check, Crown, Zap, X, Image, CalendarClock, Palette, BarChart3, Star, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { usePricing, PRICING_CONFIG } from '../contexts/PricingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

// Contextual upsell configurations
const UPSELL_CONFIGS = {
  low_credits: {
    en: {
      title: 'Almost out of credits',
      benefits: ['200 generations per month', 'No watermarks', 'Brand AI & analytics', 'AI post scheduler', 'Save & reuse templates']
    },
    ru: {
      title: 'Кредиты заканчиваются',
      benefits: ['200 генераций в месяц', 'Без водяных знаков', 'Brand AI и аналитика', 'AI-планировщик', 'Сохранение шаблонов']
    }
  },
  watermark: {
    en: {
      title: 'Remove watermark',
      benefits: ['Clean, professional content', 'No "Created with Postify AI" tag', 'Full branding control', 'Brand AI for on-brand output']
    },
    ru: {
      title: 'Убрать водяной знак',
      benefits: ['Чистый, профессиональный контент', 'Без тега "Created with Postify AI"', 'Полный контроль брендинга', 'Brand AI для фирменного стиля']
    }
  },
  template_save: {
    en: {
      title: 'Save templates for reuse',
      benefits: ['Save your best prompts', 'Reuse templates instantly', 'Build a content library', 'Speed up content creation']
    },
    ru: {
      title: 'Сохранение шаблонов',
      benefits: ['Сохраняйте лучшие промпты', 'Переиспользуйте шаблоны', 'Создайте библиотеку контента', 'Ускорьте создание контента']
    }
  },
  scheduler: {
    en: {
      title: 'Plan your content',
      benefits: ['AI-powered scheduling suggestions', 'Content calendar', 'Best time to post', 'Never miss a posting day']
    },
    ru: {
      title: 'Планируйте контент',
      benefits: ['AI-рекомендации по расписанию', 'Календарь контента', 'Лучшее время публикации', 'Не пропускайте дни постинга']
    }
  },
  favorites: {
    en: {
      title: 'Save your best content',
      benefits: ['Unlimited favorites', 'Quick access to top posts', 'Build a content library', 'Reuse winning content']
    },
    ru: {
      title: 'Сохраняйте лучший контент',
      benefits: ['Безлимитное избранное', 'Быстрый доступ к лучшим постам', 'Библиотека контента', 'Повторное использование']
    }
  },
  analytics: {
    en: {
      title: 'Track your performance',
      benefits: ['Content analytics dashboard', 'AI recommendations', 'Usage insights', 'Performance scoring']
    },
    ru: {
      title: 'Отслеживайте результаты',
      benefits: ['Панель аналитики', 'AI-рекомендации', 'Статистика использования', 'Оценка контента']
    }
  },
  brandAI: {
    en: {
      title: 'On-brand content every time',
      benefits: ['Save brand colors & tone', 'AI applies your style', 'Consistent visual identity', 'Professional output']
    },
    ru: {
      title: 'Контент в стиле бренда',
      benefits: ['Сохраняйте цвета и тон', 'AI применяет ваш стиль', 'Единый визуальный стиль', 'Профессиональный результат']
    }
  },
  default: {
    en: {
      title: 'Unlock full content workflow',
      benefits: ['200 generations per month', 'No watermarks on content', 'Brand AI & analytics', 'AI scheduler & templates', 'Extended tones & CTA goals']
    },
    ru: {
      title: 'Разблокируйте полный доступ',
      benefits: ['200 генераций в месяц', 'Контент без водяных знаков', 'Brand AI и аналитика', 'AI-планировщик и шаблоны', 'Расширенные тоны и CTA-цели']
    }
  }
};

export const UpgradeModal = ({ isOpen, onClose, feature = null, trigger = 'feature' }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { createCheckout, checkoutLoading, getUsageStats } = usePricing();
  const [loadingPlan, setLoadingPlan] = useState(null);
  
  const stats = getUsageStats();
  
  // Determine config based on trigger/feature
  const configKey = trigger === 'low_credits' ? 'low_credits' 
    : trigger === 'watermark' ? 'watermark'
    : trigger === 'template_save' ? 'template_save'
    : trigger === 'scheduler' ? 'scheduler'
    : feature && UPSELL_CONFIGS[feature] ? feature 
    : 'default';
  
  const config = UPSELL_CONFIGS[configKey];
  const info = config[language] || config.en;

  const handleUpgrade = async () => {
    setLoadingPlan('pro');
    try {
      const checkoutUrl = await createCheckout('pro');
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка создания сессии оплаты' : 'Failed to create checkout session');
    } finally {
      setLoadingPlan(null);
    }
  };

  const goToPricing = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0A0A0B] border-white/10" data-testid="upgrade-modal">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <DialogHeader className="text-center pt-2">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#FF3B30]" />
          </div>
          <DialogTitle className="text-xl text-white" data-testid="upgrade-modal-title">
            {info.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {language === 'ru' 
              ? 'Разблокируйте Pro и получите полный контроль над контентом'
              : 'Unlock Pro to get full control over your content'}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits list */}
        <div className="space-y-2.5 py-4">
          {info.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#FF3B30]/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-[#FF3B30]" />
              </div>
              <span className="text-sm text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Credits warning if applicable */}
        {trigger === 'low_credits' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Zap className="w-4 h-4" />
              <span>{language === 'ru' 
                ? `Осталось ${stats.remainingCredits} из ${stats.monthlyLimit} генераций` 
                : `${stats.remainingCredits} of ${stats.monthlyLimit} generations remaining`}</span>
            </div>
          </div>
        )}

        {/* Single CTA - Pro focused */}
        <Button
          onClick={handleUpgrade}
          disabled={checkoutLoading || loadingPlan}
          className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-semibold shadow-lg shadow-[#FF3B30]/25"
          data-testid="upgrade-unlock-pro-btn"
        >
          {loadingPlan ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Разблокировать Pro — €15/мес' : 'Unlock Pro — €15/mo'}
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <button onClick={goToPricing} className="text-sm text-gray-500 hover:text-white transition-colors" data-testid="upgrade-compare-plans-btn">
            {language === 'ru' ? 'Сравнить все планы' : 'Compare all plans'} →
          </button>
          <p className="text-xs text-gray-600">
            {language === 'ru' ? 'Отмена в любое время · Безопасная оплата' : 'Cancel anytime · Secure payment'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Feature Lock Wrapper Component
export const FeatureLock = ({ feature, children, showLockIcon = true }) => {
  const { hasFeatureAccess, showUpgradeModal } = usePricing();
  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) return children;

  return (
    <div className="relative cursor-pointer group" onClick={() => showUpgradeModal(feature)}>
      <div className="opacity-50 pointer-events-none">{children}</div>
      {showLockIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 bg-[#FF3B30] text-white px-3 py-1.5 rounded-full text-sm font-medium">
            <Lock className="w-4 h-4" />
            <span>Pro</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Low Credits Banner Component
export const LowCreditsBanner = ({ onUpgrade }) => {
  const { language } = useLanguage();
  const { isCreditsLow, getUsageStats } = usePricing();
  const stats = getUsageStats();

  if (!isCreditsLow()) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6" data-testid="low-credits-banner">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {language === 'ru' 
                ? `Осталось ${stats.remainingCredits} генераций`
                : `${stats.remainingCredits} generations left`}
            </p>
            <p className="text-xs text-gray-400">
              {language === 'ru' ? 'Разблокируйте полный доступ' : 'Unlock full access'}
            </p>
          </div>
        </div>
        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium" onClick={onUpgrade} data-testid="low-credits-upgrade-btn">
          {language === 'ru' ? 'Разблокировать' : 'Unlock'}
        </Button>
      </div>
    </div>
  );
};

export default UpgradeModal;
