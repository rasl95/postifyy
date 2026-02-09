import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { 
  Copy, Loader2, Sparkles, Check, Zap, Star, Lock, Shield, Rocket,
  MessageSquare, Video, Package, RefreshCw, Wand2, Target, Globe,
  ArrowRight, Image, Share2, Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LimitReachedModal } from '../components/LimitReachedModal';
import { GenerationProgress } from '../components/GenerationProgress';
import { PresetTemplates } from '../components/PresetTemplates';
import { QuickActions } from '../components/QuickActions';
import { useAnalytics } from '../hooks/useAnalytics';
import { useShare } from '../hooks/useShare';
import { useAutosave, AutosaveIndicator } from '../hooks/useAutosave';
import { ShareFirstPostModal } from '../components/ShareFirstPostModal';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const FIRST_SHARE_SHOWN_KEY = 'postify_first_share_shown';

export const ContentGenerator = () => {
  const { token, checkAuth, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackGeneration, trackTemplate, trackFavorite, trackInteraction, trackUpgrade } = useAnalytics();
  const { shareContent, isNativeShareAvailable } = useShare();
  const initialTab = searchParams.get('tab') || 'social_post';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showShareFirstPost, setShowShareFirstPost] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState(language);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Autosave integration
  const initialFormData = {
    // Common
    topic: '',
    tone: 'neutral',
    target_audience: '',
    // Social Post
    platform: 'instagram',
    include_hashtags: true,
    post_goal: 'none',
    // Video Ideas
    niche: '',
    video_goal: 'views',
    // Product Description
    product_name: '',
    key_benefits: ''
  };
  
  // Unified form data with autosave
  const { 
    data: formData, 
    updateData: updateFormData, 
    isSaving, 
    lastSaved, 
    isRestored,
    clearDraft 
  } = useAutosave(`content_${activeTab}`, initialFormData, 3000);

  // Local form state setter that syncs with autosave
  const setFormData = useCallback((updater) => {
    if (typeof updater === 'function') {
      updateFormData(updater(formData));
    } else {
      updateFormData(updater);
    }
  }, [formData, updateFormData]);

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isBusiness = user?.subscription_plan === 'business';
  const remaining = (user?.monthly_limit || 3) - (user?.current_usage || 0);
  const usagePercent = ((user?.current_usage || 0) / (user?.monthly_limit || 3)) * 100;

  // Show restored draft notification
  useEffect(() => {
    if (isRestored && formData.topic) {
      toast.info(language === 'ru' ? 'Черновик восстановлен' : 'Draft restored', {
        icon: <Save className="w-4 h-4" />,
        duration: 3000
      });
    }
  }, [isRestored]);

  // Sync output language with UI language on mount
  useEffect(() => {
    setOutputLanguage(language);
  }, [language]);

  // Check if result is favorite
  useEffect(() => {
    const checkFavorite = async () => {
      if (result?.generation_id && isPro) {
        try {
          const response = await axios.get(
            `${API_URL}/api/favorites/check/${result.generation_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsFavorite(response.data.is_favorite);
        } catch (error) {
          console.error('Failed to check favorite:', error);
        }
      }
    };
    checkFavorite();
  }, [result, token, isPro]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    trackTemplate(template.id, 'selected');
    // Apply template settings to form
    if (template.tone) {
      setFormData(prev => ({ ...prev, tone: template.tone }));
    }
    if (template.goal) {
      setFormData(prev => ({ ...prev, goal: template.goal }));
    }
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'social_post', 
      label: language === 'ru' ? 'Посты' : 'Posts',
      icon: MessageSquare,
      generateLabel: language === 'ru' ? '✨ Создать пост' : '✨ Create Post',
      description: language === 'ru' ? 'Instagram, TikTok, Telegram' : 'Instagram, TikTok, Telegram'
    },
    { 
      id: 'video_idea', 
      label: language === 'ru' ? 'Видео' : 'Video',
      icon: Video,
      generateLabel: language === 'ru' ? '🔥 Сгенерировать идеи' : '🔥 Generate Ideas',
      description: language === 'ru' ? 'Идеи для Reels и TikTok' : 'Reels & TikTok ideas'
    },
    { 
      id: 'product_description', 
      label: language === 'ru' ? 'Продукт' : 'Product',
      icon: Package,
      generateLabel: language === 'ru' ? '📦 Описать продукт' : '📦 Describe Product',
      description: language === 'ru' ? 'Продающие описания' : 'Sales descriptions'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  // Templates for quick start
  const templates = {
    social_post: [
      {
        id: 'product_launch',
        icon: '🚀',
        label: language === 'ru' ? 'Запуск продукта' : 'Product Launch',
        desc: language === 'ru' ? 'Instagram, продающий' : 'Instagram, selling',
        values: { topic: language === 'ru' ? 'Запуск нового продукта' : 'New product launch', platform: 'instagram', tone: 'selling', post_goal: 'sell' }
      },
      {
        id: 'engagement',
        icon: '💬',
        label: language === 'ru' ? 'Вовлечение' : 'Engagement',
        desc: language === 'ru' ? 'TikTok, забавный' : 'TikTok, funny',
        values: { topic: language === 'ru' ? 'Интересный факт о бренде' : 'Interesting brand fact', platform: 'tiktok', tone: 'funny', post_goal: 'comments' }
      },
      {
        id: 'personal_brand',
        icon: '👤',
        label: language === 'ru' ? 'Личный бренд' : 'Personal Brand',
        desc: language === 'ru' ? 'Instagram, вдохновляющий' : 'Instagram, inspiring',
        values: { topic: language === 'ru' ? 'Моя история успеха' : 'My success story', platform: 'instagram', tone: 'inspiring', post_goal: 'likes' }
      },
      {
        id: 'announcement',
        icon: '📢',
        label: language === 'ru' ? 'Анонс' : 'Announcement',
        desc: language === 'ru' ? 'Telegram, нейтральный' : 'Telegram, neutral',
        values: { topic: language === 'ru' ? 'Важное обновление' : 'Important update', platform: 'telegram', tone: 'neutral', post_goal: 'none' }
      }
    ],
    video_idea: [
      {
        id: 'viral_reel',
        icon: '🔥',
        label: language === 'ru' ? 'Вирусный Reel' : 'Viral Reel',
        desc: language === 'ru' ? 'Просмотры, забавный' : 'Views, funny',
        values: { niche: language === 'ru' ? 'Лайфхаки' : 'Life hacks', video_goal: 'views', tone: 'funny' }
      },
      {
        id: 'educational',
        icon: '📚',
        label: language === 'ru' ? 'Обучающий' : 'Educational',
        desc: language === 'ru' ? 'Подписчики, экспертный' : 'Followers, expert',
        values: { niche: language === 'ru' ? 'Полезные советы' : 'Useful tips', video_goal: 'followers', tone: isPro ? 'expert' : 'neutral' }
      },
      {
        id: 'sales_video',
        icon: '💰',
        label: language === 'ru' ? 'Продающий' : 'Sales Video',
        desc: language === 'ru' ? 'Продажи, продающий' : 'Sales, selling',
        values: { niche: language === 'ru' ? 'Обзор продукта' : 'Product review', video_goal: 'sales', tone: 'selling' }
      },
      {
        id: 'trending',
        icon: '📈',
        label: language === 'ru' ? 'Трендовый' : 'Trending',
        desc: language === 'ru' ? 'Вовлечение, смелый' : 'Engagement, bold',
        values: { niche: language === 'ru' ? 'Тренды недели' : 'Weekly trends', video_goal: 'engagement', tone: isPro ? 'bold' : 'neutral' }
      }
    ],
    product_description: [
      {
        id: 'tech_product',
        icon: '📱',
        label: language === 'ru' ? 'Техника' : 'Tech Product',
        desc: language === 'ru' ? 'Нейтральный, детальный' : 'Neutral, detailed',
        values: { product_name: language === 'ru' ? 'Умное устройство' : 'Smart Device', tone: 'neutral', key_benefits: language === 'ru' ? 'Инновационные технологии, удобство использования' : 'Innovative technology, ease of use' }
      },
      {
        id: 'fashion',
        icon: '👗',
        label: language === 'ru' ? 'Мода' : 'Fashion',
        desc: language === 'ru' ? 'Вдохновляющий, стильный' : 'Inspiring, stylish',
        values: { product_name: language === 'ru' ? 'Коллекция одежды' : 'Clothing Collection', tone: 'inspiring', key_benefits: language === 'ru' ? 'Премиальные материалы, уникальный дизайн' : 'Premium materials, unique design' }
      },
      {
        id: 'service',
        icon: '🎯',
        label: language === 'ru' ? 'Услуга' : 'Service',
        desc: language === 'ru' ? 'Продающий, убедительный' : 'Selling, persuasive',
        values: { product_name: language === 'ru' ? 'Консультация или курс' : 'Consultation or Course', tone: 'selling', key_benefits: language === 'ru' ? 'Результат гарантирован, поддержка 24/7' : 'Results guaranteed, 24/7 support' }
      },
      {
        id: 'food',
        icon: '🍕',
        label: language === 'ru' ? 'Еда' : 'Food',
        desc: language === 'ru' ? 'Забавный, аппетитный' : 'Funny, appetizing',
        values: { product_name: language === 'ru' ? 'Новое блюдо меню' : 'New Menu Item', tone: 'funny', key_benefits: language === 'ru' ? 'Свежие ингредиенты, авторский рецепт' : 'Fresh ingredients, signature recipe' }
      }
    ]
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      ...template.values,
      target_audience: ''
    }));
    toast.success(language === 'ru' ? `Шаблон "${template.label}" применён` : `Template "${template.label}" applied`);
  };

  // Tones
  const basicTones = [
    { value: 'neutral', label: t('tones.neutral') },
    { value: 'selling', label: t('tones.selling') },
    { value: 'funny', label: t('tones.funny') },
    { value: 'inspiring', label: t('tones.inspiring') }
  ];

  const extendedTones = [
    { value: 'expert', label: t('tones.expert') },
    { value: 'bold', label: t('tones.bold') },
    { value: 'ironic', label: t('tones.ironic') },
    { value: 'provocative', label: t('tones.provocative') }
  ];

  const allTones = isPro ? [...basicTones, ...extendedTones] : basicTones;

  // Post goals
  const postGoals = [
    { value: 'none', label: t('postGoals.none') },
    { value: 'sell', label: t('postGoals.sell') },
    { value: 'likes', label: t('postGoals.likes') },
    { value: 'comments', label: t('postGoals.comments') },
    { value: 'dm', label: t('postGoals.dm') }
  ];

  // Video goals
  const videoGoals = [
    { value: 'views', label: language === 'ru' ? 'Просмотры' : 'Views' },
    { value: 'followers', label: language === 'ru' ? 'Подписчики' : 'Followers' },
    { value: 'engagement', label: language === 'ru' ? 'Вовлечение' : 'Engagement' },
    { value: 'sales', label: language === 'ru' ? 'Продажи' : 'Sales' }
  ];

  const handleGenerate = async (regenerate = false, modifier = null) => {
    // Validation
    if (activeTab === 'social_post' && !formData.topic.trim()) {
      toast.error(language === 'ru' ? 'Введите тему поста' : 'Please enter a topic');
      return;
    }
    if (activeTab === 'video_idea' && !formData.niche.trim()) {
      toast.error(language === 'ru' ? 'Введите нишу' : 'Please enter a niche');
      return;
    }
    if (activeTab === 'product_description' && !formData.product_name.trim()) {
      toast.error(language === 'ru' ? 'Введите название продукта' : 'Please enter product name');
      return;
    }

    setLoading(true);
    if (!regenerate) setResult(null);
    setIsFavorite(false);

    // Build request based on content type
    let requestData = {
      content_type: activeTab,
      tone: modifier === 'selling' ? 'selling' : formData.tone,
      target_audience: formData.target_audience || null,
      language: outputLanguage
    };

    if (activeTab === 'social_post') {
      requestData = {
        ...requestData,
        topic: formData.topic,
        platform: formData.platform,
        include_hashtags: formData.include_hashtags,
        post_goal: formData.post_goal !== 'none' ? formData.post_goal : null
      };
    } else if (activeTab === 'video_idea') {
      requestData = {
        ...requestData,
        topic: formData.niche,
        niche: formData.niche,
        goal: formData.video_goal
      };
    } else if (activeTab === 'product_description') {
      requestData = {
        ...requestData,
        topic: formData.product_name,
        product_name: formData.product_name,
        key_benefits: formData.key_benefits || null
      };
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/generate`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult({
        ...response.data,
        meta: {
          type: activeTab,
          platform: formData.platform,
          tone: formData.tone,
          goal: activeTab === 'social_post' ? formData.post_goal : formData.video_goal
        }
      });
      
      // Track successful generation
      trackGeneration(activeTab, true, { 
        tone: formData.tone,
        platform: formData.platform,
        tokens: response.data.tokens_used 
      });
      
      // Clear draft after successful generation
      await clearDraft();
      
      const successMessages = {
        social_post: language === 'ru' ? 'Пост создан!' : 'Post created!',
        video_idea: language === 'ru' ? 'Идеи готовы!' : 'Ideas ready!',
        product_description: language === 'ru' ? 'Описание готово!' : 'Description ready!'
      };
      toast.success(successMessages[activeTab]);
      await checkAuth();
    } catch (error) {
      trackGeneration(activeTab, false, { error: error.response?.data?.detail });
      if (error.response?.status === 403) {
        await checkAuth();
        setShowLimitModal(true);
      } else {
        toast.error(error.response?.data?.detail || (language === 'ru' ? 'Ошибка генерации' : 'Generation failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    let textToCopy = result.content;
    if (result.watermark) {
      textToCopy += '\n\n— Created with Postify AI';
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    trackInteraction('copy', result?.generation_id, activeTab);
    toast.success(t('generator.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (result?.content) {
      await shareContent(result.content, 'Postify AI - Generated Content');
      trackInteraction('share', result?.generation_id, activeTab);
    }
  };

  const toggleFavorite = async () => {
    if (!isPro) {
      trackUpgrade('favorites_button', 'free');
      toast.error(t('favorites.proOnly'));
      return;
    }
    if (!result?.generation_id) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const favResponse = await axios.get(`${API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fav = favResponse.data.items.find(f => f.generation_id === result.generation_id);
        if (fav) {
          await axios.delete(`${API_URL}/api/favorites/${fav.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsFavorite(false);
          toast.success(t('favorites.removed'));
        }
      } else {
        await axios.post(
          `${API_URL}/api/favorites`,
          { generation_id: result.generation_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFavorite(true);
        toast.success(t('favorites.added'));
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getToneLabel = (toneValue) => {
    const tone = allTones.find(t => t.value === toneValue);
    return tone?.label || toneValue;
  };

  const getPlatformLabel = (platform) => {
    const platforms = {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      telegram: 'Telegram'
    };
    return platforms[platform] || platform;
  };

  const getGoalLabel = (goal) => {
    if (!goal || goal === 'none') return null;
    const goalItem = postGoals.find(g => g.value === goal);
    return goalItem?.label || goal;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Generation Progress Overlay */}
      <GenerationProgress isLoading={loading} type="content" />

      {/* Header with Usage */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Создать контент' : 'Create Content'}
          </h1>
          <p className="text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            {language === 'ru' ? 'AI-генерация для ваших соцсетей' : 'AI generation for your social media'}
          </p>
        </div>
        
        {/* Usage Progress */}
        <div className="bg-gradient-to-br from-[#1A1A1C] to-[#111113] rounded-2xl p-5 border border-white/10 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">{language === 'ru' ? 'Использовано' : 'Used'}</span>
            <span className="text-sm font-medium text-white">
              {user?.current_usage || 0} / {user?.monthly_limit || 3}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Zap className="w-3 h-3 text-[#FF3B30]" />
              <span>
                {language === 'ru' 
                  ? `Осталось ${remaining} генераций`
                  : `${remaining} generations left`
                }
              </span>
              {!isPro && (
                <>
                  <span className="text-gray-600">·</span>
                  <button 
                    onClick={() => window.location.href = '/settings'}
                    className="text-[#FF3B30] hover:underline flex items-center gap-1"
                  >
                    {language === 'ru' ? 'Разблокировать' : 'Unlock full access'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            {/* Autosave indicator */}
            <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} language={language} />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="bg-gradient-to-br from-[#131315] to-[#0D0D0F] border-white/10 overflow-hidden">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResult(null); }} className="w-full">
          <div className="border-b border-white/10 px-6 pt-6">
            <TabsList className="bg-transparent border-none gap-2 p-0 h-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    flex items-center gap-2 px-5 py-3 rounded-t-xl border-b-2 transition-all
                    data-[state=active]:bg-[#1A1A1C] data-[state=active]:border-[#FF3B30] data-[state=active]:text-white
                    data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-300
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Language Selector */}
            <div className="flex items-center justify-between p-4 bg-[#0A0A0B] rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Язык результата' : 'Output language'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOutputLanguage('ru')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    outputLanguage === 'ru' 
                      ? 'bg-[#FF3B30] text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  🇷🇺 RU
                </button>
                <button
                  onClick={() => setOutputLanguage('en')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    outputLanguage === 'en' 
                      ? 'bg-[#FF3B30] text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            {/* Quick Templates - Using PresetTemplates component */}
            <PresetTemplates 
              contentType={activeTab}
              onSelect={handleTemplateSelect}
              selectedId={selectedTemplate}
              compact={false}
            />

            {/* Social Post Form */}
            <TabsContent value="social_post" className="space-y-5 mt-0">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'О чём пост?' : 'What is the post about?'} *
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: запуск нового продукта' : 'E.g.: new product launch'}
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">{language === 'ru' ? 'Платформа' : 'Platform'}</Label>
                  <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                    <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10">
                      <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                      <SelectItem value="tiktok" className="text-white">TikTok</SelectItem>
                      <SelectItem value="telegram" className="text-white">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">{language === 'ru' ? 'Тон' : 'Tone'}</Label>
                  <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                    <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10">
                      {allTones.map(tone => (
                        <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Post Goal - Pro Feature */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-gray-300 text-sm">{t('postGoals.label')}</Label>
                  {!isPro && (
                    <span className="flex items-center gap-1 text-xs text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Pro
                    </span>
                  )}
                </div>
                <Select 
                  value={formData.post_goal} 
                  onValueChange={(v) => setFormData({ ...formData, post_goal: v })}
                  disabled={!isPro}
                >
                  <SelectTrigger className={`bg-[#0A0A0B] border-white/10 text-white h-12 ${!isPro ? 'opacity-50' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10">
                    {postGoals.map(goal => (
                      <SelectItem key={goal.value} value={goal.value} className="text-white">{goal.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Целевая аудитория' : 'Target audience'} 
                  <span className="text-gray-600 ml-1">({language === 'ru' ? 'опционально' : 'optional'})</span>
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: предприниматели 25-40 лет' : 'E.g.: entrepreneurs 25-40'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12"
                />
              </div>
            </TabsContent>

            {/* Video Ideas Form */}
            <TabsContent value="video_idea" className="space-y-5 mt-0">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Ниша или тема' : 'Niche or topic'} *
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: фитнес, кулинария, бизнес' : 'E.g.: fitness, cooking, business'}
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">{language === 'ru' ? 'Цель видео' : 'Video goal'}</Label>
                  <Select value={formData.video_goal} onValueChange={(v) => setFormData({ ...formData, video_goal: v })}>
                    <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10">
                      {videoGoals.map(goal => (
                        <SelectItem key={goal.value} value={goal.value} className="text-white">{goal.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 text-sm mb-2 block">{language === 'ru' ? 'Тон' : 'Tone'}</Label>
                  <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                    <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10">
                      {allTones.map(tone => (
                        <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Целевая аудитория' : 'Target audience'} 
                  <span className="text-gray-600 ml-1">({language === 'ru' ? 'опционально' : 'optional'})</span>
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: начинающие блогеры' : 'E.g.: beginner bloggers'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12"
                />
              </div>
            </TabsContent>

            {/* Product Description Form */}
            <TabsContent value="product_description" className="space-y-5 mt-0">
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Название продукта' : 'Product name'} *
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: Умные часы FitMax Pro' : 'E.g.: FitMax Pro Smartwatch'}
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12 text-base"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">{language === 'ru' ? 'Тон описания' : 'Description tone'}</Label>
                <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                  <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10">
                    {allTones.map(tone => (
                      <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Целевой клиент' : 'Target customer'} 
                  <span className="text-gray-600 ml-1">({language === 'ru' ? 'опционально' : 'optional'})</span>
                </Label>
                <Input
                  placeholder={language === 'ru' ? 'Например: активные люди 25-45 лет' : 'E.g.: active people 25-45'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white h-12"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-2 block">
                  {language === 'ru' ? 'Ключевые преимущества' : 'Key benefits'} 
                  <span className="text-gray-600 ml-1">({language === 'ru' ? 'опционально' : 'optional'})</span>
                </Label>
                <Textarea
                  placeholder={language === 'ru' ? 'Например: долгая батарея, водонепроницаемость, точный GPS' : 'E.g.: long battery, waterproof, accurate GPS'}
                  value={formData.key_benefits}
                  onChange={(e) => setFormData({ ...formData, key_benefits: e.target.value })}
                  className="bg-[#0A0A0B] border-white/10 text-white min-h-[80px]"
                />
              </div>
            </TabsContent>

            {/* Generate Button */}
            <Button
              onClick={() => handleGenerate()}
              disabled={loading || (user && user.current_usage >= user.monthly_limit)}
              className="w-full h-14 bg-gradient-to-r from-[#FF3B30] to-[#FF5545] hover:from-[#FF4D42] hover:to-[#FF6655] text-white font-bold text-lg shadow-lg shadow-[#FF3B30]/30 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isBusiness ? t('priority.processing') : (language === 'ru' ? 'Генерация...' : 'Generating...')}
                </>
              ) : (
                <>
                  {isBusiness && <Rocket className="w-5 h-5 mr-2" />}
                  {currentTab?.generateLabel}
                  {isBusiness && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {t('priority.badge')}
                    </span>
                  )}
                </>
              )}
            </Button>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FF3B30]" />
                {t('trust.fastGeneration')}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                {t('trust.noStorage')}
              </span>
              {isBusiness && (
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Rocket className="w-3.5 h-3.5" />
                  {t('priority.enhanced')}
                </span>
              )}
            </div>
          </CardContent>
        </Tabs>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="bg-gradient-to-br from-[#131315] to-[#0D0D0F] border-white/10 overflow-hidden">
          {/* Result Header with Context */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {language === 'ru' ? 'Результат' : 'Result'}
                    {result.priority_processed && (
                      <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        <Rocket className="w-3 h-3" />
                        {t('priority.processed')}
                      </span>
                    )}
                  </h3>
                  {/* Context Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                    {result.meta?.platform && (
                      <span className="bg-white/5 px-2 py-1 rounded">{getPlatformLabel(result.meta.platform)}</span>
                    )}
                    <span className="bg-white/5 px-2 py-1 rounded">{getToneLabel(result.meta?.tone || formData.tone)}</span>
                    {getGoalLabel(result.meta?.goal) && (
                      <span className="bg-white/5 px-2 py-1 rounded">{getGoalLabel(result.meta.goal)}</span>
                    )}
                    <span className="bg-white/5 px-2 py-1 rounded">{outputLanguage === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading || !isPro}
                  className={`${isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:bg-white/10`}
                  title={isPro ? (isFavorite ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')) : t('favorites.proOnly')}
                  data-testid="result-favorite-btn"
                >
                  {favoriteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                  )}
                  {!isPro && <Lock className="w-3 h-3 ml-1" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="result-copy-btn"
                >
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? (language === 'ru' ? 'Скопировано' : 'Copied') : t('generator.copy')}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="result-share-btn"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Поделиться' : 'Share'}
                </Button>
              </div>
            </div>
          </div>

          {/* Result Content */}
          <CardContent className="p-6">
            <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5 whitespace-pre-wrap text-gray-200 leading-relaxed text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
              {result.content}
              {result.watermark && (
                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500 italic" data-testid="watermark-text">
                  {language === 'ru' ? 'Создано с помощью Postify AI' : 'Created with Postify AI'}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Перегенерировать' : 'Regenerate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Улучшить' : 'Improve'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true, 'selling')}
                disabled={loading}
                className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Сделать продающим' : 'Make it sell'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/images?prompt=${encodeURIComponent(formData.topic || result.content?.slice(0, 100))}`)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                data-testid="generate-brand-image-btn"
              >
                <Image className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Создать изображение' : 'Generate Brand Image'}
              </Button>
            </div>

            {/* Meta info */}
            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span>{language === 'ru' ? 'Токенов' : 'Tokens'}: {result.tokens_used}</span>
              <span>{language === 'ru' ? 'Осталось' : 'Remaining'}: {result.remaining_usage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentUsage={user?.current_usage || 0}
        monthlyLimit={user?.monthly_limit || 3}
      />

      {/* Mobile Sticky Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent md:hidden z-30">
        <Button
          className="w-full bg-gradient-to-r from-[#FF3B30] to-[#FF6B47] hover:from-[#E62D22] hover:to-[#FF5534] text-white py-6 text-lg font-semibold rounded-2xl shadow-lg shadow-[#FF3B30]/30"
          onClick={() => handleGenerate()}
          disabled={loading || !formData.topic.trim()}
          data-testid="mobile-generate-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {language === 'ru' ? 'Создаём...' : 'Creating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {tabs.find(t => t.id === activeTab)?.generateLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
