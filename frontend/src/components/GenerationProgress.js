import React, { useState, useEffect, useRef } from 'react';
import { Zap, Wand2, Sparkles, Check, Palette, Loader2 } from 'lucide-react';
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
  type = 'content',
  showBrandStep = false,
  onCancel 
}) => {
  const { language } = useLanguage();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const apiDoneRef = useRef(false);
  const intervalRef = useRef(null);

  const stages = GENERATION_STAGES[type] || GENERATION_STAGES.content;
  const filteredStages = showBrandStep ? stages : stages.filter(s => s.id !== 'brand');

  useEffect(() => {
    if (isLoading) {
      // Start animation
      apiDoneRef.current = false;
      setVisible(true);
      setCurrentStage(0);
      setProgress(0);

      const totalStages = filteredStages.length;
      const stagePercent = 95 / totalStages;
      let stageIdx = 0;
      let prog = 0;
      const tickMs = 50;
      const totalDuration = filteredStages.reduce((sum, s) => sum + s.duration, 0);

      // Calculate ticks per stage based on duration ratios
      const ticksPerStage = filteredStages.map(s => Math.max(3, Math.round((s.duration / totalDuration) * (95 / (95 / totalStages)) * 15)));
      let ticksInCurrentStage = 0;

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        // If API done, fast-forward
        if (apiDoneRef.current) {
          stageIdx++;
          if (stageIdx >= totalStages) {
            setProgress(100);
            setCurrentStage(totalStages - 1);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setTimeout(() => setVisible(false), 350);
            return;
          }
          setCurrentStage(stageIdx);
          setProgress(Math.min((stageIdx + 0.5) * stagePercent, 95));
          return;
        }

        // Normal progression
        ticksInCurrentStage++;
        const currentStageTicks = ticksPerStage[stageIdx] || 10;
        const stageProgress = ticksInCurrentStage / currentStageTicks;
        prog = (stageIdx + stageProgress) * stagePercent;
        setProgress(Math.min(prog, 95));

        if (ticksInCurrentStage >= currentStageTicks && stageIdx < totalStages - 1) {
          stageIdx++;
          ticksInCurrentStage = 0;
          setCurrentStage(stageIdx);
        }
      }, apiDoneRef.current ? 300 : tickMs);
    } else {
      // API finished
      apiDoneRef.current = true;
    }

    return () => {
      // Don't clear interval on isLoading=false — let fast-forward finish
    };
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible) return null;

  const CurrentIcon = filteredStages[currentStage]?.icon || Loader2;
  const currentLabel = filteredStages[currentStage]?.label[language] || filteredStages[currentStage]?.label.en || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111113] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#FF3B30]/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 mx-auto rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-[#FF3B30] animate-pulse" />
          </div>
        </div>

        {/* Stage Label */}
        <h3 className="text-lg font-semibold text-white mb-4 transition-all duration-300">
          {currentLabel}
        </h3>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {filteredStages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStage 
                  ? 'bg-[#FF3B30]' 
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-500">
          {language === 'ru' ? 'Обычно занимает несколько секунд' : 'Usually takes a few seconds'}
        </p>
      </div>
    </div>
  );
};

// Inline progress indicator
export const InlineProgress = ({ isLoading, size = 'md' }) => {
  const { language } = useLanguage();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base'
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${sizeClasses[size]} bg-[#FF3B30]/10 rounded-xl border border-[#FF3B30]/20`}>
      <Loader2 className="w-5 h-5 text-[#FF3B30] animate-spin" />
      <span className="text-gray-300 font-medium">
        {language === 'ru' ? 'Создаём' : 'Creating'}{'.'.repeat(dotCount)}
      </span>
    </div>
  );
};
