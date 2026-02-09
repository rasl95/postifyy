import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Palette, Save, Trash2, Loader2, Lock, Sparkles, ArrowRight, ArrowLeft,
  Building2, Target, Heart, Zap, Check, ChevronRight,
  Monitor, Shirt, UtensilsCrossed, Dumbbell, GraduationCap, 
  Plane, Landmark, Star, MoreHorizontal, Gem
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BUSINESS_TYPES = [
  { id: 'tech', icon: Monitor, label: { en: 'Technology', ru: 'Технологии' } },
  { id: 'fashion', icon: Shirt, label: { en: 'Fashion', ru: 'Мода' } },
  { id: 'food', icon: UtensilsCrossed, label: { en: 'Food', ru: 'Еда' } },
  { id: 'fitness', icon: Dumbbell, label: { en: 'Fitness', ru: 'Фитнес' } },
  { id: 'education', icon: GraduationCap, label: { en: 'Education', ru: 'Образование' } },
  { id: 'beauty', icon: Gem, label: { en: 'Beauty', ru: 'Красота' } },
  { id: 'travel', icon: Plane, label: { en: 'Travel', ru: 'Путешествия' } },
  { id: 'finance', icon: Landmark, label: { en: 'Finance', ru: 'Финансы' } },
  { id: 'other', icon: MoreHorizontal, label: { en: 'Other', ru: 'Другое' } },
];

const STYLE_OPTIONS = [
  { id: 'realistic', label: { en: 'Realistic', ru: 'Реалистичный' }, desc: { en: 'Clean & natural', ru: 'Чисто и натурально' } },
  { id: 'minimalist', label: { en: 'Minimalist', ru: 'Минимализм' }, desc: { en: 'Simple & elegant', ru: 'Просто и элегантно' } },
  { id: 'premium', label: { en: 'Premium', ru: 'Премиум' }, desc: { en: 'Rich & luxurious', ru: 'Роскошный стиль' } },
  { id: 'dark', label: { en: 'Dark', ru: 'Тёмный' }, desc: { en: 'Moody & bold', ru: 'Глубокий и смелый' } },
  { id: 'futuristic', label: { en: 'Futuristic', ru: 'Футуризм' }, desc: { en: 'Modern & techy', ru: 'Современный' } },
  { id: 'playful', label: { en: 'Playful', ru: 'Игривый' }, desc: { en: 'Fun & colorful', ru: 'Весёлый и яркий' } },
];

const MOOD_OPTIONS = [
  { id: 'luxury', label: { en: 'Luxury', ru: 'Люксовый' } },
  { id: 'friendly', label: { en: 'Friendly', ru: 'Дружелюбный' } },
  { id: 'tech', label: { en: 'Tech', ru: 'Технологичный' } },
  { id: 'youthful', label: { en: 'Youthful', ru: 'Молодёжный' } },
  { id: 'professional', label: { en: 'Professional', ru: 'Профессиональный' } },
  { id: 'creative', label: { en: 'Creative', ru: 'Креативный' } },
];

const STEPS = [
  { id: 'identity', icon: Building2, label: { en: 'Identity', ru: 'Идентичность' } },
  { id: 'audience', icon: Target, label: { en: 'Audience', ru: 'Аудитория' } },
  { id: 'visual', icon: Palette, label: { en: 'Visual style', ru: 'Визуальный стиль' } },
];

// ─── Live Preview ───
const BrandPreview = ({ profile, language }) => {
  const brandName = profile.brand_name || (language === 'ru' ? 'Ваш бренд' : 'Your Brand');
  const tagline = profile.tagline || (language === 'ru' ? 'Слоган бренда' : 'Brand tagline');
  const businessType = BUSINESS_TYPES.find(b => b.id === profile.business_type);
  const moods = profile.brand_mood?.map(m => MOOD_OPTIONS.find(o => o.id === m)?.label[language]).filter(Boolean).join(' · ');
  const primaryColor = profile.primary_colors?.[0] || '#FF3B30';
  const secondaryColor = profile.primary_colors?.[1] || '#000000';

  return (
    <div className="bg-[#0A0A0B] border border-white/[0.06] rounded-xl p-4 sm:p-5 space-y-3" data-testid="brand-preview">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider">
        {language === 'ru' ? 'Предпросмотр' : 'Preview'}
      </p>

      {/* Mock social post card */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header bar with brand gradient */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
        
        <div className="p-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{brandName}</p>
              <p className="text-[11px] text-gray-500">{tagline}</p>
            </div>
          </div>

          {/* Mock content lines */}
          <div className="space-y-2 mb-3">
            <div className="h-2.5 bg-white/[0.06] rounded-full w-full" />
            <div className="h-2.5 bg-white/[0.06] rounded-full w-4/5" />
            <div className="h-2.5 bg-white/[0.06] rounded-full w-3/5" />
          </div>

          {/* Mock image area */}
          <div 
            className="h-24 rounded-lg flex items-center justify-center mb-3"
            style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}15)` }}
          >
            <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            {businessType && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                {businessType.label[language]}
              </span>
            )}
            {moods && (
              <span className="text-[10px] text-gray-500">{moods}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Step Indicator ───
const StepIndicator = ({ currentStep, language }) => (
  <div className="flex items-center gap-2 mb-6" data-testid="step-indicator">
    {STEPS.map((step, i) => {
      const isActive = i === currentStep;
      const isDone = i < currentStep;
      return (
        <React.Fragment key={step.id}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
            isActive ? 'bg-white/[0.08] text-white' : isDone ? 'text-emerald-400' : 'text-gray-600'
          }`}>
            {isDone ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <step.icon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{step.label[language]}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isDone ? 'text-emerald-400/50' : 'text-gray-700'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Step 1: Identity ───
const StepIdentity = ({ profile, setProfile, language }) => (
  <div className="space-y-6" data-testid="step-identity">
    <div>
      <p className="text-lg font-semibold text-white mb-1">
        {language === 'ru' ? 'Расскажите о бренде' : 'Tell us about your brand'}
      </p>
      <p className="text-sm text-gray-500">
        {language === 'ru' ? 'Название и тип бизнеса помогут AI создавать контент под ваш стиль' : 'Name and business type help AI create content in your style'}
      </p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-1.5 block">
          {language === 'ru' ? 'Название бренда' : 'Brand name'} *
        </label>
        <Input
          value={profile.brand_name}
          onChange={(e) => setProfile(prev => ({ ...prev, brand_name: e.target.value }))}
          placeholder={language === 'ru' ? 'Например: Postify' : 'e.g. Postify'}
          className="bg-[#0A0A0B] border-white/[0.08] text-white h-11"
          data-testid="brand-name-input"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-1.5 block">
          {language === 'ru' ? 'Слоган' : 'Tagline'}
        </label>
        <Input
          value={profile.tagline}
          onChange={(e) => setProfile(prev => ({ ...prev, tagline: e.target.value }))}
          placeholder={language === 'ru' ? 'Коротко о вашем бренде' : 'A short brand statement'}
          className="bg-[#0A0A0B] border-white/[0.08] text-white h-11"
          data-testid="brand-tagline-input"
        />
      </div>
    </div>

    {/* Business Type — icon cards */}
    <div>
      <label className="text-sm font-medium text-gray-300 mb-3 block">
        {language === 'ru' ? 'Тип бизнеса' : 'Business type'}
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {BUSINESS_TYPES.map((type) => {
          const isSelected = profile.business_type === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setProfile(prev => ({ ...prev, business_type: type.id }))}
              className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all ${
                isSelected 
                  ? 'bg-[#FF3B30]/10 border-[#FF3B30]/40 text-white' 
                  : 'bg-[#0A0A0B] border-white/[0.06] text-gray-400 hover:border-white/15 hover:text-gray-300'
              }`}
              data-testid={`biz-type-${type.id}`}
            >
              <type.icon className={`w-5 h-5 ${isSelected ? 'text-[#FF3B30]' : ''}`} />
              <span className="text-xs text-center leading-tight">{type.label[language]}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Step 2: Audience ───
const StepAudience = ({ profile, setProfile, language }) => {
  const toggleMood = (moodId) => {
    setProfile(prev => ({
      ...prev,
      brand_mood: prev.brand_mood.includes(moodId)
        ? prev.brand_mood.filter(m => m !== moodId)
        : [...prev.brand_mood, moodId].slice(0, 3)
    }));
  };

  return (
    <div className="space-y-6" data-testid="step-audience">
      <div>
        <p className="text-lg font-semibold text-white mb-1">
          {language === 'ru' ? 'Кто ваша аудитория?' : 'Who is your audience?'}
        </p>
        <p className="text-sm text-gray-500">
          {language === 'ru' ? 'Это влияет на тон и стиль генерируемого контента' : 'This shapes the tone and style of generated content'}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-1.5 block">
          {language === 'ru' ? 'Целевая аудитория' : 'Target audience'}
        </label>
        <Textarea
          value={profile.target_audience}
          onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
          placeholder={language === 'ru' 
            ? 'Пример: Молодые предприниматели 25-35 лет, интересуются технологиями' 
            : 'e.g. Young entrepreneurs aged 25-35, interested in tech'}
          className="bg-[#0A0A0B] border-white/[0.08] text-white min-h-[90px] resize-none"
          data-testid="target-audience-input"
        />
      </div>

      {/* Brand Mood */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-1 block">
          {language === 'ru' ? 'Атмосфера бренда' : 'Brand mood'}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {language === 'ru' ? 'Выберите до 3' : 'Select up to 3'}
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = profile.brand_mood.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleMood(mood.id)}
                className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
                  isSelected
                    ? 'bg-[#FF3B30]/10 border-[#FF3B30]/40 text-white'
                    : 'bg-[#0A0A0B] border-white/[0.06] text-gray-400 hover:border-white/15'
                }`}
                data-testid={`mood-${mood.id}`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1.5 text-[#FF3B30]" />}
                {mood.label[language]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Step 3: Visual Style ───
const StepVisual = ({ profile, setProfile, language }) => {
  const toggleStyle = (styleId) => {
    setProfile(prev => ({
      ...prev,
      preferred_styles: prev.preferred_styles.includes(styleId)
        ? prev.preferred_styles.filter(s => s !== styleId)
        : [...prev.preferred_styles, styleId].slice(0, 3)
    }));
  };

  const updateColor = (type, index, color) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].map((c, i) => i === index ? color : c)
    }));
  };

  return (
    <div className="space-y-6" data-testid="step-visual">
      <div>
        <p className="text-lg font-semibold text-white mb-1">
          {language === 'ru' ? 'Визуальный стиль' : 'Visual style'}
        </p>
        <p className="text-sm text-gray-500">
          {language === 'ru' ? 'Опционально — настройте стиль и цвета' : 'Optional — customize style and colors'}
        </p>
      </div>

      {/* Styles */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-1 block">
          {language === 'ru' ? 'Стили изображений' : 'Image styles'}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {language === 'ru' ? 'Выберите до 3' : 'Select up to 3'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = profile.preferred_styles.includes(style.id);
            return (
              <button
                key={style.id}
                onClick={() => toggleStyle(style.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#FF3B30]/10 border-[#FF3B30]/40'
                    : 'bg-[#0A0A0B] border-white/[0.06] hover:border-white/15'
                }`}
                data-testid={`style-${style.id}`}
              >
                <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {style.label[language]}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{style.desc[language]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">
          {language === 'ru' ? 'Цвета бренда' : 'Brand colors'}
        </label>
        <div className="flex items-center gap-4">
          {profile.primary_colors.map((color, index) => (
            <div key={`primary-${index}`} className="flex flex-col items-center gap-1.5">
              <label className="relative cursor-pointer group">
                <div 
                  className="w-12 h-12 rounded-xl border-2 border-white/15 group-hover:border-white/30 transition-colors"
                  style={{ background: color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor('primary_colors', index, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <span className="text-[10px] text-gray-600">{index === 0 
                ? (language === 'ru' ? 'Основной' : 'Primary') 
                : (language === 'ru' ? 'Второй' : 'Secondary')}</span>
            </div>
          ))}
          {profile.secondary_colors.map((color, index) => (
            <div key={`secondary-${index}`} className="flex flex-col items-center gap-1.5">
              <label className="relative cursor-pointer group">
                <div 
                  className="w-10 h-10 rounded-lg border-2 border-white/10 group-hover:border-white/25 transition-colors"
                  style={{ background: color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor('secondary_colors', index, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <span className="text-[10px] text-gray-600">{language === 'ru' ? 'Доп.' : 'Accent'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───
export const BrandSettings = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [step, setStep] = useState(0);

  const [profile, setProfile] = useState({
    brand_name: '',
    primary_colors: ['#FF3B30', '#000000'],
    secondary_colors: ['#FFFFFF', '#808080'],
    preferred_styles: [],
    business_type: '',
    brand_mood: [],
    tagline: '',
    target_audience: ''
  });

  useEffect(() => {
    const fetchBrandProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/brand-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHasAccess(response.data.has_access);
        if (response.data.profile) {
          setProfile(prev => ({ ...prev, ...response.data.profile }));
        }
      } catch (error) {
        console.error('Failed to fetch brand profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrandProfile();
  }, [token]);

  const handleSave = async () => {
    if (!profile.brand_name.trim()) {
      toast.error(language === 'ru' ? 'Введите название бренда' : 'Please enter brand name');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/brand-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(language === 'ru' ? 'Удалить профиль бренда?' : 'Delete brand profile?')) return;
    try {
      await axios.delete(`${API_URL}/api/brand-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        brand_name: '', primary_colors: ['#FF3B30', '#000000'],
        secondary_colors: ['#FFFFFF', '#808080'], preferred_styles: [],
        business_type: '', brand_mood: [], tagline: '', target_audience: ''
      });
      setStep(0);
      toast.success(language === 'ru' ? 'Профиль удалён' : 'Profile deleted');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <Lock className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <h2 className="text-lg font-semibold text-white mb-1">
          {language === 'ru' ? 'Brand Profile — Pro и Business' : 'Brand Profile — Pro & Business'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {language === 'ru' ? 'Уникальный стиль для всех изображений' : 'Unique style for all your images'}
        </p>
        <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" data-testid="brand-upgrade-btn">
          <Zap className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Улучшить план' : 'Upgrade Plan'}
        </Button>
      </div>
    );
  }

  const canGoNext = step === 0 ? profile.brand_name.trim().length > 0 : true;
  const isLastStep = step === 2;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {language === 'ru' ? 'Создайте ваш бренд' : 'Create your brand'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {language === 'ru' ? 'AI будет использовать эти настройки для генерации контента' : 'AI will use these settings when generating content'}
        </p>
      </div>

      <StepIndicator currentStep={step} language={language} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Main content — left */}
        <div className="lg:col-span-3">
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 sm:p-6">
            {step === 0 && <StepIdentity profile={profile} setProfile={setProfile} language={language} />}
            {step === 1 && <StepAudience profile={profile} setProfile={setProfile} language={language} />}
            {step === 2 && <StepVisual profile={profile} setProfile={setProfile} language={language} />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/[0.04]">
              <div>
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    data-testid="step-back-btn"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {language === 'ru' ? 'Назад' : 'Back'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isLastStep && profile.brand_name && (
                  <button
                    onClick={handleDelete}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    data-testid="delete-brand-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {isLastStep ? (
                  <Button
                    className={`h-10 px-5 transition-all ${
                      saved 
                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white' 
                        : 'bg-[#FF3B30] hover:bg-[#FF4D42]'
                    }`}
                    onClick={handleSave}
                    disabled={saving}
                    data-testid="save-brand-btn"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {language === 'ru' ? 'Сохраняем...' : 'Saving...'}
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Сохранено' : 'Saved'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Сохранить' : 'Save'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="bg-white/[0.08] hover:bg-white/[0.12] text-white h-10 px-5"
                    onClick={() => setStep(step + 1)}
                    disabled={!canGoNext}
                    data-testid="step-next-btn"
                  >
                    {language === 'ru' ? 'Далее' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Skip hint on step 2 */}
          {step === 2 && !saved && (
            <p className="text-xs text-gray-600 text-center mt-3">
              {language === 'ru' 
                ? 'Визуальный стиль — опциональный. Можете сохранить без него.' 
                : 'Visual style is optional. You can save without it.'}
            </p>
          )}

          {/* Inline success banner */}
          {saved && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3" data-testid="save-success-banner">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-400">
                {language === 'ru' ? 'Профиль бренда сохранён. AI будет использовать эти настройки.' : 'Brand profile saved. AI will use these settings.'}
              </p>
            </div>
          )}
        </div>

        {/* Live Preview — right side / bottom on mobile */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <BrandPreview profile={profile} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandSettings;
