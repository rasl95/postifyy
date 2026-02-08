import React from 'react';
import { Button } from './ui/button';
import { 
  Image, History, Star, FileText, Sparkles, 
  PenTool, Rocket, Heart, Zap, Target, BarChart3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const EMPTY_CONFIGS = {
  history: {
    icon: History,
    gradient: 'from-[#FF3B30]/15 to-[#FF6A3D]/10',
    borderColor: 'border-[#FF3B30]/20',
    iconColor: 'text-[#FF3B30]',
    title: { en: 'No generations yet', ru: 'Пока нет генераций' },
    description: { en: 'Your AI-generated content will appear here', ru: 'Здесь появится ваш AI-контент' },
    action: { en: 'Create your first post', ru: 'Создать первый пост' },
    actionIcon: PenTool,
    actionPath: '/create'
  },
  favorites: {
    icon: Star,
    gradient: 'from-yellow-500/15 to-orange-500/10',
    borderColor: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
    title: { en: 'No favorites yet', ru: 'Нет избранного' },
    description: { en: 'Save your best content here for quick access', ru: 'Сохраняйте лучший контент для быстрого доступа' },
    action: { en: 'Start creating', ru: 'Начать создавать' },
    actionIcon: Sparkles,
    actionPath: '/create'
  },
  images: {
    icon: Image,
    gradient: 'from-[#FF3B30]/15 to-[#FF6A3D]/10',
    borderColor: 'border-[#FF3B30]/20',
    iconColor: 'text-[#FF6A3D]',
    title: { en: 'No images yet', ru: 'Пока нет изображений' },
    description: { en: 'Generate stunning AI images for your brand', ru: 'Создавайте AI-изображения для вашего бренда' },
    action: { en: 'Generate first image', ru: 'Создать изображение' },
    actionIcon: Zap,
    actionPath: '/images'
  },
  results: {
    icon: FileText,
    gradient: 'from-emerald-500/15 to-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: { en: 'Ready to create', ru: 'Готовы создавать' },
    description: { en: 'Your generated content will appear here', ru: 'Здесь появится сгенерированный контент' },
    action: null,
    actionIcon: null,
    actionPath: null
  },
  brand: {
    icon: Heart,
    gradient: 'from-[#FF3B30]/15 to-[#FF6A3D]/10',
    borderColor: 'border-[#FF3B30]/20',
    iconColor: 'text-[#FF3B30]',
    title: { en: 'No brand profile', ru: 'Нет профиля бренда' },
    description: { en: 'Set up your brand for personalized content', ru: 'Настройте бренд для персонализированного контента' },
    action: { en: 'Create brand profile', ru: 'Создать профиль' },
    actionIcon: Rocket,
    actionPath: '/brand'
  },
  campaigns: {
    icon: Target,
    gradient: 'from-[#FF3B30]/15 to-[#FF6A3D]/10',
    borderColor: 'border-[#FF3B30]/20',
    iconColor: 'text-[#FF3B30]',
    title: { en: 'No campaigns yet', ru: 'Пока нет кампаний' },
    description: { en: 'Create your first AI campaign and get a complete content plan', ru: 'Создайте первую AI-кампанию и получите полный контент-план' },
    action: { en: 'Create Campaign', ru: 'Создать кампанию' },
    actionIcon: Sparkles,
    actionPath: '/campaigns'
  },
  analytics: {
    icon: BarChart3,
    gradient: 'from-[#FF3B30]/15 to-[#FF6A3D]/10',
    borderColor: 'border-[#FF3B30]/20',
    iconColor: 'text-[#FF3B30]',
    title: { en: 'No data yet', ru: 'Пока нет данных' },
    description: { en: 'Start creating content to see your analytics', ru: 'Начните создавать контент для аналитики' },
    action: { en: 'Create Content', ru: 'Создать контент' },
    actionIcon: PenTool,
    actionPath: '/create'
  }
};

export const EmptyState = ({ 
  type = 'history', 
  customTitle, 
  customDescription,
  customAction,
  onAction,
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const config = EMPTY_CONFIGS[type] || EMPTY_CONFIGS.history;
  const Icon = config.icon;
  const ActionIcon = config.actionIcon;

  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const action = customAction || config.action;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.actionPath) {
      navigate(config.actionPath);
    }
  };

  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8'
  };

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const innerIconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]}`}>
      {/* Animated Icon Container */}
      <div className="relative mb-6">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full blur-2xl opacity-50 animate-pulse`} />
        
        {/* Icon Circle */}
        <div className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-br ${config.gradient} ${config.borderColor} border flex items-center justify-center`}>
          <Icon className={`${innerIconSizes[size]} ${config.iconColor}`} />
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30]/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#FF6A3D]/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {typeof title === 'object' ? (title[language] || title.en) : title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        {typeof description === 'object' ? (description[language] || description.en) : description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={handleAction}
          className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-lg shadow-[#FF3B30]/25 transition-all hover:shadow-[#FF3B30]/40 hover:scale-105"
          data-testid={`empty-state-action-${type}`}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {typeof action === 'object' ? (action[language] || action.en) : action}
        </Button>
      )}
    </div>
  );
};

// Minimal version for inline use
export const EmptyStateInline = ({ message, icon: CustomIcon }) => {
  const Icon = CustomIcon || FileText;
  
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
      <Icon className="w-5 h-5 opacity-50" />
      <span className="text-sm">{message}</span>
    </div>
  );
};
