import React from 'react';
import { X, Mail, Gift, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAbandonmentStatus } from '../hooks/usePricingTracking';
import { useNavigate } from 'react-router-dom';

export const AbandonmentBanner = ({ onDismiss }) => {
  const { language } = useLanguage();
  const { abandonmentStatus } = useAbandonmentStatus();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show if not abandoned or already dismissed
  if (!abandonmentStatus?.show_reminder_banner || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="relative bg-gradient-to-r from-[#FF3B30]/10 via-[#FF3B30]/5 to-transparent border border-[#FF3B30]/20 rounded-xl p-4 mb-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3B30]/10 rounded-full blur-3xl" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-[#FF3B30]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-[#FF3B30]" />
              <span className="text-sm font-medium text-[#FF3B30]">
                {language === 'ru' ? 'Бонус внутри!' : 'Bonus inside!'}
              </span>
            </div>
            <p className="text-sm text-white font-medium">
              {language === 'ru' 
                ? 'Проверьте вашу почту — мы отправили специальное предложение'
                : 'Check your email — we sent you a special offer'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {language === 'ru'
                ? '50 бонусных кредитов ждут вас при переходе на Pro'
                : '50 bonus credits waiting for you when you upgrade to Pro'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            size="sm"
            className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
            onClick={() => navigate('/pricing?utm_source=banner&utm_campaign=abandonment')}
          >
            {language === 'ru' ? 'Получить бонус' : 'Claim Bonus'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact version for sidebar or smaller spaces
export const AbandonmentBadge = () => {
  const { language } = useLanguage();
  const { abandonmentStatus } = useAbandonmentStatus();
  const navigate = useNavigate();

  if (!abandonmentStatus?.show_reminder_banner) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/pricing?utm_source=badge&utm_campaign=abandonment')}
      className="flex items-center gap-2 px-3 py-2 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg hover:bg-[#FF3B30]/20 transition-colors w-full"
    >
      <Gift className="w-4 h-4 text-[#FF3B30]" />
      <span className="text-xs text-[#FF3B30] font-medium">
        {language === 'ru' ? '50 бонусов ждут!' : '50 bonus waiting!'}
      </span>
    </button>
  );
};

export default AbandonmentBanner;
