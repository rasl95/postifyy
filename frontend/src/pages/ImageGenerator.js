import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Image, Loader2, Download, Sparkles, Wand2, Camera, Palette, 
  Clock, Instagram, Youtube, Mail, Check, Layers,
  Zap, Settings, Lock, Share2, RefreshCw, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GenerationProgress } from '../components/GenerationProgress';
import { useAnalytics } from '../hooks/useAnalytics';
import { useShare } from '../hooks/useShare';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STYLES = [
  { value: 'realistic', label: { en: 'Realistic', ru: 'Реалистичный' }, icon: '📷' },
  { value: 'artistic', label: { en: 'Artistic', ru: 'Художественный' }, icon: '🎨' },
  { value: 'cartoon', label: { en: 'Cartoon', ru: 'Мультяшный' }, icon: '🎬' },
  { value: 'minimalist', label: { en: 'Minimalist', ru: 'Минималистичный' }, icon: '⬜' },
  { value: 'premium', label: { en: 'Premium', ru: 'Премиум' }, icon: '✨' },
  { value: 'dark', label: { en: 'Dark', ru: 'Тёмный' }, icon: '🌙' },
  { value: 'futuristic', label: { en: 'Futuristic', ru: 'Футуризм' }, icon: '🚀' },
  { value: 'playful', label: { en: 'Playful', ru: 'Игривый' }, icon: '🎉' }
];

// Platform presets with auto-assigned ratios
const PLATFORMS = [
  { id: 'instagram', name: { en: 'Instagram', ru: 'Instagram' }, icon: Instagram, ratio: '1:1', description: { en: 'Square post', ru: 'Квадратный пост' } },
  { id: 'tiktok', name: { en: 'TikTok', ru: 'TikTok' }, icon: Zap, ratio: '9:16', description: { en: 'Vertical video', ru: 'Вертикальное видео' } },
  { id: 'youtube', name: { en: 'YouTube', ru: 'YouTube' }, icon: Youtube, ratio: '16:9', description: { en: 'Thumbnail', ru: 'Превью' } },
  { id: 'telegram', name: { en: 'Telegram', ru: 'Telegram' }, icon: Mail, ratio: '16:9', description: { en: 'Channel post', ru: 'Пост в канал' } },
  { id: 'email', name: { en: 'Email', ru: 'Email' }, icon: Mail, ratio: '1:1', description: { en: 'Newsletter', ru: 'Рассылка' } }
];

// Unique aspect ratios for custom mode
const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', description: { en: 'Square', ru: 'Квадрат' }, icon: '⬜' },
  { id: '9:16', label: '9:16', description: { en: 'Portrait', ru: 'Портрет' }, icon: '📱' },
  { id: '16:9', label: '16:9', description: { en: 'Landscape', ru: 'Альбом' }, icon: '🖥️' }
];

export const ImageGenerator = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const { trackGeneration, trackInteraction } = useAnalytics();
  const { shareImage, isNativeShareAvailable } = useShare();
  
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
  const [style, setStyle] = useState('realistic');
  const [useBrandStyle, setUseBrandStyle] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [customRatioMode, setCustomRatioMode] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [usage, setUsage] = useState({ current: 0, limit: 2 });
  const [brandProfile, setBrandProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [selectedBatchPlatforms, setSelectedBatchPlatforms] = useState([]);
  const [batchResults, setBatchResults] = useState([]);

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
  const isBusiness = user?.subscription_plan === 'business';

  // Get current aspect ratio based on mode
  const getCurrentRatio = () => {
    if (customRatioMode) {
      return selectedRatio;
    }
    if (selectedPlatform) {
      const platform = PLATFORMS.find(p => p.id === selectedPlatform);
      return platform?.ratio || '1:1';
    }
    return '1:1';
  };

  // Handle platform selection (auto-assigns ratio)
  const handlePlatformSelect = (platformId) => {
    if (selectedPlatform === platformId) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(platformId);
      // Auto-assign ratio from platform
      const platform = PLATFORMS.find(p => p.id === platformId);
      if (platform) {
        setSelectedRatio(platform.ratio);
      }
    }
  };

  // Toggle custom ratio mode
  const handleCustomModeToggle = (enabled) => {
    setCustomRatioMode(enabled);
    if (enabled) {
      // Clear platform selection when switching to custom mode
      setSelectedPlatform(null);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchBrandProfile();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/image-history?limit=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.items || []);
      setUsage({
        current: response.data.current_usage || 0,
        limit: response.data.monthly_limit || 2
      });
    } catch (error) {
      console.error('Failed to fetch image history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchBrandProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/brand-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrandProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch brand profile:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(language === 'ru' ? 'Введите описание изображения' : 'Please enter image description');
      return;
    }

    const currentRatio = getCurrentRatio();
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/generate-image`,
        { 
          prompt, 
          style,
          use_brand_style: useBrandStyle && brandProfile !== null,
          marketing_platform: selectedPlatform,
          aspect_ratio: currentRatio
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedImage(response.data);
      setUsage(prev => ({ ...prev, current: prev.limit - response.data.remaining_usage }));
      trackGeneration('image', true, { style, platform: selectedPlatform, brand_applied: response.data.brand_applied });
      toast.success(language === 'ru' ? 'Изображение создано!' : 'Image generated!');
      
      fetchHistory();
    } catch (error) {
      const message = error.response?.data?.detail || (language === 'ru' ? 'Ошибка генерации' : 'Generation failed');
      trackGeneration('image', false, { error: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(language === 'ru' ? 'Введите описание' : 'Please enter description');
      return;
    }
    if (selectedBatchPlatforms.length === 0) {
      toast.error(language === 'ru' ? 'Выберите платформы' : 'Select platforms');
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);
    try {
      const response = await axios.post(
        `${API_URL}/api/generate-marketing-batch`,
        { 
          prompt, 
          platforms: selectedBatchPlatforms,
          use_brand_style: useBrandStyle && brandProfile !== null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBatchResults(response.data.images);
      toast.success(language === 'ru' 
        ? `Создано ${response.data.total_generated} изображений!` 
        : `Generated ${response.data.total_generated} images!`);
      
      fetchHistory();
    } catch (error) {
      const message = error.response?.data?.detail || (language === 'ru' ? 'Ошибка генерации' : 'Generation failed');
      toast.error(message);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDownload = async (imageUrl, id) => {
    try {
      // Track usage (non-blocking)
      axios.post(`${API_URL}/api/track-image-usage/${id}?action=download`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});

      trackInteraction('download', id, 'image');

      if (imageUrl.startsWith('data:')) {
        // Base64 image - direct download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `postify-${id}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
        toast.success(language === 'ru' ? 'Изображение скачано!' : 'Image downloaded!');
      } else {
        // External URL - use fetch API for better blob handling
        try {
          const response = await fetch(`${API_URL}/api/download-image/${id}`, {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'image/png, image/*'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const blob = await response.blob();
          
          if (!blob || blob.size === 0) {
            throw new Error('Empty blob received');
          }
          
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `postify-${id}.png`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            window.URL.revokeObjectURL(blobUrl);
          }, 300);
          
          toast.success(language === 'ru' ? 'Изображение скачано!' : 'Image downloaded!');
        } catch (proxyError) {
          console.error('Proxy download failed:', proxyError);
          // Fallback: try direct fetch from image URL
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `postify-${id}.png`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
            }, 300);
            
            toast.success(language === 'ru' ? 'Изображение скачано!' : 'Image downloaded!');
          } catch (fetchError) {
            console.error('Direct fetch failed:', fetchError);
            // Final fallback: open in new tab
            window.open(imageUrl, '_blank');
            toast.info(language === 'ru' ? 'Открыто в новой вкладке - сохраните правой кнопкой мыши' : 'Opened in new tab - right-click to save');
          }
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(language === 'ru' ? 'Ошибка скачивания' : 'Download failed');
    }
  };

  const handleShareImage = async (imageUrl, id) => {
    await shareImage(imageUrl, 'Postify AI - Generated Image');
    trackInteraction('share', id, 'image');
  };

  const handleRegenerate = () => {
    trackInteraction('regenerate', generatedImage?.id, 'image');
    handleGenerate();
  };

  const toggleBatchPlatform = (platformId) => {
    setSelectedBatchPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const usagePercent = (usage.current / usage.limit) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-6">
      {/* Generation Progress Overlay */}
      <GenerationProgress 
        isLoading={loading || batchLoading} 
        type="image" 
        showBrandStep={useBrandStyle && brandProfile !== null}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
            <Image className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {language === 'ru' ? 'AI Генератор изображений' : 'AI Image Generator'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {brandProfile 
                ? (language === 'ru' ? `Бренд: ${brandProfile.brand_name}` : `Brand: ${brandProfile.brand_name}`)
                : (language === 'ru' ? 'Создайте Brand Profile для уникального стиля' : 'Create Brand Profile for unique style')}
            </p>
          </div>
        </div>

        {/* Usage Counter */}
        <Card className="bg-[#111113] border-white/10 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-400">{language === 'ru' ? 'Использовано' : 'Used'}</span>
              <span className="text-white font-bold ml-2">{usage.current} / {usage.limit}</span>
            </div>
            <Progress value={usagePercent} className="w-24 h-2" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#111113] border border-white/10">
          <TabsTrigger value="single" className="data-[state=active]:bg-purple-600">
            <Wand2 className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Одно изображение' : 'Single Image'}
          </TabsTrigger>
          <TabsTrigger value="batch" className="data-[state=active]:bg-purple-600" disabled={!isBusiness}>
            <Layers className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Marketing Set' : 'Marketing Set'}
            {!isBusiness && <Lock className="w-3 h-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        {/* Single Image Tab */}
        <TabsContent value="single" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator Form */}
            <Card className="bg-[#111113] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  {language === 'ru' ? 'Создать изображение' : 'Create Image'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label className="text-white">{language === 'ru' ? 'Описание' : 'Description'}</Label>
                  <Textarea
                    placeholder={language === 'ru' 
                      ? 'Опишите изображение, которое хотите создать...'
                      : 'Describe the image you want to create...'}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] bg-[#0A0A0B] border-white/10 text-white placeholder:text-gray-500"
                    data-testid="image-prompt-input"
                  />
                </div>

                {/* Brand Style Toggle */}
                {brandProfile && (
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">
                        {language === 'ru' ? 'Применить стиль бренда' : 'Apply brand style'}
                      </span>
                    </div>
                    <Switch
                      checked={useBrandStyle}
                      onCheckedChange={setUseBrandStyle}
                      data-testid="brand-style-toggle"
                    />
                  </div>
                )}

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label className="text-white">{language === 'ru' ? 'Стиль' : 'Style'}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {STYLES.slice(0, 8).map((s) => (
                      <Button
                        key={s.value}
                        variant={style === s.value ? "default" : "outline"}
                        size="sm"
                        className={`${
                          style === s.value 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                        onClick={() => setStyle(s.value)}
                        data-testid={`style-${s.value}`}
                      >
                        <span className="mr-1">{s.icon}</span>
                        <span className="hidden sm:inline text-xs">{s.label[language] || s.label.en}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Platform / Aspect Ratio Selection */}
                <div className="space-y-3">
                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-white">
                      {customRatioMode 
                        ? (language === 'ru' ? 'Соотношение сторон' : 'Aspect Ratio')
                        : (language === 'ru' ? 'Платформа' : 'Platform')
                      }
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {language === 'ru' ? 'Своё соотношение' : 'Custom ratio'}
                      </span>
                      <Switch
                        checked={customRatioMode}
                        onCheckedChange={handleCustomModeToggle}
                        data-testid="custom-ratio-toggle"
                      />
                    </div>
                  </div>

                  {/* Platform Mode (Default) */}
                  {!customRatioMode && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2">
                        {PLATFORMS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handlePlatformSelect(p.id)}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                              selectedPlatform === p.id 
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25' 
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-purple-500/30'
                            }`}
                            data-testid={`platform-${p.id}`}
                          >
                            <p.icon className="w-5 h-5 mb-1" />
                            <span className="text-xs font-medium">{p.name[language]}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Selected Platform Info */}
                      {selectedPlatform && (
                        <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const platform = PLATFORMS.find(p => p.id === selectedPlatform);
                              const PlatformIcon = platform?.icon;
                              return (
                                <>
                                  {PlatformIcon && <PlatformIcon className="w-4 h-4 text-purple-400" />}
                                  <span className="text-sm text-white">{platform?.name[language]}</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {language === 'ru' ? 'Соотношение' : 'Ratio'}:
                            </span>
                            <span className="text-sm font-medium text-purple-400">
                              {getCurrentRatio()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Ratio Mode */}
                  {customRatioMode && (
                    <div className="grid grid-cols-3 gap-3">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setSelectedRatio(ratio.id)}
                          className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                            selectedRatio === ratio.id 
                              ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25' 
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-purple-500/30'
                          }`}
                          data-testid={`ratio-${ratio.id}`}
                        >
                          <span className="text-2xl mb-1">{ratio.icon}</span>
                          <span className="text-lg font-bold">{ratio.label}</span>
                          <span className="text-xs text-gray-400 mt-1">
                            {ratio.description[language]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim() || usage.current >= usage.limit}
                    data-testid="generate-image-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {language === 'ru' ? 'Генерация...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {language === 'ru' ? 'Создать изображение' : 'Generate Image'}
                      </>
                    )}
                  </Button>
                  
                  {/* Selected ratio label */}
                  <div className="text-center text-xs text-gray-500">
                    {language === 'ru' ? 'Размер' : 'Size'}: {getCurrentRatio()} 
                    <span className="text-gray-500 ml-1">
                      ({ASPECT_RATIOS.find(r => r.id === getCurrentRatio())?.description[language] || ''})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result Preview */}
            <Card className="bg-[#111113] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-400" />
                  {language === 'ru' ? 'Результат' : 'Result'}
                  {generatedImage?.brand_applied && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                      {language === 'ru' ? 'Бренд' : 'Brand'}
                    </span>
                  )}
                  {generatedImage?.aspect_ratio && (
                    <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                      {generatedImage.aspect_ratio}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-[#0A0A0B] border border-white/10 group">
                      <img 
                        src={generatedImage.image_url} 
                        alt={generatedImage.prompt}
                        className="w-full h-auto"
                        data-testid="generated-image"
                      />
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          onClick={() => handleDownload(generatedImage.image_url, generatedImage.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          onClick={() => handleShareImage(generatedImage.image_url, generatedImage.id)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                          onClick={handleRegenerate}
                          disabled={loading}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Action Buttons Row */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        onClick={() => handleDownload(generatedImage.image_url, generatedImage.id)}
                        data-testid="download-image-btn"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Скачать' : 'Download'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => handleShareImage(generatedImage.image_url, generatedImage.id)}
                        data-testid="share-image-btn"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={handleRegenerate}
                        disabled={loading}
                        data-testid="regenerate-image-btn"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Prompt info */}
                    <div className="text-xs text-gray-500 bg-[#0A0A0B] p-3 rounded-lg">
                      <span className="text-gray-400">Prompt:</span> {generatedImage.prompt}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-[#0A0A0B] rounded-xl border border-white/5">
                    <Image className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">{language === 'ru' ? 'Здесь появится изображение' : 'Image will appear here'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Generation Tab */}
        <TabsContent value="batch" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Form */}
            <Card className="bg-[#111113] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  {language === 'ru' ? 'Marketing Set' : 'Marketing Set'}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {language === 'ru' 
                    ? 'Создайте набор изображений для разных платформ одним кликом'
                    : 'Create a set of images for different platforms in one click'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white">{language === 'ru' ? 'Описание контента' : 'Content Description'}</Label>
                  <Textarea
                    placeholder={language === 'ru' 
                      ? 'Опишите маркетинговый визуал, который нужен для всех платформ...'
                      : 'Describe the marketing visual needed for all platforms...'}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] bg-[#0A0A0B] border-white/10 text-white"
                  />
                </div>

                {brandProfile && (
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">
                        {language === 'ru' ? `Бренд: ${brandProfile.brand_name}` : `Brand: ${brandProfile.brand_name}`}
                      </span>
                    </div>
                    <Switch checked={useBrandStyle} onCheckedChange={setUseBrandStyle} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-white">{language === 'ru' ? 'Выберите платформы' : 'Select Platforms'}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((p) => (
                      <Button
                        key={p.id}
                        variant={selectedBatchPlatforms.includes(p.id) ? "default" : "outline"}
                        className={`flex items-center justify-between py-4 h-auto ${
                          selectedBatchPlatforms.includes(p.id)
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                        onClick={() => toggleBatchPlatform(p.id)}
                      >
                        <div className="flex items-center gap-2">
                          <p.icon className="w-4 h-4" />
                          <span className="text-sm">{p.name[language] || p.name.en}</span>
                        </div>
                        {selectedBatchPlatforms.includes(p.id) && <Check className="w-4 h-4" />}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6"
                  onClick={handleBatchGenerate}
                  disabled={batchLoading || !prompt.trim() || selectedBatchPlatforms.length === 0}
                  data-testid="batch-generate-btn"
                >
                  {batchLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {language === 'ru' ? 'Генерация...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 mr-2" />
                      {language === 'ru' 
                        ? `Создать ${selectedBatchPlatforms.length} изображений`
                        : `Generate ${selectedBatchPlatforms.length} Images`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Batch Results */}
            <Card className="bg-[#111113] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">{language === 'ru' ? 'Результаты' : 'Results'}</CardTitle>
              </CardHeader>
              <CardContent>
                {batchResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {batchResults.map((result, index) => (
                      <div key={index} className="relative group">
                        {result.image_url ? (
                          <>
                            <img 
                              src={result.image_url} 
                              alt={result.platform}
                              className="w-full rounded-lg border border-white/10"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/20"
                                onClick={() => handleDownload(result.image_url, result.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded text-white">
                              {result.platform_name}
                            </div>
                          </>
                        ) : (
                          <div className="aspect-square bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-red-400">{result.error?.slice(0, 30)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <Layers className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">{language === 'ru' ? 'Результаты появятся здесь' : 'Results will appear here'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* History Section */}
      <Card className="bg-[#111113] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            {language === 'ru' ? 'История' : 'History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{language === 'ru' ? 'Пока нет изображений' : 'No images yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative rounded-lg overflow-hidden bg-[#0A0A0B] border border-white/10 hover:border-purple-500/50 transition-colors"
                >
                  <img 
                    src={item.image_url} 
                    alt={item.prompt}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleDownload(item.image_url, item.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.brand_applied && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <Palette className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile sticky button removed */}
    </div>
  );
};
