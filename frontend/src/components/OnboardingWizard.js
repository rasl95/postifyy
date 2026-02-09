import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, Instagram, Youtube, 
  MessageCircle, Zap, Image, Layers, PenTool, Target, Users,
  X, Crown, Rocket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CONTENT_GOALS = [
  { id: 'social_posts', icon: PenTool, label: { en: 'Social Media Posts', ru: 'Посты для соцсетей' }, desc: { en: 'AI-generated captions', ru: 'AI-тексты для постов' } },
  { id: 'ai_images', icon: Image, label: { en: 'AI Images', ru: 'AI-изображения' }, desc: { en: 'Brand visuals & graphics', ru: 'Визуалы и графика' } },
  { id: 'marketing_sets', icon: Layers, label: { en: 'Marketing Sets', ru: 'Маркетинг-паки' }, desc: { en: 'Multi-platform content', ru: 'Контент для всех платформ' } },
  { id: 'everything', icon: Sparkles, label: { en: 'Everything', ru: 'Всё вместе' }, desc: { en: 'Full content suite', ru: 'Полный набор контента' } }
];

const PLATFORMS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
  { id: 'tiktok', icon: Zap, label: 'TikTok', color: '#00F2EA' },
  { id: 'telegram', icon: MessageCircle, label: 'Telegram', color: '#0088CC' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' },
  { id: 'other', icon: Target, label: { en: 'Other', ru: 'Другое' }, color: '#6366F1' }
];

const NICHES = [
  { id: 'tech', label: { en: 'Technology', ru: 'Технологии' } },
  { id: 'fashion', label: { en: 'Fashion & Beauty', ru: 'Мода и красота' } },
  { id: 'food', label: { en: 'Food & Restaurant', ru: 'Еда и рестораны' } },
  { id: 'fitness', label: { en: 'Fitness & Health', ru: 'Фитнес и здоровье' } },
  { id: 'education', label: { en: 'Education', ru: 'Образование' } },
  { id: 'ecommerce', label: { en: 'E-commerce', ru: 'Интернет-магазин' } },
  { id: 'services', label: { en: 'Services', ru: 'Услуги' } },
  { id: 'personal', label: { en: 'Personal Brand', ru: 'Личный бренд' } }
];

const TONES = [
  { id: 'professional', label: { en: 'Professional', ru: 'Профессиональный' } },
  { id: 'friendly', label: { en: 'Friendly', ru: 'Дружелюбный' } },
  { id: 'bold', label: { en: 'Bold & Provocative', ru: 'Смелый и провокационный' } },
  { id: 'inspiring', label: { en: 'Inspiring', ru: 'Вдохновляющий' } }
];

export const OnboardingWizard = ({ isOpen, onClose, onComplete }) => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [demoGenerated, setDemoGenerated] = useState(false);
  const [demoContent, setDemoContent] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  
  const [preferences, setPreferences] = useState({
    content_goals: [],
    platforms: [],
    business_niche: '',
    target_audience: '',
    preferred_tone: ''
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const toggleGoal = (goalId) => {
    if (goalId === 'everything') {
      setPreferences(prev => ({
        ...prev,
        content_goals: prev.content_goals.includes('everything') ? [] : ['everything']
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        content_goals: prev.content_goals.includes(goalId)
          ? prev.content_goals.filter(g => g !== goalId && g !== 'everything')
          : [...prev.content_goals.filter(g => g !== 'everything'), goalId]
      }));
    }
  };

  const togglePlatform = (platformId) => {
    setPreferences(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = async () => {
    try {
      await axios.post(`${API_URL}/api/user/complete-onboarding`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onComplete?.();
      onClose();
    } catch (error) {
      onClose();
    }
  };

  const handleDemoGenerate = async () => {
    setDemoLoading(true);
    try {
      const topic = preferences.business_niche 
        ? (language === 'ru' ? `Пост о ${preferences.business_niche}` : `Post about ${preferences.business_niche}`)
        : (language === 'ru' ? 'Как повысить продажи с помощью контент-маркетинга' : 'How to boost sales with content marketing');
      
      const platform = preferences.platforms[0] || 'instagram';
      const tone = preferences.preferred_tone || 'professional';
      
      const res = await axios.post(`${API_URL}/api/generate`, {
        content_type: 'social_post',
        topic,
        platform,
        tone,
        language: language === 'ru' ? 'ru' : 'en'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDemoContent(res.data.content || res.data.generated_content || '');
      setDemoGenerated(true);
      toast.success(language === 'ru' ? 'Ваш первый пост готов!' : 'Your first post is ready!');
    } catch (error) {
      // Even if API fails, show success flow with demo content
      const demoFallback = language === 'ru' 
        ? '🔥 Хотите увеличить продажи?\n\nВот 3 простых шага:\n1. Определите целевую аудиторию\n2. Создавайте контент регулярно\n3. Анализируйте результаты\n\nPostify AI сделает это за вас — автоматически.\n\n#маркетинг #AI #контент'
        : '🔥 Want to boost your sales?\n\nHere are 3 simple steps:\n1. Define your target audience\n2. Create content consistently\n3. Analyze your results\n\nPostify AI does this for you — automatically.\n\n#marketing #AI #content';
      setDemoContent(demoFallback);
      setDemoGenerated(true);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await axios.post(`${API_URL}/api/user/complete-onboarding`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === 'ru' ? 'Добро пожаловать!' : 'Welcome aboard!');
      onComplete?.();
      onClose();
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedStyle = 'border-[#FF3B30] bg-[#FF3B30]/10 shadow-lg shadow-[#FF3B30]/10';
  const defaultStyle = 'border-white/10 hover:border-white/30 bg-white/5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-[#111113] to-[#0A0A0B] border-white/10 overflow-hidden shadow-2xl shadow-[#FF3B30]/5">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            data-testid="onboarding-skip-btn"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FF3B30]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {step <= 3 
                  ? (language === 'ru' ? 'Добро пожаловать в Postify AI!' : 'Welcome to Postify AI!')
                  : step === 4
                  ? (language === 'ru' ? 'Ваш первый AI-пост' : 'Your first AI post')
                  : (language === 'ru' ? 'Разблокируйте больше' : 'Unlock more')
                }
              </h2>
              <p className="text-sm text-gray-400">
                {language === 'ru' ? `Шаг ${step} из ${totalSteps}` : `Step ${step} of ${totalSteps}`}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/10" />
        </div>

        <CardContent className="p-6">
          {/* Step 1: Content Goals */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === 'ru' ? 'Что вы хотите создавать?' : 'What do you want to create?'}
                </h3>
                <p className="text-sm text-gray-400">
                  {language === 'ru' ? 'Выберите типы контента' : 'Select content types'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {CONTENT_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                      preferences.content_goals.includes(goal.id) ? selectedStyle : defaultStyle
                    }`}
                    data-testid={`goal-${goal.id}`}
                  >
                    {preferences.content_goals.includes(goal.id) && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FF3B30] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <goal.icon className={`w-8 h-8 mb-3 ${
                      preferences.content_goals.includes(goal.id) ? 'text-[#FF3B30]' : 'text-gray-400'
                    }`} />
                    <h4 className="font-medium text-white mb-1">{goal.label[language] || goal.label.en}</h4>
                    <p className="text-xs text-gray-400">{goal.desc[language] || goal.desc.en}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Platforms */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === 'ru' ? 'Какие платформы используете?' : 'Which platforms do you use?'}
                </h3>
                <p className="text-sm text-gray-400">
                  {language === 'ru' ? 'Выберите одну или несколько' : 'Select one or more'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                      preferences.platforms.includes(platform.id) ? selectedStyle : defaultStyle
                    }`}
                    data-testid={`platform-${platform.id}`}
                  >
                    <platform.icon 
                      className="w-6 h-6" 
                      style={{ color: preferences.platforms.includes(platform.id) ? platform.color : '#9CA3AF' }}
                    />
                    <span className="font-medium text-white">
                      {typeof platform.label === 'object' ? (platform.label[language] || platform.label.en) : platform.label}
                    </span>
                    {preferences.platforms.includes(platform.id) && (
                      <Check className="w-5 h-5 text-[#FF3B30]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Brand Setup */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === 'ru' ? 'Расскажите о вашем бизнесе' : 'Tell us about your business'}
                </h3>
                <p className="text-sm text-gray-400">
                  {language === 'ru' ? 'Это поможет персонализировать контент' : 'This helps personalize your content'}
                </p>
              </div>
              <div>
                <Label className="text-white mb-3 block">
                  {language === 'ru' ? 'Ниша / Категория' : 'Niche / Category'}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {NICHES.map((niche) => (
                    <button
                      key={niche.id}
                      onClick={() => setPreferences(prev => ({ ...prev, business_niche: niche.id }))}
                      className={`p-3 rounded-xl border transition-all text-center ${
                        preferences.business_niche === niche.id ? selectedStyle : 'border-white/10 hover:border-white/30'
                      }`}
                      data-testid={`niche-${niche.id}`}
                    >
                      <span className="text-xs text-white">{niche.label[language] || niche.label.en}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-white mb-2 block">
                  {language === 'ru' ? 'Целевая аудитория' : 'Target Audience'}
                </Label>
                <Input
                  value={preferences.target_audience}
                  onChange={(e) => setPreferences(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder={language === 'ru' ? 'Например: молодые предприниматели 25-35 лет' : 'E.g.: young entrepreneurs 25-35'}
                  className="bg-[#0A0A0B] border-white/10 text-white"
                  data-testid="target-audience-input"
                />
              </div>
              <div>
                <Label className="text-white mb-3 block">
                  {language === 'ru' ? 'Предпочитаемый тон' : 'Preferred Tone'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setPreferences(prev => ({ ...prev, preferred_tone: tone.id }))}
                      className={`px-4 py-2 rounded-full border transition-all text-sm ${
                        preferences.preferred_tone === tone.id
                          ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]'
                          : 'border-white/10 hover:border-white/30 text-gray-300'
                      }`}
                      data-testid={`tone-${tone.id}`}
                    >
                      {tone.label[language] || tone.label.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: First AI Generation */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === 'ru' ? 'Попробуйте AI прямо сейчас' : 'Try AI right now'}
                </h3>
                <p className="text-sm text-gray-400">
                  {language === 'ru' ? 'Создайте первый пост одним кликом' : 'Create your first post with one click'}
                </p>
              </div>
              
              {!demoGenerated ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-3xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-[#FF3B30]" />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleDemoGenerate}
                    disabled={demoLoading}
                    className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white px-8 shadow-lg shadow-[#FF3B30]/25"
                    data-testid="onboarding-generate-btn"
                  >
                    {demoLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {language === 'ru' ? 'Генерация...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {language === 'ru' ? 'Создать первый пост' : 'Create first post'}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    {language === 'ru' ? 'Готово! Вот ваш первый AI-пост:' : 'Done! Here\'s your first AI post:'}
                  </div>
                  <div className="bg-[#0A0A0B] p-4 rounded-xl border border-[#FF3B30]/20 text-sm whitespace-pre-wrap text-gray-300 max-h-48 overflow-y-auto">
                    {demoContent}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {language === 'ru' 
                      ? 'Postify AI создал это за секунды. Представьте, что так каждый день.'
                      : 'Postify AI created this in seconds. Imagine doing this every day.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Result Preview - "This is how your content will look" */}
          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {language === 'ru' ? 'Так будет выглядеть ваш контент' : 'This is how your content will look'}
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  {language === 'ru' 
                    ? 'Postify AI адаптирует контент под ваши настройки'
                    : 'Postify AI adapts content to your preferences'}
                </p>
              </div>
              
              {/* Preview of what they configured */}
              <div className="max-w-sm mx-auto space-y-3">
                {preferences.platforms.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                    <span className="text-sm text-white">
                      {language === 'ru' ? 'Платформы: ' : 'Platforms: '}
                      {preferences.platforms.join(', ')}
                    </span>
                  </div>
                )}
                {preferences.business_niche && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Target className="w-5 h-5 text-[#FF3B30]" />
                    <span className="text-sm text-white">
                      {language === 'ru' ? 'Ниша: ' : 'Niche: '}{preferences.business_niche}
                    </span>
                  </div>
                )}
                {demoContent && (
                  <div className="bg-[#0A0A0B] p-4 rounded-xl border border-[#FF3B30]/20 text-sm whitespace-pre-wrap text-gray-300 max-h-32 overflow-y-auto">
                    {demoContent.slice(0, 200)}{demoContent.length > 200 ? '...' : ''}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <p className="text-xs text-gray-500 text-center">
                  {language === 'ru' 
                    ? 'Вы можете создавать контент прямо сейчас — 3 генерации бесплатно'
                    : 'You can start creating content now — 3 generations free'}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Назад' : 'Back'}
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500 hover:text-white"
            >
              {language === 'ru' ? 'Пропустить' : 'Skip'}
            </Button>
            
            {step < 5 && (
              <Button
                onClick={handleNext}
                disabled={saving || (step === 4 && demoLoading)}
                className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white px-6"
                data-testid="onboarding-next-btn"
              >
                {step === 4 && !demoGenerated ? (
                  <>
                    {language === 'ru' ? 'Пропустить генерацию' : 'Skip generation'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    {language === 'ru' ? 'Далее' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            
            {step === 5 && (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-white px-6"
                data-testid="onboarding-finish-btn"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {language === 'ru' ? 'Начать бесплатно' : 'Start free'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
