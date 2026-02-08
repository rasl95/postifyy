import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Palette, Save, Trash2, Loader2, Lock, Sparkles, 
  Building2, Target, Heart, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STYLE_OPTIONS = [
  { id: 'realistic', label: { en: 'Realistic', ru: 'Реалистичный' }, icon: '📷' },
  { id: 'minimalist', label: { en: 'Minimalist', ru: 'Минимализм' }, icon: '⬜' },
  { id: 'premium', label: { en: 'Premium', ru: 'Премиум' }, icon: '✨' },
  { id: 'dark', label: { en: 'Dark', ru: 'Тёмный' }, icon: '🌙' },
  { id: 'futuristic', label: { en: 'Futuristic', ru: 'Футуризм' }, icon: '🚀' },
  { id: 'playful', label: { en: 'Playful', ru: 'Игривый' }, icon: '🎨' }
];

const MOOD_OPTIONS = [
  { id: 'luxury', label: { en: 'Luxury', ru: 'Люксовый' } },
  { id: 'friendly', label: { en: 'Friendly', ru: 'Дружелюбный' } },
  { id: 'tech', label: { en: 'Tech', ru: 'Технологичный' } },
  { id: 'youthful', label: { en: 'Youthful', ru: 'Молодёжный' } },
  { id: 'professional', label: { en: 'Professional', ru: 'Профессиональный' } },
  { id: 'creative', label: { en: 'Creative', ru: 'Креативный' } }
];

const BUSINESS_TYPES = [
  { id: 'tech', label: { en: 'Technology', ru: 'Технологии' } },
  { id: 'fashion', label: { en: 'Fashion', ru: 'Мода' } },
  { id: 'food', label: { en: 'Food & Restaurant', ru: 'Еда и рестораны' } },
  { id: 'fitness', label: { en: 'Fitness & Health', ru: 'Фитнес и здоровье' } },
  { id: 'education', label: { en: 'Education', ru: 'Образование' } },
  { id: 'beauty', label: { en: 'Beauty & Cosmetics', ru: 'Красота и косметика' } },
  { id: 'travel', label: { en: 'Travel', ru: 'Путешествия' } },
  { id: 'finance', label: { en: 'Finance', ru: 'Финансы' } },
  { id: 'other', label: { en: 'Other', ru: 'Другое' } }
];

export const BrandSettings = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
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
    fetchBrandProfile();
  }, []);

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

  const handleSave = async () => {
    if (!profile.brand_name.trim()) {
      toast.error(language === 'ru' ? 'Введите название бренда' : 'Please enter brand name');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/brand-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === 'ru' ? 'Профиль бренда сохранён' : 'Brand profile saved');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(language === 'ru' ? 'Удалить профиль бренда?' : 'Delete brand profile?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/brand-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        brand_name: '',
        primary_colors: ['#FF3B30', '#000000'],
        secondary_colors: ['#FFFFFF', '#808080'],
        preferred_styles: [],
        business_type: '',
        brand_mood: [],
        tagline: '',
        target_audience: ''
      });
      toast.success(language === 'ru' ? 'Профиль удалён' : 'Profile deleted');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Delete failed');
    }
  };

  const toggleStyle = (styleId) => {
    setProfile(prev => ({
      ...prev,
      preferred_styles: prev.preferred_styles.includes(styleId)
        ? prev.preferred_styles.filter(s => s !== styleId)
        : [...prev.preferred_styles, styleId].slice(0, 3)
    }));
  };

  const toggleMood = (moodId) => {
    setProfile(prev => ({
      ...prev,
      brand_mood: prev.brand_mood.includes(moodId)
        ? prev.brand_mood.filter(m => m !== moodId)
        : [...prev.brand_mood, moodId].slice(0, 3)
    }));
  };

  const updateColor = (type, index, color) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].map((c, i) => i === index ? color : c)
    }));
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
      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#111113] border-white/10">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <h2 className="text-xl font-bold text-white mb-2">
              {language === 'ru' ? 'Brand Profile доступен для Pro и Business' : 'Brand Profile available for Pro and Business'}
            </h2>
            <p className="text-gray-500 mb-6">
              {language === 'ru' 
                ? 'Создайте уникальный стиль бренда для всех ваших изображений'
                : 'Create a unique brand style for all your images'}
            </p>
            <Button className="bg-[#FF3B30] hover:bg-[#FF3B30]/90">
              {language === 'ru' ? 'Улучшить план' : 'Upgrade Plan'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Palette className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Настройки бренда' : 'Brand Settings'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {language === 'ru' ? 'Создайте уникальный стиль для ваших изображений' : 'Create a unique style for your images'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="bg-[#111113] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              {language === 'ru' ? 'Основная информация' : 'Basic Info'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">{language === 'ru' ? 'Название бренда' : 'Brand Name'} *</Label>
              <Input
                value={profile.brand_name}
                onChange={(e) => setProfile(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder={language === 'ru' ? 'Введите название' : 'Enter brand name'}
                className="bg-[#0A0A0B] border-white/10 text-white"
                data-testid="brand-name-input"
              />
            </div>

            <div>
              <Label className="text-white">{language === 'ru' ? 'Слоган' : 'Tagline'}</Label>
              <Input
                value={profile.tagline}
                onChange={(e) => setProfile(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder={language === 'ru' ? 'Ваш слоган' : 'Your tagline'}
                className="bg-[#0A0A0B] border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white">{language === 'ru' ? 'Тип бизнеса' : 'Business Type'}</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {BUSINESS_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={profile.business_type === type.id ? "default" : "outline"}
                    size="sm"
                    className={profile.business_type === type.id 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'border-white/20 text-gray-300 hover:bg-white/10'}
                    onClick={() => setProfile(prev => ({ ...prev, business_type: type.id }))}
                  >
                    {type.label[language] || type.label.en}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white">{language === 'ru' ? 'Целевая аудитория' : 'Target Audience'}</Label>
              <Textarea
                value={profile.target_audience}
                onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder={language === 'ru' ? 'Опишите вашу целевую аудиторию' : 'Describe your target audience'}
                className="bg-[#0A0A0B] border-white/10 text-white min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="bg-[#111113] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {language === 'ru' ? 'Цвета бренда' : 'Brand Colors'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">{language === 'ru' ? 'Основные цвета' : 'Primary Colors'}</Label>
              <div className="flex gap-4">
                {profile.primary_colors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor('primary_colors', index, e.target.value)}
                      className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white/20"
                    />
                    <span className="text-xs text-gray-500">{color}</span>
                  </div>
                ))}
                {profile.primary_colors.length < 3 && (
                  <Button
                    variant="outline"
                    className="w-16 h-16 border-dashed border-white/20 text-gray-500"
                    onClick={() => setProfile(prev => ({ 
                      ...prev, 
                      primary_colors: [...prev.primary_colors, '#808080'] 
                    }))}
                  >
                    +
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-white mb-3 block">{language === 'ru' ? 'Дополнительные цвета' : 'Secondary Colors'}</Label>
              <div className="flex gap-4">
                {profile.secondary_colors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor('secondary_colors', index, e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                    />
                    <span className="text-xs text-gray-500">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-4">
              <Label className="text-white mb-2 block">{language === 'ru' ? 'Предпросмотр' : 'Preview'}</Label>
              <div 
                className="h-20 rounded-xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${profile.primary_colors[0]} 0%, ${profile.primary_colors[1] || profile.primary_colors[0]} 100%)` 
                }}
              >
                <span 
                  className="font-bold text-lg px-4 py-2 rounded-lg"
                  style={{ 
                    color: profile.secondary_colors[0],
                    backgroundColor: `${profile.secondary_colors[1]}40`
                  }}
                >
                  {profile.brand_name || 'Your Brand'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Styles */}
        <Card className="bg-[#111113] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              {language === 'ru' ? 'Предпочитаемые стили' : 'Preferred Styles'}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {language === 'ru' ? 'Выберите до 3 стилей' : 'Select up to 3 styles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <Button
                  key={style.id}
                  variant={profile.preferred_styles.includes(style.id) ? "default" : "outline"}
                  className={`justify-start ${
                    profile.preferred_styles.includes(style.id)
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => toggleStyle(style.id)}
                  data-testid={`style-${style.id}`}
                >
                  <span className="mr-2">{style.icon}</span>
                  {style.label[language] || style.label.en}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <Card className="bg-[#111113] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-400" />
              {language === 'ru' ? 'Атмосфера бренда' : 'Brand Mood'}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {language === 'ru' ? 'Выберите до 3 характеристик' : 'Select up to 3 characteristics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <Button
                  key={mood.id}
                  variant={profile.brand_mood.includes(mood.id) ? "default" : "outline"}
                  className={`justify-start ${
                    profile.brand_mood.includes(mood.id)
                      ? 'bg-pink-600 hover:bg-pink-700'
                      : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => toggleMood(mood.id)}
                  data-testid={`mood-${mood.id}`}
                >
                  {mood.label[language] || mood.label.en}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6"
          onClick={handleSave}
          disabled={saving}
          data-testid="save-brand-btn"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {language === 'ru' ? 'Сохранить профиль' : 'Save Profile'}
        </Button>
        
        {profile.brand_name && (
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={handleDelete}
            data-testid="delete-brand-btn"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
