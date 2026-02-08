import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, Check, Crown, Zap, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { usePricing, PRICING_CONFIG } from '../contexts/PricingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

// Feature descriptions for upsell
const FEATURE_INFO = {
  brandAI: {
    en: {
      title: 'Brand AI Profile',
      description: 'Create a unique brand identity that AI uses to generate on-brand content every time.',
      benefits: ['Consistent brand voice', 'Custom color schemes', 'Automated brand guidelines']
    },
    ru: {
      title: 'Brand AI Профиль',
      description: 'Создайте уникальную идентичность бренда, которую AI использует для создания контента.',
      benefits: ['Единый голос бренда', 'Ваши цветовые схемы', 'Автоматические гайдлайны']
    }
  },
  marketingSets: {
    en: {
      title: 'Marketing Image Sets',
      description: 'Generate complete marketing sets for all platforms in one click.',
      benefits: ['Multi-platform formats', 'Consistent branding', 'Time-saving automation']
    },
    ru: {
      title: 'Маркетинг-наборы',
      description: 'Создавайте полные маркетинговые наборы для всех платформ одним кликом.',
      benefits: ['Форматы для всех платформ', 'Единый стиль', 'Экономия времени']
    }
  },
  advancedStyles: {
    en: {
      title: 'Advanced Image Styles',
      description: 'Access premium AI styles for unique, eye-catching visuals.',
      benefits: ['15+ premium styles', 'Custom style mixing', 'Professional results']
    },
    ru: {
      title: 'Продвинутые стили',
      description: 'Доступ к премиум AI стилям для уникальных визуалов.',
      benefits: ['15+ премиум стилей', 'Микширование стилей', 'Профессиональный результат']
    }
  },
  analytics: {
    en: {
      title: 'Analytics Dashboard',
      description: 'Track your content performance and optimize your strategy.',
      benefits: ['Usage insights', 'Content performance', 'Trend analysis']
    },
    ru: {
      title: 'Панель аналитики',
      description: 'Отслеживайте эффективность контента и оптимизируйте стратегию.',
      benefits: ['Статистика использования', 'Эффективность контента', 'Анализ трендов']
    }
  },
  favorites: {
    en: {
      title: 'Favorites & Collections',
      description: 'Save and organize your best content for easy access.',
      benefits: ['Unlimited favorites', 'Custom folders', 'Quick access']
    },
    ru: {
      title: 'Избранное и коллекции',
      description: 'Сохраняйте и организуйте лучший контент.',
      benefits: ['Неограниченное избранное', 'Папки', 'Быстрый доступ']
    }
  },
  default: {
    en: {
      title: 'Pro Feature',
      description: 'Unlock this feature with a Pro or Business plan.',
      benefits: ['Full access', 'Premium support', 'Regular updates']
    },
    ru: {
      title: 'Pro функция',
      description: 'Разблокируйте эту функцию с Pro или Business планом.',
      benefits: ['Полный доступ', 'Премиум поддержка', 'Регулярные обновления']
    }
  }
};

// Upgrade Modal Component
export const UpgradeModal = ({ isOpen, onClose, feature = null, trigger = 'feature' }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { createCheckout, checkoutLoading, getUsageStats } = usePricing();
  const [loadingPlan, setLoadingPlan] = useState(null);
  
  const featureInfo = feature ? (FEATURE_INFO[feature] || FEATURE_INFO.default) : FEATURE_INFO.default;
  const info = featureInfo[language] || featureInfo.en;
  const stats = getUsageStats();

  const handleUpgrade = async (plan) => {
    setLoadingPlan(plan);
    try {
      const checkoutUrl = await createCheckout(plan);
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

  // Different headers based on trigger
  const getHeaderContent = () => {
    switch (trigger) {
      case 'limit':
        return {
          icon: <Zap className="w-6 h-6 text-[#FF3B30]" />,
          title: language === 'ru' ? 'Лимит достигнут' : 'Limit Reached',
          subtitle: language === 'ru' 
            ? `Вы использовали ${stats.currentUsage} из ${stats.monthlyLimit} генераций`
            : `You've used ${stats.currentUsage} of ${stats.monthlyLimit} generations`
        };
      case 'low_credits':
        return {
          icon: <Zap className="w-6 h-6 text-yellow-500" />,
          title: language === 'ru' ? 'Кредиты заканчиваются' : 'Credits Running Low',
          subtitle: language === 'ru' 
            ? `Осталось ${stats.remainingCredits} генераций`
            : `${stats.remainingCredits} generations remaining`
        };
      default:
        return {
          icon: <Lock className="w-6 h-6 text-[#FF3B30]" />,
          title: info.title,
          subtitle: info.description
        };
    }
  };

  const header = getHeaderContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#0A0A0B] border-white/10" data-testid="upgrade-modal">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <DialogHeader className="text-center pt-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            {header.icon}
          </div>
          <DialogTitle className="text-2xl text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {header.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">{header.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        {feature && (
          <div className="space-y-2 py-4">
            {info.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF3B30]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#FF3B30]" />
                </div>
                <span className="text-sm text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Plan Options */}
        <div className="space-y-3 py-4">
          {/* Pro Option */}
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={checkoutLoading || loadingPlan}
            className="w-full p-4 rounded-xl border-2 border-[#FF3B30] bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF3B30]/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Pro</div>
                  <div className="text-sm text-gray-400">
                    {language === 'ru' ? '200 генераций/мес' : '200 generations/mo'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">€15<span className="text-sm text-gray-500">/mo</span></div>
                <ArrowRight className="w-4 h-4 text-[#FF3B30] ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Business Option */}
          <button
            onClick={() => handleUpgrade('business')}
            disabled={checkoutLoading || loadingPlan}
            className="w-full p-4 rounded-xl border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-purple-500/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Business</div>
                  <div className="text-sm text-gray-400">
                    {language === 'ru' ? '600 генераций/мес' : '600 generations/mo'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">€39<span className="text-sm text-gray-500">/mo</span></div>
                <ArrowRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={goToPricing}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            {language === 'ru' ? 'Сравнить все планы →' : 'Compare all plans →'}
          </button>
          <p className="text-xs text-gray-600">
            {language === 'ru' ? 'Отмена в любое время • Безопасная оплата' : 'Cancel anytime • Secure payment'}
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

  if (hasAccess) {
    return children;
  }

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={() => showUpgradeModal(feature)}
    >
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
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
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
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
              {language === 'ru' 
                ? 'Перейдите на Pro для неограниченного контента'
                : 'Upgrade to Pro for unlimited content'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
          onClick={onUpgrade}
        >
          {language === 'ru' ? 'Улучшить' : 'Upgrade'}
        </Button>
      </div>
    </div>
  );
};

export default UpgradeModal;
