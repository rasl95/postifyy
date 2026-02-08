import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Sparkles, Target, Calendar, BarChart3, ChevronDown,
  Instagram, Youtube, MessageCircle, BookOpen, DollarSign,
  Heart, User, ArrowRight, Copy, Check, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const pillarIcons = {
  education: BookOpen,
  sales: DollarSign,
  engagement: Heart,
  personal: User
};

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

const pillarColors = {
  education: '#3B82F6',
  sales: '#FF3B30',
  engagement: '#F59E0B',
  personal: '#8B5CF6'
};

export const SharedCampaign = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/campaigns/public/${shareToken}`);
        setCampaign(res.data.campaign);
      } catch (err) {
        setError(err.response?.status === 404 ? 'not_found' : 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [shareToken]);

  const copyPostContent = (postId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full" data-testid="shared-campaign-error">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {error === 'not_found' ? 'Кампания не найдена' : 'Ошибка загрузки'}
            </h2>
            <p className="text-gray-400 mb-6">
              {error === 'not_found' 
                ? 'Ссылка недействительна или автор отключил доступ' 
                : 'Попробуйте обновить страницу'}
            </p>
            <Button onClick={() => navigate('/')} className="bg-[#FF3B30] hover:bg-[#FF4D42]">
              Перейти на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D]" data-testid="shared-campaign-page">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B0B0D]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles className="w-6 h-6 text-[#FF3B30]" />
            <span className="text-white font-semibold text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>Postify AI</span>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
            data-testid="shared-cta-header"
          >
            Создать свою кампанию <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Campaign Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="shared-campaign-title">
                {campaign.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {campaign.duration_days} дней</span>
                <span>•</span>
                <span>{campaign.total_posts} постов</span>
                {campaign.quality_score && (
                  <>
                    <span>•</span>
                    <Badge className="bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30">
                      <BarChart3 className="w-3 h-3 mr-1" /> {campaign.quality_score.overall}/100
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy Panel */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-[#FF3B30]" /> AI-стратегия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-gray-400">Частота:</span>
                  <p className="text-white font-medium">{campaign.posting_frequency}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Платформы:</span>
                  <div className="flex gap-2 mt-1">
                    {campaign.platforms?.map(p => {
                      const Icon = platformIcons[p] || MessageCircle;
                      return <Icon key={p} className="w-5 h-5 text-white" />;
                    })}
                  </div>
                </div>
                {campaign.content_mix?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-400 text-sm">Контент-микс:</span>
                    {campaign.content_mix.map((item, i) => {
                      const Icon = pillarIcons[item.pillar] || BookOpen;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: pillarColors[item.pillar] }} />
                          <span className="text-white text-sm flex-1">{item.pillar_info?.name || item.pillar}</span>
                          <span className="text-gray-400 text-xs">{item.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {campaign.quality_score && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <BarChart3 className="w-5 h-5 text-[#FF3B30]" /> Качество
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Баланс контента', val: campaign.quality_score.pillar_balance },
                    { label: 'CTA', val: campaign.quality_score.cta_quality },
                    { label: 'Разнообразие', val: campaign.quality_score.content_variety },
                    { label: 'Оптимизация', val: campaign.quality_score.platform_optimization },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-medium">{s.val}/100</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Posts */}
          <div className="lg:col-span-2 space-y-3" data-testid="shared-campaign-posts">
            {campaign.posts?.length > 0 ? (
              campaign.posts.map((post, idx) => {
                const Icon = pillarIcons[post.pillar] || BookOpen;
                const expanded = expandedPosts[idx];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${pillarColors[post.pillar]}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: pillarColors[post.pillar] }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                                День {post.day || idx + 1}
                              </Badge>
                              <Badge variant="outline" className="text-xs" style={{ borderColor: `${pillarColors[post.pillar]}50`, color: pillarColors[post.pillar] }}>
                                {post.pillar_info?.name || post.pillar}
                              </Badge>
                              {post.platform && (
                                <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                  {post.platform}
                                </Badge>
                              )}
                            </div>
                            <div 
                              className={`text-sm text-gray-300 whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
                            >
                              {post.content}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {post.content?.length > 150 && (
                                <button 
                                  onClick={() => setExpandedPosts(p => ({ ...p, [idx]: !p[idx] }))}
                                  className="text-xs text-[#FF3B30] hover:text-[#FF4D42] flex items-center gap-1"
                                >
                                  <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                  {expanded ? 'Свернуть' : 'Показать полностью'}
                                </button>
                              )}
                              <button
                                onClick={() => copyPostContent(idx, post.content)}
                                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 ml-auto"
                                data-testid={`copy-post-${idx}`}
                              >
                                {copiedId === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedId === idx ? 'Скопировано' : 'Копировать'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">Контент ещё не сгенерирован</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-[#FF3B30]/10 to-[#FF6A3D]/10 border-[#FF3B30]/20">
            <CardContent className="py-8 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#FF3B30]" />
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Создайте свою AI-кампанию
              </h3>
              <p className="text-gray-400 mb-5 max-w-md mx-auto">
                Postify AI создаст для вас полную контент-стратегию за минуты. Посты, изображения и аналитика — всё в одном месте.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/')} 
                className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-lg shadow-[#FF3B30]/25"
                data-testid="shared-cta-bottom"
              >
                Начать бесплатно <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SharedCampaign;
