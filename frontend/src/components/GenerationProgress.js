import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Wand2, Palette, Check, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GENERATION_STAGES = {
  content: [
    { id: 'analyzing', icon: Zap, label: { en: 'Analyzing request...', ru: 'Анализируем запрос...' }, duration: 600 },
    { id: 'generating', icon: Wand2, label: { en: 'Generating AI content...', ru: 'Генерируем AI контент...' }, duration: 1200 },
    { id: 'optimizing', icon: Sparkles, label: { en: 'Optimizing for engagement...', ru: 'Оптимизируем для вовлечения...' }, duration: 800 },
    { id: 'finalizing', icon: Check, label: { en: 'Finalizing result...', ru: 'Финализируем результат...' }, duration: 400 }
  ],
  image: [
    { id: 'analyzing', icon: Zap, label: { en: 'Analyzing prompt...', ru: 'Анализируем запрос...' }, duration: 2000 },
    { id: 'brand', icon: Palette, label: { en: 'Applying brand style...', ru: 'Применяем стиль бренда...' }, duration: 3000 },
    { id: 'generating', icon: Wand2, label: { en: 'Creating AI image...', ru: 'Создаём AI изображение...' }, duration: 20000 },
    { id: 'finalizing', icon: Check, label: { en: 'Processing result...', ru: 'Обрабатываем результат...' }, duration: 2000 }
  ]
};

export const GenerationProgress = ({ 
  isLoading, 
  type = 'content', // 'content' | 'image'
  showBrandStep = false,
  onCancel 
}) => {
  const { language } = useLanguage();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = GENERATION_STAGES[type] || GENERATION_STAGES.content;
  const filteredStages = showBrandStep ? stages : stages.filter(s => s.id !== 'brand');

  // Reset state when loading changes
  useEffect(() => {
    if (!isLoading) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    setCurrentStage(0);
    setProgress(0);

    // Build stage boundaries as cumulative percentages
    const totalDuration = filteredStages.reduce((sum, s) => sum + s.duration, 0);
    const stageBoundaries = [];
    let cumulative = 0;
    for (const s of filteredStages) {
      cumulative += s.duration;
      stageBoundaries.push((cumulative / totalDuration) * 100);
    }

    let progressValue = 0;
    const tickMs = 80;
    const increment = 95 / (totalDuration / tickMs);

    const interval = setInterval(() => {
      progressValue = Math.min(progressValue + increment, 95);
      setProgress(progressValue);

      // Find current stage based on progress vs boundaries
      for (let i = 0; i < stageBoundaries.length; i++) {
        if (progressValue < stageBoundaries[i]) {
          setCurrentStage(i);
          break;
        }
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [isLoading, filteredStages]);

  if (!isLoading) return null;

  const CurrentIcon = filteredStages[currentStage]?.icon || Loader2;
  const currentLabel = filteredStages[currentStage]?.label || { en: 'Processing...', ru: 'Обработка...' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
        </div>

        {/* Current Stage Text */}
        <h3 className="text-xl font-semibold text-white mb-2 animate-pulse" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {currentLabel[language] || currentLabel.en}
        </h3>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {filteredStages.map((stage, index) => (
            <div
              key={stage.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStage 
                  ? 'bg-purple-500' 
                  : 'bg-white/20'
              } ${index === currentStage ? 'scale-125' : ''}`}
            />
          ))}
        </div>

        {/* Estimated Time */}
        <p className="text-sm text-gray-500">
          {type === 'image' 
            ? (language === 'ru' ? 'Обычно занимает 30-60 секунд' : 'Usually takes 30-60 seconds')
            : (language === 'ru' ? 'Обычно занимает несколько секунд' : 'Usually takes a few seconds')}
        </p>

        {/* Cancel Button (optional) */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
};

// Inline Progress for cards/sections
export const InlineProgress = ({ isLoading, type = 'content', size = 'md' }) => {
  const { language } = useLanguage();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount(prev => prev >= 3 ? 1 : prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${sizeClasses[size]} bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20`}>
      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
      <span className="text-white font-medium">
        {type === 'image' 
          ? (language === 'ru' ? 'Создаём изображение' : 'Creating image')
          : (language === 'ru' ? 'Генерируем контент' : 'Generating content')}
        {'.'.repeat(dotCount)}
      </span>
    </div>
  );
};
