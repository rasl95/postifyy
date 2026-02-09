import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles, Copy, Check, ExternalLink, PartyPopper, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';
const SHARE_DISMISSED_KEY = 'postify_first_share_dismissed';

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);
const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

const SHARE_PLATFORMS = [
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: TwitterIcon, 
    color: 'bg-white/10 hover:bg-white/15 text-white',
    getUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: TelegramIcon, 
    color: 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#0088cc]',
    getUrl: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: LinkedInIcon, 
    color: 'bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#0A66C2]',
    getUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    icon: WhatsAppIcon, 
    color: 'bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366]',
    getUrl: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`
  }
];

export const ShareFirstPostModal = ({ isOpen, onClose, generatedContent, contentType }) => {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (isOpen && user?.referral_code) {
      setReferralCode(user.referral_code);
    } else if (isOpen && token) {
      axios.get(`${API_URL}/api/referrals/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setReferralCode(res.data.referral_code || '');
      }).catch(() => {});
    }
  }, [isOpen, user, token]);

  const referralUrl = referralCode ? `${APP_URL}/?ref=${referralCode}` : APP_URL;
  
  const shareText = language === 'ru'
    ? 'AI создал мне пост за 2 секунды. Попробуйте Postify AI — бесплатно!'
    : 'AI created a post for me in 2 seconds. Try Postify AI — free!';

  const handleSharePlatform = async (platform) => {
    const url = platform.getUrl(shareText, referralUrl);
    window.open(url, '_blank', 'width=600,height=500');
    
    // Track share event
    try {
      await axios.post(`${API_URL}/api/analytics/track`, {
        event_type: 'first_post_share',
        event_data: { platform: platform.id, referral_code: referralCode }
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success(language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === 'ru' ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SHARE_DISMISSED_KEY, 'true');
    onClose();
  };

  const contentPreview = generatedContent 
    ? generatedContent.slice(0, 120) + (generatedContent.length > 120 ? '...' : '')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-lg bg-[#0A0A0B] border-white/10 overflow-hidden" data-testid="share-first-post-modal">
        {/* Celebration header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF3B30] via-[#FF6A3D] to-[#FFD60A]" />
        
        <DialogHeader className="text-center pt-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF3B30]/20 to-[#FFD60A]/10 border border-[#FF3B30]/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#FF3B30]" />
            </div>
            <div className="absolute -top-1 -right-8 sm:right-24 w-8 h-8 text-[#FFD60A] animate-bounce">
              <PartyPopper className="w-6 h-6" />
            </div>
          </div>
          <DialogTitle className="text-xl sm:text-2xl text-white" data-testid="share-modal-title">
            {language === 'ru' ? 'Ваш первый пост создан!' : 'Your first post is ready!'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1.5">
            {language === 'ru' 
              ? 'Поделитесь с друзьями — каждый переход по вашей ссылке даст +5 генераций'
              : 'Share with friends — each signup via your link gives you +5 generations'}
          </DialogDescription>
        </DialogHeader>

        {/* Content preview */}
        {contentPreview && (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 mt-1" data-testid="share-content-preview">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-[#FF3B30]/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#FF3B30]" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {language === 'ru' ? 'Сгенерированный контент' : 'Generated content'}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{contentPreview}</p>
          </div>
        )}

        {/* Social share buttons */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-3 text-center font-medium uppercase tracking-wider">
            {language === 'ru' ? 'Поделиться через' : 'Share via'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SHARE_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSharePlatform(platform)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/5 transition-all hover:scale-105 ${platform.color}`}
                  data-testid={`share-${platform.id}-btn`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium opacity-80">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Referral link copy */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2 text-center">
            {language === 'ru' ? 'Или скопируйте ссылку' : 'Or copy your link'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-gray-400 truncate font-mono" data-testid="share-referral-link">
              {referralUrl}
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={copyReferralLink}
              className="h-9 px-3 border-white/10 text-white hover:bg-white/10 shrink-0"
              data-testid="share-copy-link-btn"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Bonus callout */}
        <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/15 rounded-lg p-3 mt-2 text-center">
          <p className="text-xs text-[#FF3B30] font-medium">
            {language === 'ru' 
              ? '+5 бесплатных генераций за каждого друга, который зарегистрируется'
              : '+5 free generations for every friend who signs up'}
          </p>
        </div>

        {/* Skip */}
        <button 
          onClick={handleDismiss}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center mt-1 block mx-auto"
          data-testid="share-skip-btn"
        >
          {language === 'ru' ? 'Пропустить' : 'Skip for now'}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFirstPostModal;
