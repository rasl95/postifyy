import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Zap, Clock, TrendingUp, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const UsageLimitDisplay = ({ 
  current, 
  limit, 
  type = 'text', // 'text' | 'image'
  resetType = 'monthly', // 'daily' | 'monthly'
  showUpgrade = true,
  compact = false,
  className = ''
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const remaining = Math.max(0, limit - current);
  const percentage = Math.min(100, (current / limit) * 100);
  const isLow = percentage >= 80;
  const isEmpty = remaining === 0;

  const typeLabels = {
    text: {
      remaining: { en: 'AI generations', ru: 'AI-генераций' },
      empty: { en: 'No generations left', ru: 'Генерации закончились' }
    },
    image: {
      remaining: { en: 'AI images', ru: 'AI-изображений' },
      empty: { en: 'No images left', ru: 'Изображения закончились' }
    }
  };

  const resetLabels = {
    daily: { en: 'Resets daily', ru: 'Обновляется ежедневно' },
    monthly: { en: 'Resets monthly', ru: 'Обновляется ежемесячно' }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2 bg-[#111113] rounded-xl border border-white/10 ${className}`}>
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'}`} />
          <span className="text-white font-medium">{remaining}</span>
          <span className="text-gray-500 text-sm">/ {limit}</span>
        </div>
        <Progress 
          value={percentage} 
          className={`w-20 h-2 ${isEmpty ? 'bg-red-500/20' : isLow ? 'bg-yellow-500/20' : 'bg-white/10'}`}
        />
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border ${
      isEmpty 
        ? 'bg-red-500/10 border-red-500/30' 
        : isLow 
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-[#111113] border-white/10'
    } ${className}`}>
      {/* Main Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isEmpty ? 'bg-red-500/20' : isLow ? 'bg-yellow-500/20' : 'bg-green-500/20'
          }`}>
            {isEmpty ? (
              <Clock className={`w-5 h-5 ${isEmpty ? 'text-red-400' : 'text-yellow-400'}`} />
            ) : (
              <Zap className={`w-5 h-5 ${isLow ? 'text-yellow-400' : 'text-green-400'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white'
              }`}>
                {remaining}
              </span>
              <span className="text-gray-500">
                {typeLabels[type]?.remaining[language] || typeLabels[type]?.remaining.en}
              </span>
            </div>
            {isEmpty ? (
              <p className="text-sm text-red-400">
                {typeLabels[type]?.empty[language] || typeLabels[type]?.empty.en}
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {resetLabels[resetType][language] || resetLabels[resetType].en}
              </p>
            )}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-14 h-14">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white/10"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={150}
              strokeDashoffset={150 - (150 * (100 - percentage) / 100)}
              strokeLinecap="round"
              className={`${
                isEmpty ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-green-500'
              } transition-all duration-500`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {Math.round(100 - percentage)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress 
        value={percentage} 
        className={`h-2 mb-3 ${
          isEmpty ? 'bg-red-500/20' : isLow ? 'bg-yellow-500/20' : 'bg-white/10'
        }`}
      />

      {/* Upgrade CTA */}
      {showUpgrade && (isEmpty || isLow) && (
        <Button
          onClick={() => navigate('/settings')}
          className={`w-full ${
            isEmpty 
              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
              : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
          } text-white`}
          data-testid="upgrade-btn"
        >
          <Crown className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Перейти на PRO' : 'Upgrade to PRO'}
        </Button>
      )}

      {/* Tips when empty */}
      {isEmpty && (
        <div className="mt-3 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-gray-400">
            {language === 'ru' 
              ? '💡 PRO план даёт 200 генераций в месяц и доступ ко всем функциям'
              : '💡 PRO plan gives you 200 generations per month and all features'}
          </p>
        </div>
      )}
    </div>
  );
};

// Mini version for headers
export const UsageBadge = ({ current, limit, type = 'text' }) => {
  const remaining = Math.max(0, limit - current);
  const isEmpty = remaining === 0;
  const isLow = remaining <= Math.ceil(limit * 0.2);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isEmpty 
        ? 'bg-red-500/20 text-red-400' 
        : isLow 
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-green-500/20 text-green-400'
    }`}>
      <Zap className="w-3 h-3" />
      <span>{remaining}</span>
    </div>
  );
};
