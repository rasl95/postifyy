import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePricing } from '../contexts/PricingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight,
  Instagram, Youtube, MessageCircle, Zap, Send, Check, X,
  Loader2, Lock, Sparkles, Trash2, Play, AlertTriangle, Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLATFORMS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
  { id: 'tiktok', icon: Zap, label: 'TikTok', color: '#00F2EA' },
  { id: 'telegram', icon: MessageCircle, label: 'Telegram', color: '#0088CC' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' }
];

const CONTENT_TYPES = [
  { id: 'post', label: { en: 'Post', ru: 'Пост' } },
  { id: 'video', label: { en: 'Video', ru: 'Видео' } },
  { id: 'story', label: { en: 'Story', ru: 'Сторис' } }
];

const STATUS_CONFIG = {
  scheduled: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: { en: 'Scheduled', ru: 'Запланирован' } },
  published: { color: 'bg-green-500/15 text-green-400 border-green-500/30', label: { en: 'Published', ru: 'Опубликован' } },
  failed: { color: 'bg-red-500/15 text-red-400 border-red-500/30', label: { en: 'Failed', ru: 'Ошибка' } }
};

const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
};

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
};

export const Scheduler = () => {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const { showUpgradeModal } = usePricing();
  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState(null);
  const [publishing, setPublishing] = useState(null);

  const [newPost, setNewPost] = useState({
    content: '',
    platform: 'instagram',
    content_type: 'post',
    scheduled_time: ''
  });

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/scheduler/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.posts);
    } catch { /* */ }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/scheduler/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch { /* */ }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchPosts, fetchStats]);

  const handleCreatePost = async () => {
    if (!newPost.content || !newPost.scheduled_time) {
      toast.error(language === 'ru' ? 'Заполните все поля' : 'Fill in all fields');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/scheduler/posts`, newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === 'ru' ? 'Пост запланирован' : 'Post scheduled');
      setShowNewPost(false);
      setNewPost({ content: '', platform: 'instagram', content_type: 'post', scheduled_time: '' });
      fetchPosts();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/scheduler/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(language === 'ru' ? 'Удалено' : 'Deleted');
      fetchStats();
    } catch { toast.error('Error'); }
  };

  const handlePublish = async (postId) => {
    setPublishing(postId);
    try {
      const res = await axios.post(`${API_URL}/api/scheduler/posts/${postId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'published') {
        toast.success(language === 'ru' ? 'Опубликовано!' : 'Published!');
      } else {
        toast.error(res.data.message);
      }
      fetchPosts();
      fetchStats();
    } catch { toast.error('Publish failed'); }
    finally { setPublishing(null); }
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/scheduler/ai-suggest`, {
        platform: newPost.platform,
        content_type: newPost.content_type,
        count: 3
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAiSuggestions(res.data.suggestions);
      setShowAISuggest(true);
    } catch { toast.error('Error'); }
    finally { setAiLoading(false); }
  };

  const applySuggestion = (suggestion) => {
    setNewPost(prev => ({ ...prev, scheduled_time: suggestion.datetime.slice(0, 16) }));
    setShowAISuggest(false);
    toast.success(language === 'ru' ? 'Время применено' : 'Time applied');
  };

  // Calendar helpers
  const navigateDate = (dir) => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];
    for (let i = -startOffset; i <= lastDay.getDate() - 1; i++) {
      const d = new Date(year, month, i + 1);
      days.push(d);
    }
    return days;
  };

  const getPostsForDate = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return posts.filter(p => p.scheduled_time?.slice(0, 10) === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return isoStr.slice(11, 16);
  };

  // Locked state for free users
  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20" data-testid="scheduler-locked">
        <div className="w-20 h-20 rounded-3xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-[#FF3B30]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {language === 'ru' ? 'Планировщик постов' : 'Post Scheduler'}
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          {language === 'ru'
            ? 'Планируйте публикации, получайте AI-рекомендации лучшего времени и автоматизируйте контент.'
            : 'Schedule posts, get AI time recommendations, and automate your content.'}
        </p>
        <Button onClick={() => showUpgradeModal('scheduler')} className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white">
          {language === 'ru' ? 'Разблокировать Pro' : 'Unlock Pro'}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin" />
      </div>
    );
  }

  const weekDays = viewMode === 'week' ? getWeekDays() : getMonthDays();

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="scheduler-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Планировщик' : 'Scheduler'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {language === 'ru' ? 'Планируйте и автоматизируйте публикации' : 'Plan and automate your posts'}
          </p>
        </div>
        <Button
          onClick={() => setShowNewPost(true)}
          className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
          data-testid="new-scheduled-post-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Новый пост' : 'New Post'}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="scheduler-stats">
          {[
            { label: language === 'ru' ? 'Запланировано' : 'Scheduled', value: stats.scheduled, color: 'text-blue-400' },
            { label: language === 'ru' ? 'Опубликовано' : 'Published', value: stats.published, color: 'text-green-400' },
            { label: language === 'ru' ? 'Ошибки' : 'Failed', value: stats.failed, color: 'text-red-400' },
            { label: language === 'ru' ? 'Часов сэкономлено' : 'Hours saved', value: stats.hours_saved, color: 'text-[#FF3B30]' },
          ].map((s, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)} data-testid="cal-prev">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-white min-w-[180px] text-center">
            {viewMode === 'week'
              ? `${getWeekDays()[0].toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })} — ${getWeekDays()[6].toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}`
              : MONTH_NAMES[language]?.[currentDate.getMonth()] + ' ' + currentDate.getFullYear()
            }
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigateDate(1)} data-testid="cal-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['week', 'month'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === mode ? 'bg-[#FF3B30] text-white' : 'text-gray-400 hover:text-white'}`}
              data-testid={`view-${mode}`}
            >
              {mode === 'week' ? (language === 'ru' ? 'Неделя' : 'Week') : (language === 'ru' ? 'Месяц' : 'Month')}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} border-b border-white/10`}>
            {(DAY_NAMES[language] || DAY_NAMES.en).map((day, i) => (
              <div key={i} className="p-3 text-center text-xs font-medium text-gray-500 border-r border-white/5 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          {viewMode === 'week' ? (
            <div className="grid grid-cols-7 min-h-[280px]">
              {weekDays.map((date, i) => {
                const dayPosts = getPostsForDate(date);
                return (
                  <div
                    key={i}
                    className={`border-r border-white/5 last:border-r-0 p-2 ${isToday(date) ? 'bg-[#FF3B30]/5' : ''}`}
                    data-testid={`cal-day-${date.toISOString().slice(0, 10)}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${isToday(date) ? 'text-[#FF3B30]' : 'text-gray-400'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.map(post => {
                        const platform = PLATFORMS.find(p => p.id === post.platform);
                        const PIcon = platform?.icon || Send;
                        const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.scheduled;
                        return (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="w-full text-left p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
                            data-testid={`scheduled-post-${post.id}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <PIcon className="w-3 h-3 shrink-0" style={{ color: platform?.color }} />
                              <span className="text-[10px] text-gray-400">{formatTime(post.scheduled_time)}</span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5">{post.content.slice(0, 50)}</p>
                            <Badge className={`${statusCfg.color} text-[9px] mt-1 px-1 py-0`}>
                              {statusCfg.label[language] || statusCfg.label.en}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {weekDays.map((date, i) => {
                const dayPosts = getPostsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                return (
                  <div
                    key={i}
                    className={`border-r border-b border-white/5 last:border-r-0 p-2 min-h-[80px] ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    } ${isToday(date) ? 'bg-[#FF3B30]/5' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday(date) ? 'text-[#FF3B30]' : 'text-gray-500'}`}>
                      {date.getDate()}
                    </div>
                    {dayPosts.slice(0, 2).map(post => {
                      const platform = PLATFORMS.find(p => p.id === post.platform);
                      return (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="w-full text-left mb-0.5 px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1"
                        >
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: platform?.color || '#fff' }} />
                          <span className="text-[10px] text-gray-400 truncate">{formatTime(post.scheduled_time)}</span>
                        </button>
                      );
                    })}
                    {dayPosts.length > 2 && (
                      <span className="text-[10px] text-gray-600">+{dayPosts.length - 2}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="sm:max-w-lg bg-[#111113] border-white/10" data-testid="new-post-modal">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#FF3B30]" />
              {language === 'ru' ? 'Запланировать пост' : 'Schedule Post'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {language === 'ru' ? 'Выберите платформу, время и содержание' : 'Choose platform, time, and content'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Platform */}
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setNewPost(prev => ({ ...prev, platform: p.id }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    newPost.platform === p.id
                      ? 'border-[#FF3B30] bg-[#FF3B30]/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  data-testid={`schedule-platform-${p.id}`}
                >
                  <p.icon className="w-4 h-4" style={{ color: newPost.platform === p.id ? p.color : '#9CA3AF' }} />
                  <span className="text-xs text-white">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Content Type */}
            <div className="flex gap-2">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setNewPost(prev => ({ ...prev, content_type: ct.id }))}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    newPost.content_type === ct.id
                      ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]'
                      : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {ct.label[language] || ct.label.en}
                </button>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder={language === 'ru' ? 'Текст поста...' : 'Post content...'}
              className="w-full h-28 p-3 bg-[#0A0A0B] border border-white/10 rounded-lg text-white text-sm resize-none focus:border-[#FF3B30]/50 focus:outline-none"
              data-testid="schedule-content-input"
            />

            {/* DateTime + AI */}
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={newPost.scheduled_time}
                onChange={(e) => setNewPost(prev => ({ ...prev, scheduled_time: e.target.value }))}
                className="flex-1 bg-[#0A0A0B] border-white/10 text-white"
                data-testid="schedule-datetime-input"
              />
              <Button
                variant="outline"
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="shrink-0"
                data-testid="ai-suggest-time-btn"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1 text-[#FF3B30]" />}
                AI
              </Button>
            </div>

            <Button
              onClick={handleCreatePost}
              className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
              data-testid="confirm-schedule-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Запланировать' : 'Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={showAISuggest} onOpenChange={setShowAISuggest}>
        <DialogContent className="sm:max-w-md bg-[#111113] border-white/10" data-testid="ai-suggest-modal">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF3B30]" />
              {language === 'ru' ? 'AI-рекомендации' : 'AI Suggestions'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {language === 'ru' ? 'Лучшее время для публикации' : 'Best times to post'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(s)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all group"
                data-testid={`ai-suggestion-${i}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF3B30]/15 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#FF3B30]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white capitalize">
                        {s.day} • {s.time}
                      </div>
                      <div className="text-xs text-gray-400">{s.reason}</div>
                    </div>
                  </div>
                  <Badge className="bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30">
                    {Math.round(s.confidence * 100)}%
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-md bg-[#111113] border-white/10" data-testid="post-detail-modal">
          {selectedPost && (() => {
            const platform = PLATFORMS.find(p => p.id === selectedPost.platform);
            const PIcon = platform?.icon || Send;
            const statusCfg = STATUS_CONFIG[selectedPost.status] || STATUS_CONFIG.scheduled;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl text-white flex items-center gap-2">
                    <PIcon className="w-5 h-5" style={{ color: platform?.color }} />
                    {platform?.label || selectedPost.platform}
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="text-gray-400 flex items-center gap-2">
                      <Badge className={statusCfg.color}>{statusCfg.label[language] || statusCfg.label.en}</Badge>
                      <span>{selectedPost.scheduled_time?.replace('T', ' ').slice(0, 16)}</span>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <div className="bg-[#0A0A0B] p-4 rounded-lg border border-white/10 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedPost.content}
                  </div>
                  {selectedPost.error && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {selectedPost.error}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    {selectedPost.status === 'scheduled' && (
                      <Button
                        onClick={() => { handlePublish(selectedPost.id); setSelectedPost(null); }}
                        disabled={publishing === selectedPost.id}
                        className="flex-1 bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
                        data-testid="publish-now-btn"
                      >
                        {publishing === selectedPost.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {language === 'ru' ? 'Опубликовать сейчас' : 'Publish now'}
                      </Button>
                    )}
                    {selectedPost.status === 'failed' && (
                      <Button
                        onClick={() => { handlePublish(selectedPost.id); setSelectedPost(null); }}
                        className="flex-1 bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Повторить' : 'Retry'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => { handleDelete(selectedPost.id); setSelectedPost(null); }}
                      className="text-red-400 hover:text-red-300 border-red-400/30"
                      data-testid="delete-post-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduler;
