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
  const [visible, setVisible] = useState(false);
  const [apiDone, setApiDone] = useState(false);

  const stages = GENERATION_STAGES[type] || GENERATION_STAGES.content;
  const filteredStages = showBrandStep ? stages : stages.filter(s => s.id !== 'brand');
  const totalStages = filteredStages.length;

  useEffect(() => {
    if (isLoading) {
      // Start showing
      setVisible(true);
      setApiDone(false);
      setCurrentStage(0);
      setProgress(0);
    } else if (visible) {
      // API is done but keep animating until all stages shown
      setApiDone(true);
    }
  }, [isLoading, visible]);

  // Stage progression timer
  useEffect(() => {
    if (!visible) return;

    let stageIdx = 0;
    setCurrentStage(0);
    setProgress(0);

    const totalDuration = filteredStages.reduce((sum, s) => sum + s.duration, 0);
    const stageBoundaries = [];
    let cum = 0;
    for (const s of filteredStages) {
      cum += s.duration;
      stageBoundaries.push((cum / totalDuration) * 100);
    }

    let progressVal = 0;
    const tickMs = 60;
    const maxProgress = 95;
    const increment = maxProgress / (totalDuration / tickMs);

    const interval = setInterval(() => {
      progressVal = Math.min(progressVal + increment, maxProgress);
      setProgress(progressVal);

      // Find current stage
      for (let i = 0; i < stageBoundaries.length; i++) {
        if (progressVal < stageBoundaries[i]) {
          if (stageIdx !== i) {
            stageIdx = i;
            setCurrentStage(i);
          }
          break;
        }
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [visible, filteredStages]);

  // When API is done, fast-forward remaining stages then hide
  useEffect(() => {
    if (!apiDone || !visible) return;

    // Fast-forward: move through remaining stages quickly
    let idx = currentStage;
    const fastForward = setInterval(() => {
      idx++;
      if (idx >= totalStages) {
        clearInterval(fastForward);
        setProgress(100);
        // Small delay before hiding to show 100%
        setTimeout(() => setVisible(false), 300);
      } else {
        setCurrentStage(idx);
        // Jump progress proportionally
        const totalDuration = filteredStages.reduce((sum, s) => sum + s.duration, 0);
        let cum = 0;
        for (let i = 0; i <= idx; i++) cum += filteredStages[i].duration;
        setProgress(Math.min((cum / totalDuration) * 100, 95));
      }
    }, 350);

    return () => clearInterval(fastForward);
  }, [apiDone, visible, currentStage, totalStages, filteredStages]);

  if (!visible) return null;

  const CurrentIcon = filteredStages[currentStage]?.icon || Loader2;
  const currentLabel = filteredStages[currentStage]?.label || { en: 'Processing...', ru: 'Обработка...' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#FF3B30]/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 mx-auto rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-[#FF3B30] animate-pulse" />
          </div>
        </div>

        {/* Current Stage Text */}
        <h3 className="text-xl font-semibold text-white mb-2 animate-pulse" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {currentLabel[language] || currentLabel.en}
        </h3>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D] rounded-full transition-all duration-300 ease-out"
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
                  ? 'bg-[#FF3B30]' 
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
    <div className={`flex items-center justify-center gap-3 ${sizeClasses[size]} bg-[#FF3B30]/10 rounded-xl border border-[#FF3B30]/20`}>
      <Loader2 className="w-5 h-5 text-[#FF3B30] animate-spin" />
      <span className="text-white font-medium">
        {type === 'image' 
          ? (language === 'ru' ? 'Создаём изображение' : 'Creating image')
          : (language === 'ru' ? 'Генерируем контент' : 'Generating content')}
        {'.'.repeat(dotCount)}
      </span>
    </div>
  );
};
