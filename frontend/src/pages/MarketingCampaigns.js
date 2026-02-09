import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Sparkles, Zap, Target, TrendingUp, Users, Calendar, 
  ChevronRight, ChevronDown, Copy, RefreshCw, Loader2, 
  Check, Lock, ArrowRight, BarChart3, Award, BookOpen,
  DollarSign, Heart, User, Trash2, Plus, Play, Edit2,
  Instagram, Youtube, MessageCircle, Clock, Star, Share2, Link2, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Pillar icons mapping
const pillarIcons = {
  education: BookOpen,
  sales: DollarSign,
  engagement: Heart,
  authority: Award,
  personal: User
};

// Platform icons
const platformIcons = {
  instagram: Instagram,
  youtube: Youtube,
  telegram: MessageCircle,
  tiktok: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
};

export const MarketingCampaigns = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareStats, setShareStats] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    business_type: 'expert',
    primary_goal: 'growth',
    duration_days: 7,
    platforms: ['instagram'],
    topic: '',
    target_audience: ''
  });

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isBusiness = user?.subscription_plan === 'business';

  // Translations
  const t = {
    ru: {
      title: 'Маркетинг-кампании',
      subtitle: 'Создавайте полные контент-кампании с AI-стратегией',
      createCampaign: 'Создать кампанию',
      noCampaigns: 'У вас пока нет кампаний',
      noCampaignsDesc: 'Создайте первую AI-кампанию и получите полный контент-план',
      businessType: 'Тип бизнеса',
      primaryGoal: 'Главная цель',
      duration: 'Длительность',
      platforms: 'Платформы',
      topic: 'Тема/Ниша',
      targetAudience: 'Целевая аудитория',
      createStrategy: 'Создать стратегию',
      generateContent: 'Сгенерировать контент',
      regenerate: 'Перегенерировать',
      regenerateCTA: 'Обновить CTA',
      duplicate: 'Дублировать',
      delete: 'Удалить',
      posts: 'постов',
      images: 'изображений',
      days: 'дней',
      qualityScore: 'Качество кампании',
      pillarBalance: 'Баланс контента',
      ctaQuality: 'Качество CTA',
      contentVariety: 'Разнообразие',
      platformOpt: 'Оптимизация',
      tips: 'Советы по улучшению',
      proRequired: 'Требуется Pro',
      businessRequired: 'Требуется Business',
      upgradeToUnlock: 'Обновите план для доступа',
      generating: 'Генерация...',
      ready: 'Готово',
      draft: 'Черновик',
      copied: 'Скопировано!',
      postDay: 'День',
      strategySummary: 'AI-стратегия',
      recommendedFrequency: 'Частота постинга',
      contentMix: 'Распределение контента',
      share: 'Поделиться',
      shareLink: 'Ссылка для доступа',
      shareCopied: 'Ссылка скопирована!',
      shareEnabled: 'Публичный доступ включён',
      shareDisabled: 'Публичный доступ отключён',
      shareDesc: 'Любой, у кого есть ссылка, сможет просмотреть кампанию',
      disableShare: 'Отключить доступ',
      openPublicPage: 'Открыть'
    },
    en: {
      title: 'Marketing Campaigns',
      subtitle: 'Create full content campaigns with AI strategy',
      createCampaign: 'Create Campaign',
      noCampaigns: 'No campaigns yet',
      noCampaignsDesc: 'Create your first AI campaign and get a complete content plan',
      businessType: 'Business Type',
      primaryGoal: 'Primary Goal',
      duration: 'Duration',
      platforms: 'Platforms',
      topic: 'Topic/Niche',
      targetAudience: 'Target Audience',
      createStrategy: 'Create Strategy',
      generateContent: 'Generate Content',
      regenerate: 'Regenerate',
      regenerateCTA: 'Update CTA',
      duplicate: 'Duplicate',
      delete: 'Delete',
      posts: 'posts',
      images: 'images',
      days: 'days',
      qualityScore: 'Campaign Quality',
      pillarBalance: 'Content Balance',
      ctaQuality: 'CTA Quality',
      contentVariety: 'Variety',
      platformOpt: 'Optimization',
      tips: 'Improvement Tips',
      proRequired: 'Pro Required',
      businessRequired: 'Business Required',
      upgradeToUnlock: 'Upgrade to unlock',
      generating: 'Generating...',
      ready: 'Ready',
      draft: 'Draft',
      copied: 'Copied!',
      postDay: 'Day',
      strategySummary: 'AI Strategy',
      recommendedFrequency: 'Posting Frequency',
      contentMix: 'Content Distribution',
      share: 'Share',
      shareLink: 'Share link',
      shareCopied: 'Link copied!',
      shareEnabled: 'Public access enabled',
      shareDisabled: 'Public access disabled',
      shareDesc: 'Anyone with the link can view this campaign',
      disableShare: 'Disable sharing',
      openPublicPage: 'Open'
    }
  }[language] || {};

  // Load config and campaigns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configRes, campaignsRes] = await Promise.all([
          axios.get(`${API_URL}/api/campaigns/config`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/campaigns`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setConfig(configRes.data);
        setCampaigns(campaignsRes.data.campaigns);
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) loadData();
  }, [token]);

  const createCampaign = async () => {
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/campaigns/strategy`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampaigns([res.data.campaign, ...campaigns]);
      setSelectedCampaign(res.data.campaign);
      setShowCreateModal(false);
      toast.success(language === 'ru' ? 'Стратегия создана!' : 'Strategy created!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const generateCampaignContent = async (campaignId) => {
    setGenerating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/campaigns/generate`,
        { campaign_id: campaignId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update campaign in list
      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, posts: res.data.posts, status: 'ready', quality_score: res.data.quality_score } : c
      ));
      
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign({ ...selectedCampaign, posts: res.data.posts, status: 'ready', quality_score: res.data.quality_score });
      }
      
      toast.success(`${res.data.posts_generated} ${language === 'ru' ? 'постов сгенерировано!' : 'posts generated!'}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const regeneratePost = async (campaignId, postIndex, ctaOnly = false) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/campaigns/regenerate-post`,
        { campaign_id: campaignId, post_index: postIndex, regenerate_cta_only: ctaOnly },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the post
      const updatedPosts = [...selectedCampaign.posts];
      updatedPosts[postIndex] = res.data.post;
      
      setSelectedCampaign({ ...selectedCampaign, posts: updatedPosts, quality_score: res.data.quality_score });
      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, posts: updatedPosts, quality_score: res.data.quality_score } : c
      ));
      
      toast.success(language === 'ru' ? 'Пост обновлён!' : 'Post updated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to regenerate');
    }
  };

  const duplicateCampaign = async (campaignId) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/campaigns/duplicate`,
        { campaign_id: campaignId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampaigns([res.data.campaign, ...campaigns]);
      toast.success(language === 'ru' ? 'Кампания дублирована!' : 'Campaign duplicated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to duplicate');
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!window.confirm(language === 'ru' ? 'Удалить кампанию?' : 'Delete campaign?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      if (selectedCampaign?.id === campaignId) setSelectedCampaign(null);
      toast.success(language === 'ru' ? 'Кампания удалена' : 'Campaign deleted');
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const toggleShare = async () => {
    if (!selectedCampaign) return;
    setShareLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/campaigns/${selectedCampaign.id}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedCampaign = { 
        ...selectedCampaign, 
        share_token: res.data.shared ? res.data.share_token : null 
      };
      setSelectedCampaign(updatedCampaign);
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? updatedCampaign : c));
      toast.success(res.data.shared ? t.shareEnabled : t.shareDisabled);
      if (!res.data.shared) {
        setShowShareModal(false);
        setShareStats(null);
      } else {
        fetchShareStats(selectedCampaign.id);
      }
    } catch (error) {
      toast.error('Failed to toggle sharing');
    } finally {
      setShareLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!selectedCampaign?.share_token) return '';
    return `${window.location.origin}/shared/${selectedCampaign.share_token}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setShareLinkCopied(true);
    toast.success(t.shareCopied);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  const fetchShareStats = async (campaignId) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/campaigns/${campaignId}/share-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareStats(res.data);
    } catch {
      setShareStats(null);
    }
  };

  const openShareModal = () => {
    setShowShareModal(true);
    if (selectedCampaign) fetchShareStats(selectedCampaign.id);
  };

  const copyPost = (content) => {
    navigator.clipboard.writeText(content);
    toast.success(t.copied);
  };

  const togglePostExpand = (postIndex) => {
    setExpandedPosts(prev => ({ ...prev, [postIndex]: !prev[postIndex] }));
  };

  // Quality Score Component
  const QualityScoreCard = ({ score }) => {
    if (!score) return null;
    
    const gradeColors = {
      'A': 'text-emerald-400',
      'B': 'text-blue-400',
      'C': 'text-yellow-400',
      'D': 'text-red-400'
    };
    
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#FF3B30]" />
            {t.qualityScore}
            <span className={`text-2xl font-bold ml-auto ${gradeColors[score.grade]}`}>
              {score.score}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.pillarBalance}</span>
              <span className="text-white">{score.breakdown.pillar_balance}/25</span>
            </div>
            <Progress value={score.breakdown.pillar_balance * 4} className="h-1.5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.ctaQuality}</span>
              <span className="text-white">{score.breakdown.cta_quality}/25</span>
            </div>
            <Progress value={score.breakdown.cta_quality * 4} className="h-1.5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.contentVariety}</span>
              <span className="text-white">{score.breakdown.content_variety}/25</span>
            </div>
            <Progress value={score.breakdown.content_variety * 4} className="h-1.5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.platformOpt}</span>
              <span className="text-white">{score.breakdown.platform_optimization}/25</span>
            </div>
            <Progress value={score.breakdown.platform_optimization * 4} className="h-1.5" />
          </div>
          
          {score.tips.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-2">{t.tips}:</p>
              <ul className="space-y-1">
                {score.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-[#FF3B30]">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!isBusiness && (
            <div className="pt-3 border-t border-white/10">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/10"
                onClick={() => navigate('/pricing')}
              >
                <Zap className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Business для полных кампаний' : 'Business for full campaigns'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Pillar Distribution Component
  const PillarDistribution = ({ contentMix }) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white">{t.contentMix}</h4>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
        {contentMix?.map((item, i) => {
          const PillarIcon = pillarIcons[item.pillar];
          return (
            <div 
              key={i}
              className="h-full transition-all"
              style={{ 
                width: `${item.percentage}%`, 
                backgroundColor: item.pillar_info.color 
              }}
              title={`${item.pillar_info.name}: ${item.percentage}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {contentMix?.map((item, i) => {
          const PillarIcon = pillarIcons[item.pillar];
          return (
            <div 
              key={i} 
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: `${item.pillar_info.color}20`, color: item.pillar_info.color }}
            >
              <PillarIcon className="w-3 h-3" />
              <span>{language === 'ru' ? item.pillar_info.name_ru : item.pillar_info.name}</span>
              <span className="opacity-70">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF3B30]" />
      </div>
    );
  }

  // Not Pro - Show upgrade prompt
  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#FF3B30]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t.title}</h1>
        <p className="text-gray-400 mb-8">{t.upgradeToUnlock}</p>
        <Button 
          size="lg"
          className="bg-[#FF3B30] hover:bg-[#FF4D42]"
          onClick={() => navigate('/pricing')}
        >
          <Zap className="w-5 h-5 mr-2" />
          {language === 'ru' ? 'Обновить до Pro' : 'Upgrade to Pro'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="w-7 h-7 text-[#FF3B30]" />
            {t.title}
          </h1>
          <p className="text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <Button 
          className="bg-[#FF3B30] hover:bg-[#FF4D42]"
          onClick={() => setShowCreateModal(true)}
          data-testid="create-campaign-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.createCampaign}
        </Button>
      </div>

      {/* Campaign List or Details */}
      {selectedCampaign ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Back + campaign name */}
          <div>
            <button 
              onClick={() => setSelectedCampaign(null)}
              className="text-sm text-gray-500 hover:text-white transition-colors mb-3 flex items-center gap-1"
            >
              ← {language === 'ru' ? 'Все кампании' : 'All campaigns'}
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedCampaign.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedCampaign.duration_days} {t.days} · {selectedCampaign.total_posts} {t.posts}
                  {selectedCampaign.status === 'ready' && (
                    <span className="text-emerald-400 ml-2">· {t.ready}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={openShareModal} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" data-testid="share-campaign-btn">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => duplicateCampaign(selectedCampaign.id)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCampaign(selectedCampaign.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Strategy + CTA merged into one section */}
          {(selectedCampaign.status === 'draft' || !selectedCampaign.posts?.length) ? (
            <div className="space-y-5">
              {/* Strategy info — no card wrapper, just content */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedCampaign.posting_frequency}</span>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {selectedCampaign.platforms?.map(p => {
                      const Icon = platformIcons[p] || MessageCircle;
                      return <Icon key={p} className="w-4 h-4 text-gray-400" />;
                    })}
                  </div>
                </div>

                {/* Content mix — compact inline */}
                {selectedCampaign.content_mix?.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {selectedCampaign.content_mix.map((item, i) => {
                      const PIcon = pillarIcons[item.pillar];
                      return (
                        <span key={i} className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.pillar_info.color }} />
                          {language === 'ru' ? item.pillar_info.name_ru : item.pillar_info.name}
                          <span className="text-gray-600">{item.count}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generate CTA — full width, no card */}
              <div className="pt-2">
                <Button 
                  className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] h-14 text-base font-semibold shadow-lg shadow-[#FF3B30]/20"
                  onClick={() => generateCampaignContent(selectedCampaign.id)}
                  disabled={generating}
                  data-testid="generate-campaign-btn"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {t.generateContent}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center mt-2.5">
                  {language === 'ru' 
                    ? `AI создаст ${selectedCampaign.total_posts} постов на основе стратегии`
                    : `AI will create ${selectedCampaign.total_posts} posts based on strategy`}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Strategy summary — compact for ready campaigns */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedCampaign.posting_frequency}</span>
                </div>
                {selectedCampaign.content_mix?.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.pillar_info.color }} />
                    {language === 'ru' ? item.pillar_info.name_ru : item.pillar_info.name} {item.count}
                  </span>
                ))}
                <div className="flex gap-1.5 ml-auto">
                  {selectedCampaign.platforms?.map(p => {
                    const Icon = platformIcons[p] || MessageCircle;
                    return <Icon key={p} className="w-4 h-4 text-gray-500" />;
                  })}
                </div>
              </div>

              {/* Quality score — inline compact */}
              {selectedCampaign.quality_score && (
                <div className="flex items-center gap-3 py-3">
                  <BarChart3 className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-400">{t.qualityScore}</span>
                  <span className="text-lg font-bold text-white">{selectedCampaign.quality_score.score}/100</span>
                  {selectedCampaign.quality_score.tips?.length > 0 && (
                    <span className="text-xs text-gray-600 ml-auto">
                      {selectedCampaign.quality_score.tips[0]}
                    </span>
                  )}
                </div>
              )}

              {/* Posts list */}
              <div className="space-y-2.5">
                {selectedCampaign.posts.map((post, index) => {
                  const PillarIcon = pillarIcons[post.pillar] || BookOpen;
                  const PlatformIcon = platformIcons[post.platform] || MessageCircle;
                  const isExpanded = expandedPosts[index];
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-[#111113] border border-white/[0.06] rounded-xl p-4"
                    >
                      {/* Post Header */}
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => togglePostExpand(index)}
                      >
                        <div 
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${post.pillar_info.color}15` }}
                        >
                          <PillarIcon className="w-4 h-4" style={{ color: post.pillar_info.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {t.postDay} {post.scheduled_day}
                            </span>
                            <span className="text-xs text-gray-600">·</span>
                            <span className="text-xs capitalize" style={{ color: post.pillar_info.color }}>
                              {language === 'ru' ? post.pillar_info.name_ru : post.pillar_info.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <PlatformIcon className="w-3 h-3" />
                            <span className="capitalize">{post.platform}</span>
                            {post.has_cta && <span className="text-[#FF3B30]">· CTA</span>}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                      
                      {/* Post Content — collapsed preview */}
                      {!isExpanded && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-2.5 ml-12">
                          {post.content}
                        </p>
                      )}

                      {/* Expanded content + actions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="text-sm text-gray-300 whitespace-pre-line mt-3 leading-relaxed">
                              {post.content}
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                              <button 
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                onClick={() => copyPost(post.content)}
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                              <button 
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                onClick={() => regeneratePost(selectedCampaign.id, index, false)}
                              >
                                <RefreshCw className="w-3 h-3" /> {t.regenerate}
                              </button>
                              <button 
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                onClick={() => regeneratePost(selectedCampaign.id, index, true)}
                              >
                                <Edit2 className="w-3 h-3" /> CTA
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      ) : (
        // Campaign List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.length === 0 ? (
            <Card className="col-span-full bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-16 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">{t.noCampaigns}</h3>
                <p className="text-gray-400 mb-6">{t.noCampaignsDesc}</p>
                <Button 
                  className="bg-[#FF3B30] hover:bg-[#FF4D42]"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.createCampaign}
                </Button>
              </CardContent>
            </Card>
          ) : (
            campaigns.map(campaign => (
              <Card 
                key={campaign.id}
                className="bg-[#111113] border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
                onClick={() => setSelectedCampaign(campaign)}
                data-testid={`campaign-card-${campaign.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    {campaign.status === 'ready' && (
                      <span className="text-xs text-emerald-400">{t.ready}</span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-white mb-1.5 group-hover:text-[#FF3B30] transition-colors">
                    {campaign.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    {campaign.duration_days} {t.days} · {campaign.total_posts} {t.posts}
                  </p>
                  
                  {/* Content mix — compact dots */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {campaign.content_mix?.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.pillar_info.color }} />
                        {language === 'ru' ? item.pillar_info.name_ru : item.pillar_info.name}
                      </span>
                    ))}
                  </div>
                  
                  {campaign.quality_score && (
                    <div className="mt-3 text-sm text-gray-500">
                      {t.qualityScore}: <span className="text-white font-medium">{campaign.quality_score.score}/100</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF3B30]" />
              {t.createCampaign}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {language === 'ru' ? 'AI создаст стратегию на основе ваших параметров' : 'AI will create a strategy based on your parameters'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">{t.businessType}</Label>
                <Select value={formData.business_type} onValueChange={v => setFormData({...formData, business_type: v})}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white font-medium h-11 focus:border-[#FF3B30]/50 focus:ring-[#FF3B30]/20">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {config?.business_types && Object.entries(config.business_types).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="text-white focus:bg-[#FF3B30]/20 focus:text-white">
                        {language === 'ru' ? val.name_ru : val.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">{t.primaryGoal}</Label>
                <Select value={formData.primary_goal} onValueChange={v => setFormData({...formData, primary_goal: v})}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white font-medium h-11 focus:border-[#FF3B30]/50 focus:ring-[#FF3B30]/20">
                    <SelectValue className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {config?.goals && Object.entries(config.goals).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="text-white focus:bg-[#FF3B30]/20 focus:text-white">
                        {language === 'ru' ? val.name_ru : val.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">{t.duration}</Label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map(days => (
                  <Button
                    key={days}
                    type="button"
                    variant={formData.duration_days === days ? 'default' : 'outline'}
                    className={formData.duration_days === days 
                      ? 'bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium shadow-lg shadow-[#FF3B30]/25 border-0' 
                      : 'border-white/15 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/25 font-medium'}
                    onClick={() => setFormData({...formData, duration_days: days})}
                  >
                    {days} {t.days}
                    {days === 30 && !isBusiness && (
                      <Lock className="w-3 h-3 ml-1 opacity-50" />
                    )}
                  </Button>
                ))}
              </div>
              {formData.duration_days === 30 && !isBusiness && (
                <p className="text-xs text-gray-500">
                  {language === 'ru' ? 'Pro: до 15 постов. Business: полные 30.' : 'Pro: up to 15 posts. Business: full 30.'}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">{t.platforms}</Label>
              <div className="flex flex-wrap gap-2">
                {['instagram', 'tiktok', 'telegram', 'youtube'].map(platform => {
                  const Icon = platformIcons[platform] || MessageCircle;
                  const isSelected = formData.platforms.includes(platform);
                  return (
                    <Button
                      key={platform}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={isSelected 
                        ? 'bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium shadow-md shadow-[#FF3B30]/20 border-0' 
                        : 'border-white/15 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/25 font-medium'}
                      onClick={() => {
                        const newPlatforms = isSelected 
                          ? formData.platforms.filter(p => p !== platform)
                          : [...formData.platforms, platform];
                        setFormData({...formData, platforms: newPlatforms.length ? newPlatforms : ['instagram']});
                      }}
                    >
                      <Icon className={`w-4 h-4 mr-1.5 ${isSelected ? 'text-white' : ''}`} />
                      <span className="capitalize">{platform}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">{t.topic}</Label>
              <Input 
                className="bg-white/5 border-white/15 text-white font-medium h-11 placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:ring-[#FF3B30]/20"
                placeholder={language === 'ru' ? 'Напр: фитнес, маркетинг, бизнес...' : 'E.g: fitness, marketing, business...'}
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">{t.targetAudience}</Label>
              <Input 
                className="bg-white/5 border-white/15 text-white font-medium h-11 placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:ring-[#FF3B30]/20"
                placeholder={language === 'ru' ? 'Напр: предприниматели 25-45 лет' : 'E.g: entrepreneurs 25-45'}
                value={formData.target_audience}
                onChange={e => setFormData({...formData, target_audience: e.target.value})}
              />
            </div>
            
            <Button 
              className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-semibold h-12 shadow-lg shadow-[#FF3B30]/25"
              onClick={createCampaign}
              disabled={creating}
              data-testid="submit-campaign-btn"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ru' ? 'Создание...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.createStrategy}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Campaign Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md bg-[#111113] border-white/10" data-testid="share-campaign-modal">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Share2 className="w-5 h-5 text-[#FF3B30]" />
              {t.share}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t.shareDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedCampaign?.share_token ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Link2 className="w-4 h-4 text-[#FF3B30] shrink-0" />
                  <span className="text-sm text-gray-300 truncate flex-1" data-testid="share-link-text">
                    {getShareUrl()}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={copyShareLink}
                    className="shrink-0"
                    data-testid="copy-share-link-btn"
                  >
                    {shareLinkCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a 
                    href={getShareUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="ghost" data-testid="open-share-link-btn">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
                {/* Share Analytics */}
                {shareStats && shareStats.shared && (
                  <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10" data-testid="share-analytics">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#FF3B30]" />
                      <span className="text-sm font-medium text-white">
                        {language === 'ru' ? 'Аналитика' : 'Analytics'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {language === 'ru' ? 'Всего просмотров' : 'Total views'}
                      </span>
                      <span className="text-lg font-bold text-white" data-testid="share-total-views">
                        {shareStats.total_views}
                      </span>
                    </div>
                    {shareStats.daily_views?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500">
                          {language === 'ru' ? 'Последние 7 дней' : 'Last 7 days'}
                        </span>
                        <div className="flex items-end gap-1 h-10" data-testid="share-daily-chart">
                          {shareStats.daily_views.map((d, i) => {
                            const maxViews = Math.max(...shareStats.daily_views.map(x => x.views), 1);
                            const height = d.views > 0 ? Math.max((d.views / maxViews) * 100, 12) : 4;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.views}`}>
                                <div 
                                  className={`w-full rounded-sm transition-all ${d.views > 0 ? 'bg-[#FF3B30]' : 'bg-white/10'}`}
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>{shareStats.daily_views[0]?.date?.slice(5)}</span>
                          <span>{language === 'ru' ? 'Сегодня' : 'Today'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full text-red-400 hover:text-red-300 border-red-400/30"
                  onClick={toggleShare}
                  disabled={shareLoading}
                  data-testid="disable-share-btn"
                >
                  {shareLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t.disableShare}
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-[#FF3B30] hover:bg-[#FF4D42]"
                onClick={toggleShare}
                disabled={shareLoading}
                data-testid="enable-share-btn"
              >
                {shareLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                {language === 'ru' ? 'Создать публичную ссылку' : 'Create public link'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingCampaigns;
