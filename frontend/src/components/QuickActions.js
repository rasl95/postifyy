import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  Copy, RefreshCw, Edit3, Download, Star, Share2, 
  Check, Loader2, Image, Wand2, Target, Pencil, Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Tooltip component for first-time users
const ActionTooltip = ({ children, label, visible, position = 'top' }) => {
  if (!visible) return children;
  
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2'
  };
  
  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${positionClasses[position]} z-50 px-2 py-1 text-xs bg-[#1A1A1C] border border-white/20 rounded-lg whitespace-nowrap animate-in fade-in-0 slide-in-from-bottom-2 duration-200 pointer-events-none opacity-0 group-hover:opacity-100`}>
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#1A1A1C] border-r border-b border-white/20 rotate-45" />
      </div>
    </div>
  );
};

// Success animation overlay
const SuccessAnimation = ({ show, icon: Icon, label }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-2 p-6 bg-[#111113]/95 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Icon className="w-8 h-8 text-green-400" />
        </div>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
    </div>
  );
};

export const QuickActions = ({
  content,
  contentId,
  contentType = 'text', // 'text' | 'image'
  imageUrl,
  prompt,
  isFavorite = false,
  canFavorite = false,
  onRegenerate,
  onEdit,
  onFavorite,
  onShare,
  onImprove,
  loading = false,
  className = '',
  showTooltips = false,
  compact = false
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setShowCopySuccess(true);
      
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => {
        setCopied(false);
        setShowCopySuccess(false);
      }, 1500);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка копирования' : 'Copy failed');
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    setDownloading(true);
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `postify-${contentId || Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `postify-${contentId || Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      setShowDownloadSuccess(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => setShowDownloadSuccess(false), 1500);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка скачивания' : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateImage = () => {
    const imagePrompt = prompt || content?.slice(0, 100);
    navigate(`/images?prompt=${encodeURIComponent(imagePrompt)}`);
  };

  const handleEditPrompt = () => {
    // For images - prefill generator with prompt
    if (prompt) {
      navigate(`/images?prompt=${encodeURIComponent(prompt)}&edit=true`);
    }
  };

  const tooltipLabels = {
    copy: language === 'ru' ? 'Скопировать текст' : 'Copy to clipboard',
    download: language === 'ru' ? 'Скачать изображение' : 'Download image',
    regenerate: language === 'ru' ? 'Сгенерировать заново' : 'Generate again',
    favorite: language === 'ru' ? 'Добавить в избранное' : 'Add to favorites',
    share: language === 'ru' ? 'Поделиться' : 'Share',
    generateImage: language === 'ru' ? 'Создать изображение' : 'Generate image',
    editPrompt: language === 'ru' ? 'Редактировать промпт' : 'Edit prompt',
    improve: language === 'ru' ? 'Улучшить текст' : 'Improve text'
  };

  const buttonClass = compact 
    ? "p-2 h-9 w-9" 
    : "px-3 py-2";

  return (
    <>
      {/* Success Animations */}
      <SuccessAnimation 
        show={showCopySuccess} 
        icon={Check} 
        label={language === 'ru' ? 'Скопировано!' : 'Copied!'} 
      />
      <SuccessAnimation 
        show={showDownloadSuccess} 
        icon={Download} 
        label={language === 'ru' ? 'Скачано!' : 'Downloaded!'} 
      />

      <div className={`flex flex-wrap items-center gap-2 animate-in slide-in-from-bottom duration-300 ${className}`}>
        {/* Copy (for text) */}
        {contentType === 'text' && content && (
          <ActionTooltip label={tooltipLabels.copy} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={loading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass} ${
                copied ? 'border-green-500/50 text-green-400' : ''
              }`}
              data-testid="quick-copy-btn"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  {!compact && <span className="ml-1.5">{language === 'ru' ? 'Скопировано' : 'Copied'}</span>}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {!compact && <span className="ml-1.5">{language === 'ru' ? 'Копировать' : 'Copy'}</span>}
                </>
              )}
            </Button>
          </ActionTooltip>
        )}

        {/* Download (for images) */}
        {contentType === 'image' && imageUrl && (
          <ActionTooltip label={tooltipLabels.download} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass}`}
              data-testid="quick-download-btn"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Скачать' : 'Download'}</span>}
            </Button>
          </ActionTooltip>
        )}

        {/* Regenerate */}
        {onRegenerate && (
          <ActionTooltip label={tooltipLabels.regenerate} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={loading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass}`}
              data-testid="quick-regenerate-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Ещё раз' : 'Regenerate'}</span>}
            </Button>
          </ActionTooltip>
        )}

        {/* Improve (for text) */}
        {contentType === 'text' && onImprove && (
          <ActionTooltip label={tooltipLabels.improve} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={onImprove}
              disabled={loading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass}`}
              data-testid="quick-improve-btn"
            >
              <Wand2 className="w-4 h-4" />
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Улучшить' : 'Improve'}</span>}
            </Button>
          </ActionTooltip>
        )}

        {/* Edit Prompt (for images) */}
        {contentType === 'image' && prompt && (
          <ActionTooltip label={tooltipLabels.editPrompt} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditPrompt}
              disabled={loading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass}`}
              data-testid="quick-edit-prompt-btn"
            >
              <Pencil className="w-4 h-4" />
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Редактировать' : 'Edit'}</span>}
            </Button>
          </ActionTooltip>
        )}

        {/* Favorite */}
        {canFavorite && onFavorite && (
          <ActionTooltip label={tooltipLabels.favorite} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={onFavorite}
              disabled={loading}
              className={`transition-all hover:scale-105 ${buttonClass} ${
                isFavorite 
                  ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' 
                  : 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-yellow-400'
              }`}
              data-testid="quick-favorite-btn"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              {!compact && (
                <span className="ml-1.5">
                  {isFavorite 
                    ? (language === 'ru' ? 'В избранном' : 'Favorited')
                    : (language === 'ru' ? 'В избранное' : 'Favorite')}
                </span>
              )}
            </Button>
          </ActionTooltip>
        )}

        {/* Generate Image (for text content) */}
        {contentType === 'text' && (content || prompt) && (
          <ActionTooltip label={tooltipLabels.generateImage} visible={showTooltips}>
            <Button
              size="sm"
              onClick={handleGenerateImage}
              className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all hover:scale-105 shadow-lg shadow-purple-500/25 ${buttonClass}`}
              data-testid="quick-generate-image-btn"
            >
              <Image className="w-4 h-4" />
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Создать изображение' : 'Generate Image'}</span>}
            </Button>
          </ActionTooltip>
        )}

        {/* Share */}
        {onShare && (
          <ActionTooltip label={tooltipLabels.share} visible={showTooltips}>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={loading}
              className={`border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 ${buttonClass}`}
              data-testid="quick-share-btn"
            >
              <Share2 className="w-4 h-4" />
              {!compact && <span className="ml-1.5">{language === 'ru' ? 'Поделиться' : 'Share'}</span>}
            </Button>
          </ActionTooltip>
        )}
      </div>
    </>
  );
};

// Floating action bar variant
export const FloatingQuickActions = ({ children, visible = true }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2 p-3 bg-[#111113]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
        {children}
      </div>
    </div>
  );
};

// Compact icon-only variant for mobile
export const QuickActionsCompact = (props) => {
  return <QuickActions {...props} compact={true} />;
};
