import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart3, TrendingUp, TrendingDown, Star, Image, FileText, Sparkles,
  ArrowUp, ArrowDown, Loader2, Calendar, Download, Lock, Zap, Target,
  Lightbulb, AlertCircle, CheckCircle, MessageSquare, Instagram, Youtube,
  Brain, Rocket, Eye, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Simple bar chart component
const SimpleBarChart = ({ data, height = 120 }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.generations)) || 1;
  
  return (
    <div className="flex items-end gap-1 h-[120px]" style={{ height }}>
      {data.slice(-14).map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-gradient-to-t from-[#FF3B30] to-[#FF6A3D] rounded-t transition-all hover:opacity-80"
            style={{ height: `${(item.generations / maxValue) * 100}%`, minHeight: item.generations > 0 ? '4px' : '0' }}
            title={`${item.date}: ${item.generations}`}
          />
          {i % 2 === 0 && (
            <span className="text-[9px] text-gray-500 truncate w-full text-center">
              {item.date.slice(5)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Platform icon component
const PlatformIcon = ({ platform, className }) => {
  const icons = {
    instagram: Instagram,
    youtube: Youtube,
    telegram: MessageSquare,
    tiktok: () => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    )
  };
  const Icon = icons[platform] || MessageSquare;
  return <Icon className={className} />;
};

export const Analytics = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [aiDirector, setAiDirector] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isBusiness = user?.subscription_plan === 'business';

  // Translations
  const t = {
    ru: {
      title: 'Аналитика',
      subtitle: 'Отслеживайте результаты и получайте AI-рекомендации',
      overview: 'Обзор',
      aiDirector: 'AI Директор',
      recommendations: 'Рекомендации',
      weeklyReport: 'Недельный отчёт',
      totalGenerations: 'Всего генераций',
      totalImages: 'Изображений',
      favoritesSaved: 'В избранном',
      campaignsCreated: 'Кампаний',
      dailyAverage: 'В среднем/день',
      platformBreakdown: 'По платформам',
      contentTypes: 'Типы контента',
      toneDistribution: 'Распределение тонов',
      last7Days: '7 дней',
      last30Days: '30 дней',
      last90Days: '90 дней',
      export: 'Экспорт',
      exportCSV: 'Экспорт CSV',
      exportJSON: 'Экспорт JSON',
      unlockPro: 'Разблокировать с Pro',
      upgradeForMore: 'Обновитесь для полной аналитики',
      productivityScore: 'Продуктивность',
      weeklySummary: 'Недельная сводка',
      topPlatform: 'Топ платформа',
      topTone: 'Топ тон',
      trend: 'Тренд',
      up: 'Рост',
      down: 'Спад',
      stable: 'Стабильно',
      needsAttention: 'Требует внимания',
      recommendedForYou: 'Рекомендовано для вас',
      generateNow: 'Сгенерировать',
      insights: 'Инсайты',
      nextSteps: 'Следующие шаги',
      missedOpportunities: 'Упущенные возможности',
      topContent: 'Лучший контент',
      vsLastWeek: 'vs прошлая неделя',
      noData: 'Нет данных',
      startCreating: 'Начните создавать контент',
      loading: 'Загрузка...'
    },
    en: {
      title: 'Analytics',
      subtitle: 'Track results and get AI recommendations',
      overview: 'Overview',
      aiDirector: 'AI Director',
      recommendations: 'Recommendations',
      weeklyReport: 'Weekly Report',
      totalGenerations: 'Total Generations',
      totalImages: 'Images',
      favoritesSaved: 'Favorites',
      campaignsCreated: 'Campaigns',
      dailyAverage: 'Daily Average',
      platformBreakdown: 'Platform Breakdown',
      contentTypes: 'Content Types',
      toneDistribution: 'Tone Distribution',
      last7Days: '7 days',
      last30Days: '30 days',
      last90Days: '90 days',
      export: 'Export',
      exportCSV: 'Export CSV',
      exportJSON: 'Export JSON',
      unlockPro: 'Unlock with Pro',
      upgradeForMore: 'Upgrade for full analytics',
      productivityScore: 'Productivity',
      weeklySummary: 'Weekly Summary',
      topPlatform: 'Top Platform',
      topTone: 'Top Tone',
      trend: 'Trend',
      up: 'Up',
      down: 'Down',
      stable: 'Stable',
      needsAttention: 'Needs Attention',
      recommendedForYou: 'Recommended for You',
      generateNow: 'Generate Now',
      insights: 'Insights',
      nextSteps: 'Next Steps',
      missedOpportunities: 'Missed Opportunities',
      topContent: 'Top Content',
      vsLastWeek: 'vs last week',
      noData: 'No data',
      startCreating: 'Start creating content',
      loading: 'Loading...'
    }
  }[language] || {};

  // Fetch all analytics data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard data
        const dashRes = await axios.get(`${API_URL}/api/analytics/dashboard?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashRes.data);

        // Fetch AI Director (Pro+)
        if (isPro) {
          const [directorRes, recsRes, reportRes] = await Promise.all([
            axios.get(`${API_URL}/api/analytics/ai-director`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_URL}/api/analytics/recommendations`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_URL}/api/analytics/weekly-report`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          setAiDirector(directorRes.data);
          setRecommendations(recsRes.data);
          setWeeklyReport(reportRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки аналитики' : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token, period, isPro]);

  // Export handler
  const handleExport = async (format) => {
    try {
      const res = await axios.get(`${API_URL}/api/analytics/export?format=${format}&period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (format === 'csv') {
        const blob = new Blob([res.data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `postify_analytics_${period}.json`;
        a.click();
      }
      toast.success(language === 'ru' ? 'Экспорт завершён' : 'Export complete');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Export failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF3B30]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#FF3B30]" />
            {t.title}
          </h1>
          <p className="text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-white/5 rounded-lg p-1">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? 'bg-[#FF3B30] text-white' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? t.last7Days : p === '30d' ? t.last30Days : t.last90Days}
              </button>
            ))}
          </div>
          
          {/* Export dropdown */}
          {dashboardData?.can_export && (
            <div className="relative group">
              <Button variant="outline" size="sm" className="border-white/10">
                <Download className="w-4 h-4 mr-2" />
                {t.export}
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button 
                  className="block w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-white/5 rounded"
                  onClick={() => handleExport('csv')}
                >
                  {t.exportCSV}
                </button>
                <button 
                  className="block w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-white/5 rounded"
                  onClick={() => handleExport('json')}
                >
                  {t.exportJSON}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FF3B30]">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.overview}
          </TabsTrigger>
          <TabsTrigger value="ai-director" className="data-[state=active]:bg-[#FF3B30]">
            <Brain className="w-4 h-4 mr-2" />
            {t.aiDirector}
            {!isPro && <Lock className="w-3 h-3 ml-1 opacity-50" />}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-[#FF3B30]">
            <Lightbulb className="w-4 h-4 mr-2" />
            {t.recommendations}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-[#FF3B30]">
            <Calendar className="w-4 h-4 mr-2" />
            {t.weeklyReport}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#FF3B30]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{dashboardData?.overview?.total_generations || 0}</p>
                    <p className="text-xs text-gray-500">{t.totalGenerations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{dashboardData?.overview?.total_images || 0}</p>
                    <p className="text-xs text-gray-500">{t.totalImages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{dashboardData?.overview?.favorites_saved || 0}</p>
                    <p className="text-xs text-gray-500">{t.favoritesSaved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{dashboardData?.overview?.campaigns_created || 0}</p>
                    <p className="text-xs text-gray-500">{t.campaignsCreated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{dashboardData?.overview?.daily_average || 0}</p>
                    <p className="text-xs text-gray-500">{t.dailyAverage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Pro only */}
          {dashboardData?.can_access_charts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t.totalGenerations}</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={dashboardData?.chart_data} />
                </CardContent>
              </Card>

              {/* Platform Breakdown */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t.platformBreakdown}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.platform_breakdown && Object.entries(dashboardData.platform_breakdown).map(([platform, count]) => {
                    const total = Object.values(dashboardData.platform_breakdown).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={platform} className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 capitalize">{platform}</span>
                          </div>
                          <span className="text-white font-medium">{count} ({percent}%)</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    );
                  })}
                  {(!dashboardData?.platform_breakdown || Object.keys(dashboardData.platform_breakdown).length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">{t.noData}</p>
                  )}
                </CardContent>
              </Card>

              {/* Content Types */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t.contentTypes}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.content_type_breakdown && Object.entries(dashboardData.content_type_breakdown).map(([type, count]) => {
                    const total = Object.values(dashboardData.content_type_breakdown).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const labels = {
                      social_post: 'Social Posts',
                      video_idea: 'Video Ideas',
                      product_description: 'Product Descriptions',
                      image: 'Images',
                      campaign_post: 'Campaign Posts'
                    };
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{labels[type] || type}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tone Distribution */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t.toneDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {dashboardData?.tone_breakdown && Object.entries(dashboardData.tone_breakdown).map(([tone, count]) => (
                      <Badge key={tone} variant="outline" className="border-white/20 text-gray-300">
                        {tone}: {count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-12 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">{t.upgradeForMore}</h3>
                <p className="text-gray-400 mb-4">
                  {language === 'ru' 
                    ? 'Получите доступ к графикам, AI рекомендациям и экспорту данных'
                    : 'Get access to charts, AI recommendations and data export'}
                </p>
                <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t.unlockPro}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Director Tab */}
        <TabsContent value="ai-director" className="space-y-6">
          {aiDirector?.locked ? (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-[#FF3B30]" />
                <h3 className="text-xl font-bold text-white mb-2">AI Marketing Director</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {language === 'ru' 
                    ? 'Ваш персональный маркетинговый директор на базе AI. Анализирует результаты и даёт рекомендации.'
                    : 'Your personal AI-powered marketing director. Analyzes results and provides recommendations.'}
                </p>
                <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                  <Zap className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Разблокировать AI Директор' : 'Unlock AI Director'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Weekly Summary Card */}
              <Card className="bg-gradient-to-br from-[#FF3B30]/10 to-transparent border-[#FF3B30]/20">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#FF3B30]" />
                    {t.weeklySummary}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-3xl font-bold text-white">{aiDirector?.weekly_summary?.total_content || 0}</p>
                      <p className="text-xs text-gray-500">{t.totalGenerations}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-xl font-bold text-white capitalize">{aiDirector?.weekly_summary?.top_platform || '-'}</p>
                      <p className="text-xs text-gray-500">{t.topPlatform}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-xl font-bold text-white capitalize">{aiDirector?.weekly_summary?.top_tone || '-'}</p>
                      <p className="text-xs text-gray-500">{t.topTone}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-3xl font-bold text-white">{aiDirector?.weekly_summary?.productivity_score || 0}</p>
                      <p className="text-xs text-gray-500">{t.productivityScore}</p>
                    </div>
                  </div>
                  
                  {/* Trend indicator */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {aiDirector?.weekly_summary?.trend === 'up' && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                        <ArrowUp className="w-3 h-3 mr-1" /> {t.up}
                      </Badge>
                    )}
                    {aiDirector?.weekly_summary?.trend === 'down' && (
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        <ArrowDown className="w-3 h-3 mr-1" /> {t.down}
                      </Badge>
                    )}
                    {aiDirector?.weekly_summary?.trend === 'stable' && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-0">
                        <TrendingUp className="w-3 h-3 mr-1" /> {t.stable}
                      </Badge>
                    )}
                    {aiDirector?.weekly_summary?.trend === 'needs_attention' && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                        <AlertCircle className="w-3 h-3 mr-1" /> {t.needsAttention}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiDirector?.recommendations?.map((rec, i) => (
                  <Card key={i} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          rec.priority === 'high' ? 'bg-red-500/10' : 
                          rec.priority === 'medium' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                        }`}>
                          <Lightbulb className={`w-5 h-5 ${
                            rec.priority === 'high' ? 'text-red-400' : 
                            rec.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {language === 'ru' ? rec.title_ru : rec.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {language === 'ru' ? rec.message_ru : rec.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Insights */}
              {aiDirector?.insights?.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{t.insights}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiDirector.insights.map((insight, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Eye className="w-4 h-4 text-[#FF3B30]" />
                        <span className="text-gray-300">
                          {language === 'ru' ? insight.message_ru : insight.message}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {recommendations?.locked ? (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-12 text-center">
                <Rocket className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">{t.unlockPro}</h3>
                <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t.unlockPro}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-[#FF3B30]/10 to-[#FF6A3D]/5 border-[#FF3B30]/20">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                  {t.recommendedForYou}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Platform</p>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={recommendations?.recommendation?.platform} className="w-5 h-5 text-[#FF3B30]" />
                        <span className="text-white font-medium capitalize">{recommendations?.recommendation?.platform}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tone</p>
                      <span className="text-white font-medium capitalize">{recommendations?.recommendation?.tone}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Format</p>
                      <span className="text-white font-medium">{recommendations?.recommendation?.format}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <span className="text-white font-medium capitalize">{recommendations?.recommendation?.content_type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-4">
                    {language === 'ru' ? recommendations?.recommendation?.reason_ru : recommendations?.recommendation?.reason}
                  </p>
                  
                  {recommendations?.recommendation?.suggested_hashtags && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {recommendations.recommendation.suggested_hashtags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="border-[#FF3B30]/30 text-[#FF3B30]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button className="w-full bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/create')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t.generateNow}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly Report Tab */}
        <TabsContent value="weekly" className="space-y-6">
          {weeklyReport?.locked ? (
            <Card className="bg-white/5 border-white/10 border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">{t.unlockPro}</h3>
                <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t.unlockPro}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{t.weeklySummary}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-4xl font-bold text-white">{weeklyReport?.summary?.total_content || 0}</p>
                      <p className="text-gray-500">{t.totalGenerations}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-lg font-medium ${
                      weeklyReport?.summary?.vs_last_week > 0 ? 'text-emerald-400' : 
                      weeklyReport?.summary?.vs_last_week < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {weeklyReport?.summary?.vs_last_week > 0 ? <ArrowUp className="w-5 h-5" /> : 
                       weeklyReport?.summary?.vs_last_week < 0 ? <ArrowDown className="w-5 h-5" /> : null}
                      {weeklyReport?.summary?.vs_last_week || 0}% {t.vsLastWeek}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missed Opportunities */}
              {weeklyReport?.missed_opportunities?.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      {t.missedOpportunities}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {weeklyReport.missed_opportunities.map((opp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                        <PlatformIcon platform={opp.platform} className="w-5 h-5 text-yellow-400" />
                        <span className="text-gray-300">
                          {language === 'ru' ? opp.message_ru : opp.message}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {weeklyReport?.next_steps?.length > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      {t.nextSteps}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {weeklyReport.next_steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg">
                        <Rocket className="w-5 h-5 text-emerald-400" />
                        <span className="text-gray-300">
                          {language === 'ru' ? step.message_ru : step.message}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              {weeklyReport?.cta && (
                <Card className="bg-gradient-to-r from-[#FF3B30]/20 to-[#FF6A3D]/10 border-[#FF3B30]/30">
                  <CardContent className="p-6 flex items-center justify-between">
                    <p className="text-white font-medium">
                      {language === 'ru' ? weeklyReport.cta.message_ru : weeklyReport.cta.message}
                    </p>
                    <Button className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/campaigns')}>
                      <Target className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Создать кампанию' : 'Create Campaign'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
