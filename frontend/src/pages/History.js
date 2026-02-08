import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, Download, FileText, Copy, Check, Lock, Clock, Star, Share2, Image, Ratio, Flame, AlertTriangle, RefreshCw, Save, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { SwipeableCards } from '../components/SwipeableCards';
import { useAnalytics } from '../hooks/useAnalytics';
import { useShare } from '../hooks/useShare';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const History = () => {
  const { token, user } = useAuth();
  const { t, language } = useLanguage();
  const { trackInteraction, trackFavorite } = useAnalytics();
  const { shareContent, shareImage } = useShare();
  const [history, setHistory] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [favoriteLoading, setFavoriteLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [downloading, setDownloading] = useState(null);
  const [scores, setScores] = useState({});
  const [savingTemplate, setSavingTemplate] = useState(null);
  const navigate = useNavigate();

  const canExport = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const canFavorite = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  useEffect(() => {
    fetchHistory();
    fetchImageHistory();
    if (canFavorite) {
      fetchFavorites();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImageHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/image-history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImageHistory(response.data.images || []);
    } catch (error) {
      console.error('Failed to fetch image history:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favMap = {};
      response.data.items.forEach(fav => {
        favMap[fav.generation_id] = fav.id;
      });
      setFavorites(favMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const toggleFavorite = async (item) => {
    if (!canFavorite) {
      toast.error(language === 'ru' ? 'Избранное доступно для Pro и Business' : 'Favorites available for Pro and Business');
      return;
    }

    setFavoriteLoading(item.id);
    try {
      if (favorites[item.id]) {
        // Remove from favorites
        await axios.delete(`${API_URL}/api/favorites/${favorites[item.id]}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => {
          const newFav = { ...prev };
          delete newFav[item.id];
          return newFav;
        });
        trackFavorite('remove', item.id);
        toast.success(language === 'ru' ? 'Удалено из избранного' : 'Removed from favorites');
      } else {
        // Add to favorites
        const response = await axios.post(
          `${API_URL}/api/favorites`,
          { generation_id: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(prev => ({ ...prev, [item.id]: response.data.favorite_id }));
        trackFavorite('add', item.id);
        toast.success(language === 'ru' ? 'Добавлено в избранное' : 'Added to favorites');
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Error');
    } finally {
      setFavoriteLoading(null);
    }
  };

  const copyToClipboard = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    trackInteraction('copy', id, 'history');
    toast.success(t('generator.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (content) => {
    await shareContent(content, 'Postify AI');
    trackInteraction('share', null, 'history');
  };

  const handleShareImage = async (imageUrl) => {
    await shareImage(imageUrl, 'Postify AI Image');
    trackInteraction('share', null, 'image_history');
  };

  const handleDownloadImage = async (imageId) => {
    setDownloading(imageId);
    try {
      // Find image in history for fallback
      const image = imageHistory.find(i => i.id === imageId);
      
      // Try fetch API directly (better blob handling)
      const response = await fetch(`${API_URL}/api/download-image/${imageId}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/png, image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Get blob from response
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('Empty blob received');
      }
      
      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `postify-${imageId}.png`;
      link.style.display = 'none';
      
      // Append, click, remove
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 300);
      
      trackInteraction('download', imageId, 'image_history');
      toast.success(language === 'ru' ? 'Изображение скачано!' : 'Image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback - try direct image URL
      const image = imageHistory.find(i => i.id === imageId);
      if (image?.image_url) {
        try {
          // Try fetching the image directly
          const directResponse = await fetch(image.image_url);
          const blob = await directResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `postify-${imageId}.png`;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 300);
          
          toast.success(language === 'ru' ? 'Изображение скачано!' : 'Image downloaded!');
        } catch (directError) {
          // Final fallback - open in new tab
          window.open(image.image_url, '_blank');
          toast.info(language === 'ru' ? 'Открыто в новой вкладке - сохраните правой кнопкой мыши' : 'Opened in new tab - right-click to save');
        }
      } else {
        toast.error(language === 'ru' ? 'Ошибка скачивания' : 'Download failed');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleExport = async (format) => {
    if (!canExport) {
      toast.error(t('history.upgradeHint'));
      return;
    }

    setExporting(format);
    try {
      const response = await axios.get(`${API_URL}/api/history/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `postify_history_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(language === 'ru' ? `История экспортирована в ${format.toUpperCase()}` : `History exported as ${format.toUpperCase()}`);
    } catch (error) {
      const message = error.response?.data?.detail || (language === 'ru' ? `Ошибка экспорта ${format.toUpperCase()}` : `Failed to export ${format.toUpperCase()}`);
      toast.error(message);
    } finally {
      setExporting(null);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContentType = (type) => {
    if (language === 'ru') {
      const types = {
        'social_post': 'Пост для соцсетей',
        'video_idea': 'Идеи для видео',
        'product_description': 'Описание продукта'
      };
      return types[type] || type;
    }
    const types = {
      'social_post': 'Social Media Post',
      'video_idea': 'Video Ideas',
      'product_description': 'Product Description'
    };
    return types[type] || type;
  };

  const formatAspectRatio = (ratio) => {
    if (!ratio) return null;
    const descriptions = {
      '1:1': language === 'ru' ? 'Квадрат' : 'Square',
      '9:16': language === 'ru' ? 'Портрет' : 'Portrait',
      '16:9': language === 'ru' ? 'Альбом' : 'Landscape'
    };
    return descriptions[ratio] || ratio;
  };

  const fetchScore = async (contentId) => {
    if (scores[contentId] || !isPro) return;
    try {
      const res = await axios.get(`${API_URL}/api/content/${contentId}/score`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScores(prev => ({ ...prev, [contentId]: res.data }));
    } catch { /* silent */ }
  };

  // Fetch scores for all visible items
  React.useEffect(() => {
    if (isPro && history.length > 0) {
      history.slice(0, 10).forEach(item => fetchScore(item.id));
    }
  }, [history, isPro]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDuplicate = async (item) => {
    navigate(`/create?tab=${item.content_type}&topic=${encodeURIComponent(item.topic || '')}&platform=${item.platform || 'instagram'}&tone=${item.tone || 'professional'}`);
    toast.success(language === 'ru' ? 'Данные загружены в генератор' : 'Data loaded into generator');
  };

  const handleRegenerate = async (item) => {
    navigate(`/create?tab=${item.content_type}&topic=${encodeURIComponent(item.topic || '')}&platform=${item.platform || 'instagram'}&tone=${item.tone || 'professional'}&regenerate=true`);
  };

  const handleSaveTemplate = async (item) => {
    if (!isPro) {
      toast.error(language === 'ru' ? 'Шаблоны доступны для Pro' : 'Templates require Pro plan');
      return;
    }
    setSavingTemplate(item.id);
    try {
      await axios.post(`${API_URL}/api/content/${item.id}/save-template`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === 'ru' ? 'Сохранено как шаблон' : 'Saved as template');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    } finally {
      setSavingTemplate(null);
    }
  };

  const getScoreBadge = (scoreData) => {
    if (!scoreData) return null;
    const overall = scoreData.score || scoreData.overall_score || scoreData.overall || 0;
    if (overall >= 70) return { color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: Flame, value: overall };
    if (overall >= 40) return { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Zap, value: overall };
    return { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertTriangle, value: overall };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Clock className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('history.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('history.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting !== null || !canExport || history.length === 0}
            className={`border-white/20 text-white hover:bg-white/10 ${!canExport ? "opacity-60" : ""}`}
            data-testid="export-csv-btn"
          >
            {exporting === 'csv' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            CSV
            {!canExport && <Lock className="w-3 h-3 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null || !canExport || history.length === 0}
            className={`border-white/20 text-white hover:bg-white/10 ${!canExport ? "opacity-60" : ""}`}
            data-testid="export-pdf-btn"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            PDF
            {!canExport && <Lock className="w-3 h-3 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Export Upgrade Hint */}
      {!canExport && history.length > 0 && (
        <Card className="bg-[#FF3B30]/10 border-[#FF3B30]/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF3B30]/20 rounded-lg">
                <Download className="w-5 h-5 text-[#FF3B30]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {t('history.exportHint')}
                </p>
                <p className="text-sm text-gray-400">
                  {t('history.upgradeHint')}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#FF3B30] hover:bg-[#FF4D42]"
                onClick={() => window.location.href = '/settings'}
              >
                {t('history.upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Content and Images */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111113] border border-white/10 p-1 rounded-xl">
          <TabsTrigger 
            value="content" 
            className="flex items-center gap-2 data-[state=active]:bg-white/10 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            {language === 'ru' ? 'Контент' : 'Content'}
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{history.length}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="images" 
            className="flex items-center gap-2 data-[state=active]:bg-white/10 rounded-lg"
          >
            <Image className="w-4 h-4" />
            {language === 'ru' ? 'Изображения' : 'Images'}
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{imageHistory.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-4">
          {history.length === 0 ? (
            <Card className="bg-[#111113] border-white/10">
              <CardContent>
                <EmptyState type="history" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="bg-[#111113] border-white/10" data-testid="history-item">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-lg text-white flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {formatContentType(item.content_type)}
                            {scores[item.id] && (() => {
                              const badge = getScoreBadge(scores[item.id]);
                              if (!badge) return null;
                              const Icon = badge.icon;
                              return (
                                <Badge className={`${badge.color} text-xs`} data-testid={`score-badge-${item.id}`}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {badge.value}/100
                                </Badge>
                              );
                            })()}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {item.topic} • {formatDate(item.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(item)}
                          className="text-gray-500 hover:text-white hover:bg-white/10"
                          title={language === 'ru' ? 'Дублировать' : 'Duplicate'}
                          data-testid={`duplicate-btn-${item.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(item)}
                          className="text-gray-500 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
                          title={language === 'ru' ? 'Улучшить' : 'Regenerate'}
                          data-testid={`regenerate-btn-${item.id}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveTemplate(item)}
                          disabled={savingTemplate === item.id || !isPro}
                          className="text-gray-500 hover:text-white hover:bg-white/10"
                          title={isPro ? (language === 'ru' ? 'Сохранить как шаблон' : 'Save as template') : 'Pro'}
                          data-testid={`template-btn-${item.id}`}
                        >
                          {savingTemplate === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {!isPro && <Lock className="w-3 h-3 ml-0.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(item)}
                          disabled={favoriteLoading === item.id}
                          className={`${favorites[item.id] ? 'text-yellow-500 hover:text-yellow-400' : 'text-gray-500 hover:text-yellow-500'} hover:bg-yellow-500/10`}
                          title={canFavorite ? (favorites[item.id] ? (language === 'ru' ? 'Удалить из избранного' : 'Remove from favorites') : (language === 'ru' ? 'Добавить в избранное' : 'Add to favorites')) : (language === 'ru' ? 'Доступно для Pro' : 'Pro feature')}
                          data-testid={`favorite-btn-${item.id}`}
                        >
                          {favoriteLoading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className={`w-4 h-4 ${favorites[item.id] ? 'fill-current' : ''}`} />
                      )}
                      {!canFavorite && <Lock className="w-3 h-3 ml-1" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.generated_content, item.id)}
                      className="text-[#FF3B30] hover:text-[#FF3B30]/80 hover:bg-[#FF3B30]/10"
                      data-testid={`copy-btn-${item.id}`}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {t('generator.copied').replace('!', '')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          {t('generator.copy')}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(item.generated_content)}
                      className="text-gray-500 hover:text-white hover:bg-white/10"
                      data-testid={`share-btn-${item.id}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0A0A0B] p-4 rounded-xl border border-white/5 text-sm whitespace-pre-wrap text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.generated_content.length > 300
                    ? item.generated_content.substring(0, 300) + '...'
                    : item.generated_content}
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  {language === 'ru' ? 'Тон' : 'Tone'}: {item.tone} • {item.tokens_used} {t('history.tokens')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-4">
          {imageHistory.length === 0 ? (
            <Card className="bg-[#111113] border-white/10">
              <CardContent className="py-12 text-center">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">
                  {language === 'ru' ? 'Нет сгенерированных изображений' : 'No generated images yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageHistory.map((image) => (
                <Card 
                  key={image.id} 
                  className="bg-[#111113] border-white/10 overflow-hidden group" 
                  data-testid="image-history-item"
                >
                  <div className="relative aspect-square">
                    <img 
                      src={image.image_url} 
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                    {/* Aspect Ratio Badge */}
                    {image.aspect_ratio && (
                      <div 
                        className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-[#FF3B30]/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white shadow-lg"
                        data-testid={`aspect-ratio-badge-${image.id}`}
                      >
                        <Ratio className="w-3 h-3" />
                        <span>{image.aspect_ratio}</span>
                      </div>
                    )}
                    {/* Platform Badge */}
                    {image.platform && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-[#FF3B30]/80 backdrop-blur-sm rounded-lg text-xs text-white capitalize">
                        {image.platform}
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        onClick={() => handleDownloadImage(image.id)}
                        disabled={downloading === image.id}
                        data-testid={`download-image-btn-${image.id}`}
                      >
                        {downloading === image.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        onClick={() => handleShareImage(image.image_url)}
                        data-testid={`share-image-btn-${image.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-400 line-clamp-2" title={image.prompt}>
                      {image.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600">
                        {formatDate(image.created_at)}
                      </span>
                      {image.style && (
                        <span className="text-xs text-gray-500 capitalize">
                          {image.style}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};