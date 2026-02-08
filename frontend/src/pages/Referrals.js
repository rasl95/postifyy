import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, Copy, Check, Gift, Link2, Share2, 
  ArrowRight, Sparkles, UserPlus, Coins
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Referrals = () => {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/referrals/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [token]);

  const referralLink = stats 
    ? `${window.location.origin}/?ref=${stats.referral_code}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const text = language === 'ru'
      ? `Попробуй Postify AI — создавай контент для соцсетей с помощью AI! Регистрируйся по моей ссылке и получи +3 бонусных генерации: ${referralLink}`
      : `Try Postify AI — create social media content with AI! Sign up with my link and get +3 bonus generations: ${referralLink}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Postify AI', text, url: referralLink });
    } else {
      navigator.clipboard.writeText(text);
      toast.success(language === 'ru' ? 'Текст скопирован!' : 'Text copied!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#FF3B30]/30 border-t-[#FF3B30] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="referrals-page">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-[#FF3B30]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {language === 'ru' ? 'Пригласите друзей' : 'Invite Friends'}
        </h1>
        <p className="text-gray-400 mt-2 max-w-md mx-auto">
          {language === 'ru'
            ? `Вы получите +${stats?.rewards?.referrer || 5} генераций, друг — +${stats?.rewards?.referred || 3}`
            : `You get +${stats?.rewards?.referrer || 5} generations, friend gets +${stats?.rewards?.referred || 3}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3" data-testid="referral-stats">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-[#FF3B30] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.total_referrals || 0}</div>
            <div className="text-xs text-gray-500">{language === 'ru' ? 'Приглашено' : 'Invited'}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <Coins className="w-6 h-6 text-[#FF3B30] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.bonus_credits || 0}</div>
            <div className="text-xs text-gray-500">{language === 'ru' ? 'Бонус-кредиты' : 'Bonus credits'}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 text-[#FF3B30] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">+{stats?.rewards?.referrer || 5}</div>
            <div className="text-xs text-gray-500">{language === 'ru' ? 'За друга' : 'Per friend'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#FF3B30]" />
            {language === 'ru' ? 'Ваша ссылка' : 'Your link'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-[#0A0A0B] rounded-lg border border-white/10">
            <span className="text-sm text-gray-300 truncate flex-1" data-testid="referral-link-text">
              {referralLink}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyLink}
              data-testid="copy-referral-link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyLink}
              className="flex-1 bg-[#FF3B30] hover:bg-[#FF4D42] text-white"
              data-testid="copy-link-btn"
            >
              <Copy className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Скопировать' : 'Copy link'}
            </Button>
            <Button
              onClick={shareLink}
              variant="outline"
              className="flex-1"
              data-testid="share-referral-btn"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Поделиться' : 'Share'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">
            {language === 'ru' ? 'Как это работает' : 'How it works'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                step: '1', 
                icon: Link2, 
                title: language === 'ru' ? 'Поделитесь ссылкой' : 'Share your link',
                desc: language === 'ru' ? 'Отправьте ссылку другу или коллеге' : 'Send the link to a friend or colleague'
              },
              { 
                step: '2', 
                icon: UserPlus, 
                title: language === 'ru' ? 'Друг регистрируется' : 'Friend signs up',
                desc: language === 'ru' ? `Он получает +${stats?.rewards?.referred || 3} бонусных генераций` : `They get +${stats?.rewards?.referred || 3} bonus generations`
              },
              { 
                step: '3', 
                icon: Gift, 
                title: language === 'ru' ? 'Вы получаете бонус' : 'You get rewarded',
                desc: language === 'ru' ? `+${stats?.rewards?.referrer || 5} генераций зачисляются на ваш аккаунт` : `+${stats?.rewards?.referrer || 5} generations added to your account`
              }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/30 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {stats?.referrals?.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF3B30]" />
              {language === 'ru' ? 'История приглашений' : 'Referral history'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.referrals.map((ref, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0B] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-white">
                      {ref.referred_email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="text-sm text-white">{ref.referred_email}</span>
                      <p className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                    +{ref.referrer_reward}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Referrals;
