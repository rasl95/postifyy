import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart3, TrendingUp, TrendingDown, Star, Image, FileText, Sparkles,
  ArrowUp, ArrowDown, Loader2, Calendar, Download, Lock, Zap, Target,
  Lightbulb, CheckCircle, MessageSquare, Instagram, Youtube,
  Brain, Rocket, Eye, ArrowRight
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
    <div className="flex items-end gap-1" style={{ height }}>
      {data.slice(-14).map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-gradient-to-t from-[#FF3B30] to-[#FF6A3D] rounded-t transition-all hover:opacity-80"
            style={{ height: `${(item.generations / maxValue) * 100}%`, minHeight: item.generations > 0 ? '4px' : '0' }}
            title={`${item.date}: ${item.generations}`}
          />
          {i % 2 === 0 && (
            <span className="text-[9px] text-gray-500 truncate w-full text-center">{item.date.slice(5)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

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

// ─── Hero KPI ───
const HeroKPI = ({ total, trend, trendPercent, dailyAvg, language }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : TrendingUp;
  const trendLabel = trend === 'up' 
    ? (language === 'ru' ? 'рост' : 'up') 
    : trend === 'down' 
      ? (language === 'ru' ? 'спад' : 'down') 
      : (language === 'ru' ? 'стабильно' : 'stable');

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 sm:p-6" data-testid="hero-kpi">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {language === 'ru' ? 'Всего генераций' : 'Total generations'}
          </p>
          <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{total}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' 
          : trend === 'down' ? 'bg-red-500/10 text-red-400' 
          : 'bg-white/5 text-gray-400'
        }`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trendPercent != null ? `${trendPercent > 0 ? '+' : ''}${trendPercent}%` : trendLabel}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
          <span className="text-sm text-gray-400">
            ~{dailyAvg} {language === 'ru' ? 'в день' : '/day'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Compact Stats Row ───
const StatsRow = ({ images, favorites, campaigns, language }) => (
  <div className="grid grid-cols-3 gap-3" data-testid="stats-row">
    {[
      { value: images, label: language === 'ru' ? 'Изображений' : 'Images', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Image },
      { value: favorites, label: language === 'ru' ? 'Избранное' : 'Favorites', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Star },
      { value: campaigns, label: language === 'ru' ? 'Кампаний' : 'Campaigns', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Target },
    ].map(({ value, label, color, bg, icon: Icon }) => (
      <div key={label} className="bg-[#111113] border border-white/[0.06] rounded-xl p-3 sm:p-4">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-xl font-bold text-white">{value || 0}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    ))}
  </div>
);

// ─── Compact AI Insight ───
const AIInsight = ({ missedOpps, insights, language }) => {
  // Merge missed opportunities + insights into one compact sentence
  const messages = [];
  if (missedOpps?.length > 0) {
    const platforms = missedOpps.map(o => o.platform).filter(Boolean);
    if (platforms.length > 0) {
      messages.push(
        language === 'ru'
          ? `Попробуйте создать контент для ${platforms.join(', ')} — там есть потенциал роста.`
          : `Try creating content for ${platforms.join(', ')} — there's growth potential.`
      );
    } else {
      const msg = language === 'ru' ? missedOpps[0]?.message_ru : missedOpps[0]?.message;
      if (msg) messages.push(msg);
    }
  }
  if (insights?.length > 0) {
    const msg = language === 'ru' ? insights[0]?.message_ru : insights[0]?.message;
    if (msg) messages.push(msg);
  }

  if (messages.length === 0) return null;

  return (
    <div className="flex items-start gap-3 bg-[#111113] border border-white/[0.06] rounded-xl p-4" data-testid="ai-insight">
      <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4 text-[#FF3B30]" />
      </div>
      <div>
        <p className="text-sm font-medium text-white mb-1">
          {language === 'ru' ? 'AI-подсказка' : 'AI insight'}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">{messages[0]}</p>
        {messages.length > 1 && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1.5">{messages[1]}</p>
        )}
      </div>
    </div>
  );
};

// ─── Lightweight Next Steps ───
const NextSteps = ({ steps, language }) => {
  if (!steps?.length) return null;
  return (
    <div className="space-y-4" data-testid="next-steps">
      <p className="text-sm font-medium text-gray-400 px-1">
        {language === 'ru' ? 'Следующие шаги' : 'Next steps'}
      </p>
      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 px-1">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-gray-300">
              {language === 'ru' ? step.message_ru : step.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Weekly CTA ───
const WeeklyCTA = ({ language, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between bg-gradient-to-r from-[#FF3B30]/10 to-transparent border border-[#FF3B30]/20 rounded-xl p-4 sm:p-5 hover:from-[#FF3B30]/15 transition-colors group"
    data-testid="weekly-cta"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/15 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-[#FF3B30]" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-white">
          {language === 'ru' ? 'Сгенерировать контент на эту неделю' : 'Generate content for this week'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {language === 'ru' ? 'AI подготовит план публикаций' : 'AI will prepare a publishing plan'}
        </p>
      </div>
    </div>
    <ArrowRight className="w-5 h-5 text-[#FF3B30] group-hover:translate-x-0.5 transition-transform" />
  </button>
);

// ─── Main Analytics ───
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

  const t = {
    ru: {
      title: 'Аналитика',
      subtitle: 'Ваши результаты и рекомендации',
      overview: 'Обзор',
      aiDirector: 'AI Директор',
      recs: 'Для вас',
      weekly: 'Неделя',
      totalGenerations: 'Всего генераций',
      platformBreakdown: 'По платформам',
      contentTypes: 'Типы контента',
      toneDistribution: 'Тона',
      last7Days: '7д',
      last30Days: '30д',
      last90Days: '90д',
      export: 'Экспорт',
      exportCSV: 'CSV',
      exportJSON: 'JSON',
      unlockPro: 'Разблокировать с Pro',
      upgradeDesc: 'Графики, AI рекомендации и экспорт данных',
      weeklySummary: 'Недельная сводка',
      topPlatform: 'Топ платформа',
      topTone: 'Топ тон',
      productivity: 'Продуктивность',
      generateNow: 'Сгенерировать',
      vsLastWeek: 'vs прошлая неделя',
      noData: 'Нет данных',
      loading: 'Загрузка...'
    },
    en: {
      title: 'Analytics',
      subtitle: 'Your results and recommendations',
      overview: 'Overview',
      aiDirector: 'AI Director',
      recs: 'For you',
      weekly: 'Week',
      totalGenerations: 'Total Generations',
      platformBreakdown: 'Platforms',
      contentTypes: 'Content Types',
      toneDistribution: 'Tones',
      last7Days: '7d',
      last30Days: '30d',
      last90Days: '90d',
      export: 'Export',
      exportCSV: 'CSV',
      exportJSON: 'JSON',
      unlockPro: 'Unlock with Pro',
      upgradeDesc: 'Charts, AI recommendations and data export',
      weeklySummary: 'Weekly Summary',
      topPlatform: 'Top Platform',
      topTone: 'Top Tone',
      productivity: 'Productivity',
      generateNow: 'Generate Now',
      vsLastWeek: 'vs last week',
      noData: 'No data',
      loading: 'Loading...'
    }
  }[language] || {};

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashRes = await axios.get(`${API_URL}/api/analytics/dashboard?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashRes.data);

        if (isPro) {
          const [directorRes, recsRes, reportRes] = await Promise.all([
            axios.get(`${API_URL}/api/analytics/ai-director`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/analytics/recommendations`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/analytics/weekly-report`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setAiDirector(directorRes.data);
          setRecommendations(recsRes.data);
          setWeeklyReport(reportRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, period, isPro]);

  const handleExport = async (format) => {
    try {
      const res = await axios.get(`${API_URL}/api/analytics/export?format=${format}&period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (format === 'csv') {
        const blob = new Blob([res.data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = res.data.filename; a.click();
      } else {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `postify_analytics_${period}.json`; a.click();
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

  const overview = dashboardData?.overview || {};
  const trend = weeklyReport?.summary?.vs_last_week > 0 ? 'up' 
    : weeklyReport?.summary?.vs_last_week < 0 ? 'down' 
    : aiDirector?.weekly_summary?.trend || 'stable';

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#111113] border border-white/[0.06] rounded-lg p-0.5">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  period === p ? 'bg-[#FF3B30] text-white' : 'text-gray-500 hover:text-white'
                }`}
                onClick={() => setPeriod(p)}
                data-testid={`period-${p}`}
              >
                {p === '7d' ? t.last7Days : p === '30d' ? t.last30Days : t.last90Days}
              </button>
            ))}
          </div>
          {dashboardData?.can_export && (
            <div className="relative group hidden sm:block">
              <Button variant="outline" size="sm" className="border-white/10 h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />{t.export}
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button className="block w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-white/5 rounded" onClick={() => handleExport('csv')}>{t.exportCSV}</button>
                <button className="block w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-white/5 rounded" onClick={() => handleExport('json')}>{t.exportJSON}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero KPI + Stats */}
      <HeroKPI
        total={overview.total_generations || 0}
        trend={trend}
        trendPercent={weeklyReport?.summary?.vs_last_week}
        dailyAvg={overview.daily_average || 0}
        language={language}
      />
      <StatsRow
        images={overview.total_images || 0}
        favorites={overview.favorites_saved || 0}
        campaigns={overview.campaigns_created || 0}
        language={language}
      />

      {/* Weekly CTA — always visible */}
      <WeeklyCTA language={language} onClick={() => navigate('/create')} />

      {/* AI Insight (merged missed opportunities) */}
      <AIInsight
        missedOpps={weeklyReport?.missed_opportunities}
        insights={aiDirector?.insights}
        language={language}
      />

      {/* Next Steps — lightweight */}
      <NextSteps steps={weeklyReport?.next_steps} language={language} />

      {/* Tabs — charts & detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#111113] border border-white/[0.06] p-1 rounded-xl h-10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />{t.overview}
          </TabsTrigger>
          <TabsTrigger value="ai-director" className="data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <Brain className="w-3.5 h-3.5 mr-1.5" />{t.aiDirector}
            {!isPro && <Lock className="w-3 h-3 ml-1 opacity-50" />}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />{t.recs}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />{t.weekly}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab — charts */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {dashboardData?.can_access_charts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-[#111113] border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{t.totalGenerations}</CardTitle>
                </CardHeader>
                <CardContent><SimpleBarChart data={dashboardData?.chart_data} /></CardContent>
              </Card>

              <Card className="bg-[#111113] border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{t.platformBreakdown}</CardTitle>
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

              <Card className="bg-[#111113] border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{t.contentTypes}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.content_type_breakdown && Object.entries(dashboardData.content_type_breakdown).map(([type, count]) => {
                    const total = Object.values(dashboardData.content_type_breakdown).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const labels = { social_post: 'Social Posts', video_idea: 'Video Ideas', product_description: 'Product Descriptions', image: 'Images', campaign_post: 'Campaign Posts' };
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

              <Card className="bg-[#111113] border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{t.toneDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {dashboardData?.tone_breakdown && Object.entries(dashboardData.tone_breakdown).map(([tone, count]) => (
                      <Badge key={tone} variant="outline" className="border-white/10 text-gray-300">{tone}: {count}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="bg-[#111113] border border-white/[0.06] border-dashed rounded-xl py-12 text-center">
              <Lock className="w-10 h-10 mx-auto mb-3 text-gray-500" />
              <h3 className="text-base font-medium text-white mb-1">{t.unlockPro}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.upgradeDesc}</p>
              <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                <Zap className="w-4 h-4 mr-1.5" />{t.unlockPro}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* AI Director Tab */}
        <TabsContent value="ai-director" className="space-y-4 mt-4">
          {aiDirector?.locked ? (
            <div className="bg-[#111113] border border-white/[0.06] border-dashed rounded-xl py-12 text-center">
              <Brain className="w-12 h-12 mx-auto mb-3 text-[#FF3B30]" />
              <h3 className="text-lg font-semibold text-white mb-1">AI Director</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {language === 'ru' ? 'Персональные рекомендации на базе AI' : 'Personal AI-powered recommendations'}
              </p>
              <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF4D42]" onClick={() => navigate('/pricing')}>
                <Zap className="w-4 h-4 mr-1.5" />{t.unlockPro}
              </Button>
            </div>
          ) : (
            <>
              {/* Weekly Summary — compact */}
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 sm:p-5">
                <p className="text-sm font-medium text-gray-400 mb-3">{t.weeklySummary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: aiDirector?.weekly_summary?.total_content || 0, label: t.totalGenerations },
                    { value: aiDirector?.weekly_summary?.top_platform || '-', label: t.topPlatform, capitalize: true },
                    { value: aiDirector?.weekly_summary?.top_tone || '-', label: t.topTone, capitalize: true },
                    { value: aiDirector?.weekly_summary?.productivity_score || 0, label: t.productivity },
                  ].map(({ value, label, capitalize }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg p-3 text-center">
                      <p className={`text-xl font-bold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations cards */}
              {aiDirector?.recommendations?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiDirector.recommendations.map((rec, i) => (
                    <div key={i} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-[#FF3B30]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{language === 'ru' ? rec.title_ru : rec.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{language === 'ru' ? rec.message_ru : rec.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Director insights */}
              {aiDirector?.insights?.length > 0 && (
                <div className="space-y-2">
                  {aiDirector.insights.map((insight, i) => (
                    <div key={i} className="flex items-center gap-3 px-1">
                      <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-400">{language === 'ru' ? insight.message_ru : insight.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          {recommendations?.locked ? (
            <div className="bg-[#111113] border border-white/[0.06] border-dashed rounded-xl py-12 text-center">
              <Rocket className="w-10 h-10 mx-auto mb-3 text-gray-500" />
              <h3 className="text-base font-medium text-white mb-1">{t.unlockPro}</h3>
              <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF4D42] mt-3" onClick={() => navigate('/pricing')}>
                <Zap className="w-4 h-4 mr-1.5" />{t.unlockPro}
              </Button>
            </div>
          ) : (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#FF3B30]" />
                <p className="text-sm font-medium text-white">{language === 'ru' ? 'Рекомендовано для вас' : 'Recommended for you'}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: language === 'ru' ? 'Платформа' : 'Platform', value: recommendations?.recommendation?.platform, icon: true },
                  { label: language === 'ru' ? 'Тон' : 'Tone', value: recommendations?.recommendation?.tone },
                  { label: language === 'ru' ? 'Формат' : 'Format', value: recommendations?.recommendation?.format },
                  { label: language === 'ru' ? 'Тип' : 'Type', value: recommendations?.recommendation?.content_type?.replace('_', ' ') },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <p className="text-[11px] text-gray-500 mb-1">{label}</p>
                    <div className="flex items-center gap-1.5">
                      {icon && <PlatformIcon platform={value} className="w-4 h-4 text-[#FF3B30]" />}
                      <span className="text-sm text-white font-medium capitalize">{value || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {language === 'ru' ? recommendations?.recommendation?.reason_ru : recommendations?.recommendation?.reason}
              </p>
              {recommendations?.recommendation?.suggested_hashtags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {recommendations.recommendation.suggested_hashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-[#FF3B30]/20 text-[#FF3B30] text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              <Button className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] h-10" onClick={() => navigate('/create')}>
                <Sparkles className="w-4 h-4 mr-2" />{t.generateNow}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="space-y-4 mt-4">
          {weeklyReport?.locked ? (
            <div className="bg-[#111113] border border-white/[0.06] border-dashed rounded-xl py-12 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-500" />
              <h3 className="text-base font-medium text-white mb-1">{t.unlockPro}</h3>
              <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF4D42] mt-3" onClick={() => navigate('/pricing')}>
                <Zap className="w-4 h-4 mr-1.5" />{t.unlockPro}
              </Button>
            </div>
          ) : (
            <>
              {/* Weekly summary */}
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-bold text-white">{weeklyReport?.summary?.total_content || 0}</p>
                    <p className="text-xs text-gray-500">{t.totalGenerations}</p>
                  </div>
                  {weeklyReport?.summary?.vs_last_week != null && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      weeklyReport.summary.vs_last_week > 0 ? 'text-emerald-400' : 
                      weeklyReport.summary.vs_last_week < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {weeklyReport.summary.vs_last_week > 0 ? <ArrowUp className="w-4 h-4" /> : 
                       weeklyReport.summary.vs_last_week < 0 ? <ArrowDown className="w-4 h-4" /> : null}
                      {weeklyReport.summary.vs_last_week || 0}% {t.vsLastWeek}
                    </div>
                  )}
                </div>
              </div>

              {/* Merged missed opportunities — compact AI insight */}
              <AIInsight
                missedOpps={weeklyReport?.missed_opportunities}
                insights={[]}
                language={language}
              />

              {/* Next steps — lightweight */}
              <NextSteps steps={weeklyReport?.next_steps} language={language} />

              {/* CTA */}
              <WeeklyCTA language={language} onClick={() => navigate('/create')} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
