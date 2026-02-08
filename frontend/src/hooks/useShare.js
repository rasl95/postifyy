import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export const useShare = () => {
  const { language } = useLanguage();

  const shareContent = useCallback(async (content, title = 'Postify AI') => {
    const shareData = {
      title,
      text: content,
    };

    // Check if native share is available (mobile)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success(language === 'ru' ? 'Поделились!' : 'Shared!');
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(content);
      toast.success(language === 'ru' ? 'Скопировано в буфер обмена!' : 'Copied to clipboard!');
      return true;
    } catch (error) {
      toast.error(language === 'ru' ? 'Не удалось поделиться' : 'Failed to share');
      return false;
    }
  }, [language]);

  const shareImage = useCallback(async (imageUrl, title = 'Postify AI Image') => {
    // For images, try to share the URL or download
    if (navigator.share) {
      try {
        // Try to fetch and share as file (mobile)
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'postify-image.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            files: [file]
          });
          toast.success(language === 'ru' ? 'Поделились!' : 'Shared!');
          return true;
        }
      } catch (error) {
        console.error('Image share failed:', error);
      }
    }

    // Fallback - copy URL
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success(language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
      return true;
    } catch (error) {
      toast.error(language === 'ru' ? 'Не удалось поделиться' : 'Failed to share');
      return false;
    }
  }, [language]);

  const isNativeShareAvailable = useCallback(() => {
    return typeof navigator.share === 'function';
  }, []);

  return {
    shareContent,
    shareImage,
    isNativeShareAvailable
  };
};
