import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles, Copy, Check, PartyPopper, Gift, Zap } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';
const SHARE_DISMISSED_KEY = 'postify_first_share_dismissed';
const BONUS_CREDITS = 3;

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
  { id: 'twitter', name: 'X (Twitter)', icon: TwitterIcon, color: 'bg-white/10 hover:bg-white/20 text-white',
    getUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { id: 'telegram', name: 'Telegram', icon: TelegramIcon, color: 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#0088cc]',
    getUrl: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, color: 'bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#0A66C2]',
    getUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { id: 'whatsapp', name: 'WhatsApp', icon: WhatsAppIcon, color: 'bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366]',
    getUrl: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}` }
];

export const ShareFirstPostModal = ({ isOpen, onClose, generatedContent, contentType, generationId }) => {
  const { user, token, checkAuth } = useAuth();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [rewardState, setRewardState] = useState('idle'); // idle | sharing | rewarded
  const [sharedPlatforms, setSharedPlatforms] = useState(new Set());
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (user?.referral_code) {
      setReferralCode(user.referral_code);
    } else if (token) {
      axios.get(`${API_URL}/api/referrals/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setReferralCode(res.data.referral_code || '')).catch(() => {});
    }
    // Check if already claimed
    if (token) {
      axios.get(`${API_URL}/api/share/first-post/status`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data.bonus_claimed) setBonusClaimed(true);
      }).catch(() => {});
    }
  }, [isOpen, user, token]);

  const referralUrl = referralCode ? `${APP_URL}/?ref=${referralCode}` : APP_URL;

  const shareText = language === 'ru'
    ? 'AI создал мне пост за 2 секунды. Попробуйте Postify AI — бесплатно!'
    : 'AI created a post for me in 2 seconds. Try Postify AI — free!';

  const handleSharePlatform = useCallback(async (platform) => {
    // Open share window
    const url = platform.getUrl(shareText, referralUrl);
    window.open(url, '_blank', 'width=600,height=500');
    
    setSharedPlatforms(prev => new Set([...prev, platform.id]));
    
    // Track share + claim bonus via dedicated endpoint
    if (!bonusClaimed) {
      setRewardState('sharing');
      try {
        const res = await axios.post(`${API_URL}/api/share/first-post`, {
          platform: platform.id,
          generation_id: generationId || null,
          content_preview: generatedContent?.slice(0, 200) || null
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        if (res.data.bonus_granted) {
          setBonusClaimed(true);
          setRewardState('rewarded');
          toast.success(
            language === 'ru' 
              ? `+${BONUS_CREDITS} генераций добавлено!` 
              : `+${BONUS_CREDITS} generations added!`,
            { duration: 4000 }
          );
          // Refresh user data to update credit count
          await checkAuth();
        } else {
          setRewardState('rewarded');
        }
      } catch {
        setRewardState('idle');
      }
    } else {
      // Already claimed, just track the share
      try {
        await axios.post(`${API_URL}/api/share/first-post`, {
          platform: platform.id,
          generation_id: generationId || null,
          content_preview: generatedContent?.slice(0, 200) || null
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
  }, [shareText, referralUrl, bonusClaimed, token, generationId, generatedContent, language, checkAuth]);

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
    ? generatedContent.slice(0, 140) + (generatedContent.length > 140 ? '...' : '')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-lg bg-[#0A0A0B] border-white/10 overflow-hidden" data-testid="share-first-post-modal">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF3B30] via-[#FF6A3D] to-[#FFD60A]" />
        
        <DialogHeader className="text-center pt-4">
          <div className="relative">
            {rewardState === 'rewarded' ? (
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center animate-in zoom-in duration-300">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF3B30]/20 to-[#FFD60A]/10 border border-[#FF3B30]/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#FF3B30]" />
              </div>
            )}
            <div className="absolute -top-1 -right-8 sm:right-24 w-8 h-8 text-[#FFD60A] animate-bounce">
              <PartyPopper className="w-6 h-6" />
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl text-white" data-testid="share-modal-title">
            {rewardState === 'rewarded'
              ? (language === 'ru' ? `+${BONUS_CREDITS} генерации добавлены!` : `+${BONUS_CREDITS} generations added!`)
              : (language === 'ru' ? 'Ваш первый пост создан!' : 'Your first post is ready!')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1.5">
            {rewardState === 'rewarded'
              ? (language === 'ru' ? 'Спасибо за то, что поделились! Продолжайте создавать контент.' : 'Thanks for sharing! Keep creating great content.')
              : (language === 'ru' ? 'Поделитесь и получите +3 бесплатные генерации мгновенно' : 'Share and get +3 free generations instantly')}
          </DialogDescription>
        </DialogHeader>

        {/* Reward incentive banner */}
        {rewardState !== 'rewarded' && !bonusClaimed && (
          <div className="bg-gradient-to-r from-[#FF3B30]/10 to-[#FFD60A]/10 border border-[#FF3B30]/20 rounded-xl p-3 flex items-center gap-3" data-testid="share-reward-banner">
            <div className="w-10 h-10 rounded-lg bg-[#FF3B30]/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {language === 'ru' ? `+${BONUS_CREDITS} генерации` : `+${BONUS_CREDITS} generations`}
              </p>
              <p className="text-xs text-gray-400">
                {language === 'ru' ? 'Поделитесь постом на любой платформе' : 'Share your post on any platform to claim'}
              </p>
            </div>
            <div className="ml-auto">
              <div className="px-2.5 py-1 bg-[#FF3B30] text-white text-xs font-bold rounded-full">
                FREE
              </div>
            </div>
          </div>
        )}

        {/* Reward success animation */}
        {rewardState === 'rewarded' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center animate-in slide-in-from-bottom duration-300" data-testid="share-reward-success">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-lg font-bold text-green-400">+{BONUS_CREDITS}</span>
            </div>
            <p className="text-xs text-green-400/70">
              {language === 'ru' ? 'Бонусные генерации добавлены к вашему аккаунту' : 'Bonus generations added to your account'}
            </p>
          </div>
        )}

        {/* Content preview */}
        {contentPreview && rewardState !== 'rewarded' && (
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
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-3 text-center font-medium uppercase tracking-wider">
            {rewardState === 'rewarded'
              ? (language === 'ru' ? 'Поделиться ещё' : 'Share more')
              : (language === 'ru' ? 'Выберите платформу' : 'Choose a platform')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SHARE_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const isShared = sharedPlatforms.has(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSharePlatform(platform)}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 ${
                    isShared 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : `border-white/5 ${platform.color}`
                  }`}
                  data-testid={`share-${platform.id}-btn`}
                >
                  {isShared && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <Icon className={`w-5 h-5 ${isShared ? 'text-green-400' : ''}`} />
                  <span className={`text-[10px] font-medium ${isShared ? 'text-green-400' : 'opacity-80'}`}>{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Referral link copy */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2 text-center">
            {language === 'ru' ? 'Ваша реферальная ссылка' : 'Your referral link'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-gray-400 truncate font-mono" data-testid="share-referral-link">
              {referralUrl}
            </div>
            <Button 
              size="sm" variant="outline"
              onClick={copyReferralLink}
              className="h-9 px-3 border-white/10 text-white hover:bg-white/10 shrink-0"
              data-testid="share-copy-link-btn"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Referral bonus callout */}
        <div className="bg-[#FF3B30]/5 border border-[#FF3B30]/15 rounded-lg p-2.5 mt-2 text-center">
          <p className="text-xs text-[#FF3B30] font-medium">
            {language === 'ru' 
              ? '+3 генерации за каждого друга, который зарегистрируется по ссылке'
              : '+3 generations for every friend who signs up via your link'}
          </p>
        </div>

        {/* Dismiss */}
        <button 
          onClick={handleDismiss}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center mt-1 block mx-auto"
          data-testid="share-skip-btn"
        >
          {rewardState === 'rewarded' 
            ? (language === 'ru' ? 'Продолжить' : 'Continue creating') 
            : (language === 'ru' ? 'Пропустить' : 'Skip for now')}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFirstPostModal;
