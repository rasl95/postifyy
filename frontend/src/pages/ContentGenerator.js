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
      
      // Show "Share your first post" modal for first-time generation
      const wasUsage = user?.current_usage || 0;
      const firstShareShown = sessionStorage.getItem(FIRST_SHARE_SHOWN_KEY);
      if (wasUsage <= 1 && !firstShareShown) {
        setTimeout(() => {
          setShowShareFirstPost(true);
          sessionStorage.setItem(FIRST_SHARE_SHOWN_KEY, 'true');
        }, 1500);
      }
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
    <div className="max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Generation Progress Overlay */}
      <GenerationProgress isLoading={loading} type="content" />

      {/* Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {language === 'ru' ? 'Создать контент' : 'Create Content'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {remaining} {language === 'ru' ? 'генераций осталось' : 'generations left'}
            {!isPro && (
              <button onClick={() => navigate('/pricing')} className="text-[#FF3B30] ml-2 hover:underline">
                {language === 'ru' ? 'Улучшить' : 'Upgrade'}
              </button>
            )}
          </p>
        </div>
        {/* Language toggle — inline */}
        <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => setOutputLanguage('ru')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              outputLanguage === 'ru' ? 'bg-[#FF3B30] text-white' : 'text-gray-500 hover:text-white'
            }`}
          >RU</button>
          <button
            onClick={() => setOutputLanguage('en')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              outputLanguage === 'en' ? 'bg-[#FF3B30] text-white' : 'text-gray-500 hover:text-white'
            }`}
          >EN</button>
        </div>
      </div>

      {/* 3 Goal Tabs — primary focus */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResult(null); }}>
        <TabsList className="bg-[#111113] border border-white/[0.06] p-1 rounded-xl h-12 w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg text-sm data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white data-[state=inactive]:text-gray-500"
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Form — no Card wrapper, just clean fields */}
        <div className="space-y-4 mt-5">
          {/* Autosave indicator */}
          <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} language={language} />

          {/* Social Post Form */}
          <TabsContent value="social_post" className="space-y-4 mt-0">
            <div>
              <Input
                placeholder={language === 'ru' ? 'О чём пост? *' : 'What is the post about? *'}
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="bg-[#111113] border-white/[0.06] text-white h-12 text-base"
                data-testid="topic-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                  <SelectValue placeholder={language === 'ru' ? 'Платформа' : 'Platform'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1C] border-white/10">
                  <SelectItem value="instagram" className="text-white">Instagram</SelectItem>
                  <SelectItem value="tiktok" className="text-white">TikTok</SelectItem>
                  <SelectItem value="telegram" className="text-white">Telegram</SelectItem>
                </SelectContent>
              </Select>

              <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                  <SelectValue placeholder={language === 'ru' ? 'Тон' : 'Tone'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1C] border-white/10">
                  {allTones.map(tone => (
                    <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collapsible extras */}
            <details className="group">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                {language === 'ru' ? 'Ещё настройки' : 'More options'}
              </summary>
              <div className="space-y-3 mt-3">
                {isPro && (
                  <Select value={formData.post_goal} onValueChange={(v) => setFormData({ ...formData, post_goal: v })}>
                    <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                      <SelectValue placeholder={t('postGoals.label')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10">
                      {postGoals.map(goal => (
                        <SelectItem key={goal.value} value={goal.value} className="text-white">{goal.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  placeholder={language === 'ru' ? 'Целевая аудитория (опционально)' : 'Target audience (optional)'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#111113] border-white/[0.06] text-white h-11"
                />
              </div>
            </details>
          </TabsContent>

          {/* Video Ideas Form */}
          <TabsContent value="video_idea" className="space-y-4 mt-0">
            <Input
              placeholder={language === 'ru' ? 'Ниша или тема *' : 'Niche or topic *'}
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="bg-[#111113] border-white/[0.06] text-white h-12 text-base"
              data-testid="niche-input"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.video_goal} onValueChange={(v) => setFormData({ ...formData, video_goal: v })}>
                <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                  <SelectValue placeholder={language === 'ru' ? 'Цель' : 'Goal'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1C] border-white/10">
                  {videoGoals.map(goal => (
                    <SelectItem key={goal.value} value={goal.value} className="text-white">{goal.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                  <SelectValue placeholder={language === 'ru' ? 'Тон' : 'Tone'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1C] border-white/10">
                  {allTones.map(tone => (
                    <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <details className="group">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                {language === 'ru' ? 'Ещё настройки' : 'More options'}
              </summary>
              <div className="mt-3">
                <Input
                  placeholder={language === 'ru' ? 'Целевая аудитория (опционально)' : 'Target audience (optional)'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#111113] border-white/[0.06] text-white h-11"
                />
              </div>
            </details>
          </TabsContent>

          {/* Product Description Form */}
          <TabsContent value="product_description" className="space-y-4 mt-0">
            <Input
              placeholder={language === 'ru' ? 'Название продукта *' : 'Product name *'}
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="bg-[#111113] border-white/[0.06] text-white h-12 text-base"
              data-testid="product-input"
            />
            <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
              <SelectTrigger className="bg-[#111113] border-white/[0.06] text-white h-11">
                <SelectValue placeholder={language === 'ru' ? 'Тон описания' : 'Description tone'} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10">
                {allTones.map(tone => (
                  <SelectItem key={tone.value} value={tone.value} className="text-white">{tone.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <details className="group">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                {language === 'ru' ? 'Ещё настройки' : 'More options'}
              </summary>
              <div className="space-y-3 mt-3">
                <Input
                  placeholder={language === 'ru' ? 'Целевой клиент (опционально)' : 'Target customer (optional)'}
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="bg-[#111113] border-white/[0.06] text-white h-11"
                />
                <Textarea
                  placeholder={language === 'ru' ? 'Ключевые преимущества (опционально)' : 'Key benefits (optional)'}
                  value={formData.key_benefits}
                  onChange={(e) => setFormData({ ...formData, key_benefits: e.target.value })}
                  className="bg-[#111113] border-white/[0.06] text-white min-h-[72px] resize-none"
                />
              </div>
            </details>
          </TabsContent>

          {/* Generate Button — desktop */}
          <Button
            onClick={() => handleGenerate()}
            disabled={loading || (user && user.current_usage >= user.monthly_limit)}
            className="w-full h-14 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-semibold text-base shadow-lg shadow-[#FF3B30]/20 hidden md:flex"
            data-testid="desktop-generate-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {language === 'ru' ? 'Создаём...' : 'Creating...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {currentTab?.generateLabel}
              </>
            )}
          </Button>
        </div>
      </Tabs>

      {/* Templates — collapsed section */}
      {!result && (
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer py-2">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5" />
              {language === 'ru' ? 'Шаблоны для быстрого старта' : 'Quick start templates'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-600 transition-transform group-open:rotate-90" />
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(templates[activeTab] || []).map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => applyTemplate(tmpl)}
                className="text-left p-3 rounded-xl bg-[#111113] border border-white/[0.06] hover:border-white/15 transition-colors"
              >
                <span className="text-sm mb-0.5 block">{tmpl.icon} {tmpl.label}</span>
                <span className="text-[11px] text-gray-600">{tmpl.desc}</span>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF3B30]" />
              <span className="text-sm font-medium text-white">
                {language === 'ru' ? 'Результат' : 'Result'}
              </span>
              {result.meta?.platform && (
                <span className="text-xs text-gray-600">{getPlatformLabel(result.meta.platform)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading || !isPro}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}
                data-testid="result-favorite-btn"
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="result-share-btn"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="result-copy-btn"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 whitespace-pre-wrap text-gray-200 leading-relaxed text-sm">
            {result.content}
            {result.watermark && (
              <div className="mt-4 pt-3 border-t border-white/[0.04] text-xs text-gray-600 italic" data-testid="watermark-text">
                {language === 'ru' ? 'Создано с помощью Postify AI' : 'Created with Postify AI'}
              </div>
            )}
          </div>

          {/* Quick actions — compact */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleGenerate(true)} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <RefreshCw className="w-3 h-3" /> {language === 'ru' ? 'Перегенерировать' : 'Regenerate'}
            </button>
            <button onClick={() => handleGenerate(true, 'selling')} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <Target className="w-3 h-3" /> {language === 'ru' ? 'Продающий' : 'Make it sell'}
            </button>
            <button onClick={() => navigate(`/images?prompt=${encodeURIComponent(formData.topic || result.content?.slice(0, 100))}`)}
              className="flex items-center gap-1.5 text-xs text-[#FF3B30] hover:text-white px-3 py-2 rounded-lg bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 transition-colors"
              data-testid="generate-brand-image-btn">
              <Image className="w-3 h-3" /> {language === 'ru' ? 'Создать изображение' : 'Generate image'}
            </button>
          </div>

          {/* Meta */}
          <p className="text-[11px] text-gray-600">
            {result.tokens_used} tokens · {result.remaining_usage} {language === 'ru' ? 'осталось' : 'remaining'}
          </p>
        </div>
      )}

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentUsage={user?.current_usage || 0}
        monthlyLimit={user?.monthly_limit || 3}
      />

      <ShareFirstPostModal
        isOpen={showShareFirstPost}
        onClose={() => setShowShareFirstPost(false)}
        generatedContent={result?.content}
        contentType={activeTab}
        generationId={result?.id}
      />

      {/* Mobile Sticky Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent md:hidden z-30" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <Button
          className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-white h-13 text-base font-semibold rounded-xl shadow-lg shadow-[#FF3B30]/20"
          onClick={() => handleGenerate()}
          disabled={loading}
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
              {currentTab?.generateLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
