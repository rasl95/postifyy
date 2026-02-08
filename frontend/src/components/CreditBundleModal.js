import React, { useState } from 'react';
import { Package, Zap, Check, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { usePricing, PRICING_CONFIG } from '../contexts/PricingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

export const CreditBundleModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { purchaseCreditBundle, checkoutLoading } = usePricing();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [loadingBundle, setLoadingBundle] = useState(null);

  const bundles = PRICING_CONFIG.creditBundles;

  const handlePurchase = async (bundleId) => {
    setLoadingBundle(bundleId);
    try {
      const checkoutUrl = await purchaseCreditBundle(bundleId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка покупки кредитов' : 'Failed to purchase credits');
    } finally {
      setLoadingBundle(null);
    }
  };

  const getBundleIcon = (credits) => {
    if (credits >= 1000) return <Sparkles className="w-6 h-6 text-purple-400" />;
    if (credits >= 300) return <Zap className="w-6 h-6 text-[#FF3B30]" />;
    return <Package className="w-6 h-6 text-blue-400" />;
  };

  const getBundleColor = (credits) => {
    if (credits >= 1000) return 'purple';
    if (credits >= 300) return 'red';
    return 'blue';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0A0A0B] border-white/10" data-testid="credit-bundle-modal">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <DialogHeader className="text-center pt-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-[#FF3B30]" />
          </div>
          <DialogTitle className="text-2xl text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Купить кредиты' : 'Buy Credits'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {language === 'ru' 
              ? 'Дополнительные кредиты для генерации контента'
              : 'Extra credits for content generation'}
          </DialogDescription>
        </DialogHeader>

        {/* Bundle Options */}
        <div className="space-y-3 py-4">
          {bundles.map((bundle) => {
            const color = getBundleColor(bundle.credits);
            const colorClasses = {
              blue: {
                border: 'border-blue-500/30 hover:border-blue-500/60',
                bg: 'bg-blue-500/5 hover:bg-blue-500/10',
                badge: 'bg-blue-500/20 text-blue-400',
                icon: 'bg-blue-500/20'
              },
              red: {
                border: 'border-[#FF3B30]/30 hover:border-[#FF3B30]/60',
                bg: 'bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10',
                badge: 'bg-[#FF3B30]/20 text-[#FF3B30]',
                icon: 'bg-[#FF3B30]/20'
              },
              purple: {
                border: 'border-purple-500/30 hover:border-purple-500/60',
                bg: 'bg-purple-500/5 hover:bg-purple-500/10',
                badge: 'bg-purple-500/20 text-purple-400',
                icon: 'bg-purple-500/20'
              }
            };
            const classes = colorClasses[color];

            return (
              <button
                key={bundle.id}
                onClick={() => handlePurchase(bundle.id)}
                disabled={checkoutLoading || loadingBundle}
                className={`w-full p-4 rounded-xl border ${classes.border} ${classes.bg} transition-all relative overflow-hidden`}
              >
                {bundle.credits >= 1000 && (
                  <div className="absolute -top-1 -right-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-8 py-1 rotate-45 font-medium">
                    {language === 'ru' ? 'Лучшее' : 'Best'}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${classes.icon} flex items-center justify-center`}>
                      {getBundleIcon(bundle.credits)}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-lg">
                        {bundle.credits} {language === 'ru' ? 'кредитов' : 'credits'}
                      </div>
                      <div className="text-sm text-gray-400">
                        €{(bundle.price / bundle.credits).toFixed(2)} {language === 'ru' ? 'за кредит' : 'per credit'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-xl">€{bundle.price}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${classes.badge}`}>
                      {language === 'ru' ? `Скидка ${bundle.savings}` : `Save ${bundle.savings}`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span className="text-sm text-gray-400">
              {language === 'ru' 
                ? 'Кредиты не сгорают и переносятся на следующий месяц'
                : 'Credits never expire and roll over to next month'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            <span className="text-sm text-gray-400">
              {language === 'ru' 
                ? 'Используйте для любого типа генерации'
                : 'Use for any generation type'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-600 pt-2">
          {language === 'ru' ? 'Безопасная оплата через Stripe' : 'Secure payment via Stripe'}
        </p>
      </DialogContent>
    </Dialog>
  );
};

// Credit Display Component for Dashboard
export const CreditDisplay = ({ compact = false }) => {
  const { language } = useLanguage();
  const { getUsageStats, setBundleModalOpen, currentPlan } = usePricing();
  const stats = getUsageStats();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-[#FF3B30]" />
        <span className="text-gray-400">
          {stats.remainingCredits} {language === 'ru' ? 'осталось' : 'left'}
        </span>
        {currentPlan === 'free' && (
          <button
            onClick={() => setBundleModalOpen(true)}
            className="text-[#FF3B30] hover:text-[#FF4D42] font-medium"
          >
            +
          </button>
        )}
      </div>
    );
  }

  const percentUsed = stats.percentUsed;
  const isLow = stats.remainingCredits < 10;
  const isExhausted = stats.remainingCredits <= 0;

  return (
    <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">
          {language === 'ru' ? 'Ваш баланс' : 'Your balance'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          currentPlan === 'business' ? 'bg-purple-500/20 text-purple-400' :
          currentPlan === 'pro' ? 'bg-[#FF3B30]/20 text-[#FF3B30]' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
        </span>
      </div>
      
      <div className="text-3xl font-bold text-white mb-1">
        {stats.remainingCredits}
      </div>
      
      <div className="text-sm text-gray-500 mb-3">
        {stats.currentUsage} / {stats.monthlyLimit} {language === 'ru' ? 'использовано' : 'used'}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full transition-all ${
            isExhausted ? 'bg-red-500' :
            isLow ? 'bg-yellow-500' :
            'bg-[#FF3B30]'
          }`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>

      {isLow && !isExhausted && (
        <p className="text-xs text-yellow-500 mb-2">
          {language === 'ru' ? 'Кредиты заканчиваются!' : 'Credits running low!'}
        </p>
      )}

      {currentPlan === 'free' && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/10"
          onClick={() => setBundleModalOpen(true)}
        >
          <Package className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Купить кредиты' : 'Buy credits'}
        </Button>
      )}
    </div>
  );
};

export default CreditBundleModal;
