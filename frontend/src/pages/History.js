import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Loader2, Download, FileText, Copy, Check, Lock, Clock, Star, 
  Share2, Image, Ratio, RefreshCw, Save, MoreHorizontal, ChevronDown, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { useAnalytics } from '../hooks/useAnalytics';
import { useShare } from '../hooks/useShare';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const CONTENT_PREVIEW_LINES = 6;
const CONTENT_CHAR_LIMIT = 280;

// ─── Overflow Menu ───
const OverflowMenu = ({ children, isOpen, onToggle, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        data-testid="overflow-menu-btn"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A1C] border border-white/10 rounded-xl shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, danger, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
      danger 
        ? 'text-red-400 hover:bg-red-500/10' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    {label}
  </button>
);

// ─── Expandable Content ───
const ExpandableContent = ({ content }) => {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > CONTENT_CHAR_LIMIT;

  return (
    <div className="relative">
      <div
        className="text-[15px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {expanded || !isLong ? content : content.slice(0, CONTENT_CHAR_LIMIT)}
      </div>
      {isLong && !expanded && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111113] to-transparent pointer-events-none" />
          <button
            onClick={() => setExpanded(true)}
            className="relative z-10 flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors mt-1 pt-1"
            data-testid="expand-content-btn"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            {language === 'ru' ? 'Развернуть' : 'Show more'}
          </button>
        </>
      )}
      {isLong && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors mt-2"
        >
          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
          {language === 'ru' ? 'Свернуть' : 'Show less'}
        </button>
      )}
    </div>
  );
};

// ─── Content Card ───
const HistoryCard = ({
  item, language, copiedId, favorites, canFavorite, isPro,
  favoriteLoading, savingTemplate, onCopy, onFavorite,
  onRegenerate, onSaveTemplate, onShare, onDelete
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatContentType = (type) => {
    const ru = { social_post: 'Пост для соцсетей', video_idea: 'Идеи для видео', product_description: 'Описание продукта' };
    const en = { social_post: 'Social Media Post', video_idea: 'Video Ideas', product_description: 'Product Description' };
    return (language === 'ru' ? ru : en)[type] || type;
  };

  const formatShortDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-colors"
      data-testid="history-item"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-white truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
            {formatContentType(item.content_type)}
          </h3>
          {item.topic && (
            <p className="text-sm text-gray-500 truncate mt-0.5">{item.topic}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 ml-3 -mr-1.5 flex-shrink-0">
          {/* Favorite */}
          <button
            onClick={() => onFavorite(item)}
            disabled={favoriteLoading === item.id}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              favorites[item.id]
                ? 'text-amber-400 hover:bg-amber-500/10'
                : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
            }`}
            title={canFavorite
              ? (favorites[item.id] ? (language === 'ru' ? 'Убрать' : 'Unfavorite') : (language === 'ru' ? 'В избранное' : 'Favorite'))
              : 'Pro'}
            data-testid={`favorite-btn-${item.id}`}
          >
            {favoriteLoading === item.id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Star className={`w-4 h-4 ${favorites[item.id] ? 'fill-current' : ''}`} />}
          </button>

          {/* Copy */}
          <button
            onClick={() => onCopy(item.generated_content, item.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
            data-testid={`copy-btn-${item.id}`}
          >
            {copiedId === item.id
              ? <Check className="w-4 h-4 text-green-400" />
              : <Copy className="w-4 h-4" />}
          </button>

          {/* Overflow */}
          <OverflowMenu
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(p => !p)}
            onClose={() => setMenuOpen(false)}
          >
            <MenuItem
              icon={RefreshCw}
              label={language === 'ru' ? 'Улучшить' : 'Regenerate'}
              onClick={() => { setMenuOpen(false); onRegenerate(item); }}
            />
            <MenuItem
              icon={Save}
              label={language === 'ru' ? 'Сохранить шаблон' : 'Save template'}
              onClick={() => { setMenuOpen(false); onSaveTemplate(item); }}
              disabled={!isPro}
              loading={savingTemplate === item.id}
            />
            <MenuItem
              icon={Share2}
              label={language === 'ru' ? 'Поделиться' : 'Share'}
              onClick={() => { setMenuOpen(false); onShare(item.generated_content); }}
            />
            <div className="my-1 border-t border-white/5" />
            <MenuItem
              icon={Trash2}
              label={language === 'ru' ? 'Удалить' : 'Delete'}
              onClick={() => { setMenuOpen(false); onDelete?.(item); }}
              danger
            />
          </OverflowMenu>
        </div>
      </div>

      {/* Content body */}
      <div className="px-4 sm:px-5 py-3 sm:py-4">
        <ExpandableContent content={item.generated_content} />
      </div>

      {/* Meta footer */}
      <div className="px-4 sm:px-5 pb-3.5 sm:pb-4 flex items-center gap-2 text-xs text-gray-500">
        <span>{language === 'ru' ? 'Создано' : 'Created'} {formatShortDate(item.created_at)}</span>
        {item.tone && item.tone !== 'neutral' && (
          <>
            <span className="text-gray-600">·</span>
            <span className="capitalize">{item.tone}</span>
          </>
        )}
        {item.platform && (
          <>
            <span className="text-gray-600">·</span>
            <span className="capitalize">{item.platform}</span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main History Page ───
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
  const [savingTemplate, setSavingTemplate] = useState(null);
  const navigate = useNavigate();

  const canExport = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const canFavorite = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  useEffect(() => {
    fetchHistory();
    fetchImageHistory();
    if (canFavorite) fetchFavorites();
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
      setImageHistory(response.data.items || []);
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
      response.data.items.forEach(fav => { favMap[fav.generation_id] = fav.id; });
      setFavorites(favMap);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const toggleFavorite = async (item) => {
    if (!canFavorite) {
      toast.error(language === 'ru' ? 'Избранное доступно для Pro' : 'Favorites require Pro');
      return;
    }
    setFavoriteLoading(item.id);
    try {
      if (favorites[item.id]) {
        await axios.delete(`${API_URL}/api/favorites/${favorites[item.id]}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => { const n = { ...prev }; delete n[item.id]; return n; });
        trackFavorite('remove', item.id);
        toast.success(language === 'ru' ? 'Убрано из избранного' : 'Removed');
      } else {
        const response = await axios.post(`${API_URL}/api/favorites`, { generation_id: item.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => ({ ...prev, [item.id]: response.data.favorite_id }));
        trackFavorite('add', item.id);
        toast.success(language === 'ru' ? 'Добавлено в избранное' : 'Added to favorites');
      }
    } catch { toast.error(language === 'ru' ? 'Ошибка' : 'Error'); }
    finally { setFavoriteLoading(null); }
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
      const response = await fetch(`${API_URL}/api/download-image/${imageId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'image/png, image/*' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob || blob.size === 0) throw new Error('Empty blob');
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `postify-${imageId}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.contains(link) && document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl); }, 300);
      trackInteraction('download', imageId, 'image_history');
      toast.success(language === 'ru' ? 'Скачано!' : 'Downloaded!');
    } catch {
      const image = imageHistory.find(i => i.id === imageId);
      if (image?.image_url) {
        try {
          const r = await fetch(image.image_url);
          const blob = await r.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl; link.download = `postify-${imageId}.png`;
          document.body.appendChild(link); link.click();
          setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl); }, 300);
          toast.success(language === 'ru' ? 'Скачано!' : 'Downloaded!');
        } catch {
          window.open(image.image_url, '_blank');
          toast.info(language === 'ru' ? 'Открыто в новой вкладке' : 'Opened in new tab');
        }
      } else {
        toast.error(language === 'ru' ? 'Ошибка скачивания' : 'Download failed');
      }
    } finally { setDownloading(null); }
  };

  const handleExport = async (format) => {
    if (!canExport) { toast.error(t('history.upgradeHint')); return; }
    setExporting(format);
    try {
      const response = await axios.get(`${API_URL}/api/history/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `postify_history_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(language === 'ru' ? `Экспортировано в ${format.toUpperCase()}` : `Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Export failed`);
    } finally { setExporting(null); }
  };

  const handleRegenerate = (item) => {
    navigate(`/create?tab=${item.content_type}&topic=${encodeURIComponent(item.topic || '')}&platform=${item.platform || 'instagram'}&tone=${item.tone || 'professional'}&regenerate=true`);
  };

  const handleSaveTemplate = async (item) => {
    if (!isPro) { toast.error(language === 'ru' ? 'Шаблоны для Pro' : 'Templates require Pro'); return; }
    setSavingTemplate(item.id);
    try {
      await axios.post(`${API_URL}/api/content/${item.id}/save-template`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(language === 'ru' ? 'Сохранено как шаблон' : 'Saved as template');
    } catch (error) { toast.error(error.response?.data?.detail || 'Error'); }
    finally { setSavingTemplate(null); }
  };

  const handleDelete = async (item) => {
    try {
      await axios.delete(`${API_URL}/api/history/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(prev => prev.filter(h => h.id !== item.id));
      toast.success(language === 'ru' ? 'Удалено' : 'Deleted');
    } catch {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Delete failed');
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t('history.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('history.subtitle')}</p>
        </div>
        {canExport && history.length > 0 && (
          <div className="flex gap-2">
            {['csv', 'pdf'].map(fmt => (
              <Button key={fmt} variant="outline" size="sm"
                onClick={() => handleExport(fmt)}
                disabled={exporting !== null}
                className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 h-8 text-xs"
                data-testid={`export-${fmt}-btn`}
              >
                {exporting === fmt ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111113] border border-white/[0.06] p-1 rounded-xl h-10">
          <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <FileText className="w-3.5 h-3.5" />
            {language === 'ru' ? 'Контент' : 'Content'}
            <span className="text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded-md text-gray-500">{history.length}</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2 data-[state=active]:bg-white/[0.06] rounded-lg text-sm">
            <Image className="w-3.5 h-3.5" />
            {language === 'ru' ? 'Изображения' : 'Images'}
            <span className="text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded-md text-gray-500">{imageHistory.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-4">
          {history.length === 0 ? (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-12">
              <EmptyState type="history" size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  language={language}
                  copiedId={copiedId}
                  favorites={favorites}
                  canFavorite={canFavorite}
                  isPro={isPro}
                  favoriteLoading={favoriteLoading}
                  savingTemplate={savingTemplate}
                  onCopy={copyToClipboard}
                  onFavorite={toggleFavorite}
                  onRegenerate={handleRegenerate}
                  onSaveTemplate={handleSaveTemplate}
                  onShare={handleShare}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-4">
          {imageHistory.length === 0 ? (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl py-12 text-center">
              <Image className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 text-sm">
                {language === 'ru' ? 'Нет изображений' : 'No images yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imageHistory.map(image => (
                <div key={image.id} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden group" data-testid="image-history-item">
                  <div className="relative aspect-square">
                    <img src={image.image_url} alt={image.prompt} className="w-full h-full object-cover" />
                    {image.aspect_ratio && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] text-white/80">
                        <Ratio className="w-2.5 h-2.5" />{image.aspect_ratio}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownloadImage(image.id)}
                        disabled={downloading === image.id}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-colors"
                        data-testid={`download-image-btn-${image.id}`}
                      >
                        {downloading === image.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleShareImage(image.image_url)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-colors"
                        data-testid={`share-image-btn-${image.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{image.prompt}</p>
                    <p className="text-[11px] text-gray-600 mt-1.5">{formatDate(image.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
