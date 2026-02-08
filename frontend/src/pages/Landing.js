import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Sparkles, Zap, ArrowRight, MessageSquare, Image, Fingerprint, 
  LayoutGrid, BarChart3, Check, Target, Palette, Clock, Star,
  Users, TrendingUp, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { toast } from 'sonner';

// Google icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export const Landing = () => {
  const navigate = useNavigate();
  const { register, login, loginWithGoogle, user } = useAuth();
  const { language } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);

  // Capture referral code from URL
  const referralCode = new URLSearchParams(window.location.search).get('ref') || null;

  useEffect(() => {
    if (user) navigate('/dashboard');
    // Auto-open signup if referral link
    if (referralCode && !user) {
      setIsLogin(false);
      setShowAuth(true);
    }
  }, [user, navigate, referralCode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success(language === 'ru' ? 'С возвращением!' : 'Welcome back!');
      } else {
        await register(formData.email, formData.password, formData.fullName, referralCode);
        if (referralCode) {
          toast.success(language === 'ru' ? 'Аккаунт создан! +3 бонусных генерации' : 'Account created! +3 bonus generations');
        } else {
          toast.success(language === 'ru' ? 'Аккаунт создан!' : 'Account created!');
        }
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error('Google login failed');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Content translations
  const content = {
    ru: {
      nav: { signIn: 'Войти', startFree: 'Начать бесплатно' },
      hero: {
        headline: 'Создавайте контент, который продаёт.',
        headlineSub: 'За минуты.',
        subheadline: 'Посты, изображения и маркетинговые наборы для Instagram, TikTok, Telegram и YouTube — с учётом стиля вашего бренда.',
        bullets: [
          { icon: Fingerprint, text: 'Brand AI — контент в стиле вашего бренда' },
          { icon: Image, text: 'AI изображения под соцсети (1:1, 9:16, 16:9)' },
          { icon: LayoutGrid, text: 'Маркетинговые наборы и шаблоны' },
          { icon: BarChart3, text: 'Аналитика и избранное' }
        ],
        cta: 'Начать бесплатно',
        ctaSecondary: 'Посмотреть возможности'
      },
      features: {
        title: 'Возможности Postify AI',
        subtitle: 'Всё для создания контента, который конвертирует',
        items: [
          { 
            icon: MessageSquare, 
            title: 'AI Генератор постов', 
            desc: 'Вирусные посты с хуками, эмодзи и хештегами. Оптимизировано для каждой платформы.',
            color: 'from-blue-500/20 to-blue-600/5'
          },
          { 
            icon: Image, 
            title: 'AI Генератор изображений', 
            desc: 'Изображения под платформу с выбором стиля и брендингом. 1:1, 9:16, 16:9.',
            color: 'from-purple-500/20 to-purple-600/5'
          },
          { 
            icon: Fingerprint, 
            title: 'Brand AI', 
            desc: 'Сохраните тон бренда, цвета и стиль. Весь контент в едином стиле.',
            badge: 'Pro',
            color: 'from-emerald-500/20 to-emerald-600/5'
          },
          { 
            icon: LayoutGrid, 
            title: 'Маркетинг-наборы', 
            desc: 'Генерируйте посты + изображения в один клик. Готовые кампании за секунды.',
            badge: 'Pro',
            color: 'from-orange-500/20 to-orange-600/5'
          },
          { 
            icon: BarChart3, 
            title: 'Аналитика и Избранное', 
            desc: 'Отслеживайте использование, сохраняйте лучший контент для переиспользования.',
            badge: 'Pro/Business',
            color: 'from-pink-500/20 to-pink-600/5'
          }
        ]
      },
      howItWorks: {
        title: 'Как это работает',
        subtitle: 'От идеи до публикации за 3 шага',
        steps: [
          { num: '1', title: 'Выберите платформу и цель', desc: 'Instagram, TikTok, Telegram или YouTube. Укажите тон и формат.' },
          { num: '2', title: 'Генерируйте контент', desc: 'AI создаст текст или изображение за секунды. Используйте Brand AI для единого стиля.' },
          { num: '3', title: 'Публикуйте и масштабируйте', desc: 'Копируйте, скачивайте и публикуйте. Экономьте часы каждую неделю.' }
        ]
      },
      pricing: {
        title: 'Тарифы',
        subtitle: 'Большинство создателей выбирают Pro',
        yearly: 'Экономия 30% при оплате за год',
        compare: 'Сравнить тарифы',
        plans: [
          { 
            name: 'Free', 
            price: '€0', 
            desc: 'Для старта', 
            features: ['3 генерации/месяц', '2 AI изображения', 'Все типы контента', 'Базовые тоны']
          },
          { 
            name: 'Pro', 
            price: '€15', 
            yearlyPrice: '€10.50',
            desc: 'Популярный выбор', 
            popular: true, 
            features: ['200 генераций/месяц', '30 AI изображений', 'Brand AI', 'Расширенные тоны', 'CTA-цели постов', 'Аналитика']
          },
          { 
            name: 'Business', 
            price: '€39', 
            yearlyPrice: '€27.30',
            desc: 'Для команд и агентств', 
            features: ['600 генераций/месяц', '100 AI изображений', 'Приоритетная обработка', 'Маркетинг-наборы', 'Пакетная генерация', 'Экспорт в CSV/PDF']
          }
        ]
      },
      proof: {
        title: 'Результаты наших пользователей',
        stats: [
          { value: '1,000+', label: 'создателей контента', icon: Users },
          { value: '40,000+', label: 'постов сгенерировано', icon: TrendingUp },
          { value: '5–10 ч', label: 'экономии в неделю', icon: Clock }
        ]
      },
      final: {
        headline: 'Готовы создавать контент быстрее?',
        subheadline: 'Присоединяйтесь к тысячам создателей, которые уже экономят время с Postify AI.',
        cta: 'Начать бесплатно — без карты'
      },
      footer: {
        copyright: '© 2026 Postify AI. Все права защищены.',
        links: ['Конфиденциальность', 'Условия', 'Контакты']
      },
      auth: {
        signIn: 'Войти',
        signUp: 'Создать аккаунт',
        email: 'Email',
        password: 'Пароль',
        name: 'Полное имя',
        or: 'или продолжить с',
        google: 'Войти через Google',
        switchToSignUp: 'Нет аккаунта?',
        switchToSignIn: 'Уже есть аккаунт?',
        processing: 'Обработка...'
      }
    },
    en: {
      nav: { signIn: 'Sign In', startFree: 'Start Free' },
      hero: {
        headline: 'Create content that sells.',
        headlineSub: 'In minutes.',
        subheadline: 'Posts, images, and marketing sets for Instagram, TikTok, Telegram, and YouTube — styled to your brand.',
        bullets: [
          { icon: Fingerprint, text: 'Brand AI — content in your brand style' },
          { icon: Image, text: 'AI images for social (1:1, 9:16, 16:9)' },
          { icon: LayoutGrid, text: 'Marketing sets & templates' },
          { icon: BarChart3, text: 'Analytics & favorites' }
        ],
        cta: 'Start Free',
        ctaSecondary: 'View Features'
      },
      features: {
        title: 'Postify AI Features',
        subtitle: 'Everything you need to create content that converts',
        items: [
          { 
            icon: MessageSquare, 
            title: 'AI Posts Generator', 
            desc: 'Viral posts with hooks, emojis, and hashtags. Optimized for every platform.',
            color: 'from-blue-500/20 to-blue-600/5'
          },
          { 
            icon: Image, 
            title: 'AI Image Generator', 
            desc: 'Platform-optimized images with style selection and branding. 1:1, 9:16, 16:9.',
            color: 'from-purple-500/20 to-purple-600/5'
          },
          { 
            icon: Fingerprint, 
            title: 'Brand AI', 
            desc: 'Save your brand tone, colors, and style. All content stays consistent.',
            badge: 'Pro',
            color: 'from-emerald-500/20 to-emerald-600/5'
          },
          { 
            icon: LayoutGrid, 
            title: 'Marketing Sets', 
            desc: 'Generate posts + images in one click. Campaign-ready in seconds.',
            badge: 'Pro',
            color: 'from-orange-500/20 to-orange-600/5'
          },
          { 
            icon: BarChart3, 
            title: 'Analytics & Favorites', 
            desc: 'Track usage, save your best content for reuse.',
            badge: 'Pro/Business',
            color: 'from-pink-500/20 to-pink-600/5'
          }
        ]
      },
      howItWorks: {
        title: 'How It Works',
        subtitle: 'From idea to published content in 3 steps',
        steps: [
          { num: '1', title: 'Choose platform & goal', desc: 'Instagram, TikTok, Telegram, or YouTube. Set your tone and format.' },
          { num: '2', title: 'Generate content', desc: 'AI creates text or images in seconds. Use Brand AI for consistency.' },
          { num: '3', title: 'Publish & scale', desc: 'Copy, download, and publish. Save hours every week.' }
        ]
      },
      pricing: {
        title: 'Pricing',
        subtitle: 'Most creators choose Pro',
        yearly: 'Save 30% with yearly billing',
        compare: 'Compare Plans',
        plans: [
          { 
            name: 'Free', 
            price: '€0', 
            desc: 'To get started', 
            features: ['3 generations/month', '2 AI images', 'All content types', 'Basic tones']
          },
          { 
            name: 'Pro', 
            price: '€15', 
            yearlyPrice: '€10.50',
            desc: 'Most Popular', 
            popular: true, 
            features: ['200 generations/month', '30 AI images', 'Brand AI', 'Extended tones', 'Post CTA goals', 'Analytics']
          },
          { 
            name: 'Business', 
            price: '€39', 
            yearlyPrice: '€27.30',
            desc: 'For teams & agencies', 
            features: ['600 generations/month', '100 AI images', 'Priority processing', 'Marketing sets', 'Batch generation', 'CSV/PDF export']
          }
        ]
      },
      proof: {
        title: 'Results from our users',
        stats: [
          { value: '1,000+', label: 'content creators', icon: Users },
          { value: '40,000+', label: 'posts generated', icon: TrendingUp },
          { value: '5–10 hrs', label: 'saved per week', icon: Clock }
        ]
      },
      final: {
        headline: 'Ready to create content faster?',
        subheadline: 'Join thousands of creators already saving time with Postify AI.',
        cta: 'Start Free — No credit card required'
      },
      footer: {
        copyright: '© 2026 Postify AI. All rights reserved.',
        links: ['Privacy', 'Terms', 'Contact']
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Create Account',
        email: 'Email',
        password: 'Password',
        name: 'Full Name',
        or: 'or continue with',
        google: 'Continue with Google',
        switchToSignUp: "Don't have an account?",
        switchToSignIn: 'Already have an account?',
        processing: 'Processing...'
      }
    }
  };

  const t = content[language] || content.ru;

  return (
    <div className="min-h-[100svh] bg-[#0B0B0D] overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0B0D]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Postify AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitch variant="minimal" />
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hidden sm:flex"
              onClick={() => { setIsLogin(true); setShowAuth(true); }}
              data-testid="nav-sign-in-btn"
            >
              {t.nav.signIn}
            </Button>
            <Button
              className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium"
              onClick={() => { setIsLogin(false); setShowAuth(true); }}
              data-testid="nav-start-free-btn"
            >
              {t.nav.startFree}
            </Button>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="pt-32 pb-24 lg:pb-32 px-6 lg:px-12 relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#FF3B30]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {t.hero.headline}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D]">
                  {t.hero.headlineSub}
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl"
              >
                {t.hero.subheadline}
              </motion.p>

              {/* Hero bullets */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid sm:grid-cols-2 gap-3 mb-10"
              >
                {t.hero.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0">
                      <bullet.icon className="w-4 h-4 text-[#FF3B30]" />
                    </div>
                    <span className="text-sm font-medium">{bullet.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-semibold bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-lg shadow-[#FF3B30]/25 transition-all hover:shadow-[#FF3B30]/40 hover:scale-[1.02]"
                  onClick={() => { setIsLogin(false); setShowAuth(true); }}
                  data-testid="hero-start-free-btn"
                >
                  {t.hero.cta}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-medium border-white/10 text-white hover:bg-white/5 hover:border-white/20"
                  onClick={scrollToFeatures}
                  data-testid="hero-features-btn"
                >
                  {t.hero.ctaSecondary}
                </Button>
              </motion.div>
            </div>

            {/* Right: Visual - Real AI Demo */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative max-w-md mx-auto">
                {/* Glow effect behind */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF3B30]/25 via-[#FF6A3D]/15 to-transparent rounded-3xl blur-2xl" />
                
                {/* Main card - Real AI Demo */}
                <div className="relative backdrop-blur-xl bg-[#0c0c0c] border border-white/10 rounded-3xl p-5 lg:p-6 shadow-2xl">
                  
                  {/* Demo Badge - Top Right */}
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D] text-white text-xs font-semibold rounded-full shadow-lg">
                    {language === 'ru' ? 'Пример' : 'Demo'}
                  </div>

                  {/* Section Header */}
                  <div className="text-center mb-5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {language === 'ru' ? 'Пример AI-результата' : 'AI Result Example'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {language === 'ru' ? 'Контент выглядит именно так после генерации в Postify AI' : 'This is exactly how content looks after generation in Postify AI'}
                    </p>
                  </div>

                  {/* Post Card */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">AI Generated Post</div>
                        <div className="text-gray-500 text-xs flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                            </svg>
                            Instagram
                          </span>
                          <span>•</span>
                          <span>{language === 'ru' ? 'Только что' : 'Just now'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Real Post Content */}
                    <div className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-line">
                      {language === 'ru' 
                        ? `Вот что отличает сильный бренд от остальных:

1️⃣ Чёткий голос
2️⃣ Системный контент
3️⃣ Постоянство

Хаос не продаёт. Стратегия — да.`
                        : `Here's what sets strong brands apart:

1️⃣ Clear voice
2️⃣ Systematic content
3️⃣ Consistency

Chaos doesn't sell. Strategy does.`}
                    </div>

                    {/* Real Hashtags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 text-xs bg-[#FF3B30]/15 text-[#FF3B30] rounded-full font-medium">
                        {language === 'ru' ? '#маркетинг' : '#marketing'}
                      </span>
                      <span className="px-2.5 py-1 text-xs bg-[#FF6A3D]/15 text-[#FF6A3D] rounded-full font-medium">
                        {language === 'ru' ? '#бренд' : '#brand'}
                      </span>
                      <span className="px-2.5 py-1 text-xs bg-[#FF3B30]/15 text-[#FF3B30] rounded-full font-medium">
                        {language === 'ru' ? '#контент' : '#content'}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                      <div className="text-center py-2 px-1 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-white font-semibold text-sm">
                          <Zap className="w-3.5 h-3.5 text-[#FF3B30]" />
                          ~2s
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{language === 'ru' ? 'Генерация' : 'Generated'}</div>
                      </div>
                      <div className="text-center py-2 px-1 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-white font-semibold text-sm">
                          <span className="text-[#FF6A3D]">#</span>
                          5+
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{language === 'ru' ? 'Хештегов' : 'Hashtags'}</div>
                      </div>
                      <div className="text-center py-2 px-1 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-white font-semibold text-sm">
                          <Target className="w-3.5 h-3.5 text-[#FF3B30]" />
                          97%
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Brand Match</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-4 h-11 bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D] hover:from-[#FF4D42] hover:to-[#FF7A4D] text-white font-medium text-sm shadow-lg shadow-[#FF3B30]/20"
                    onClick={() => { setIsLogin(false); setShowAuth(true); }}
                    data-testid="demo-cta-btn"
                  >
                    {language === 'ru' ? 'Создать такой же контент' : 'Create content like this'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section id="features" className="py-24 lg:py-32 px-6 lg:px-12 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t.features.title}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t.features.subtitle}</p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {t.features.items.map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className={`group relative p-6 lg:p-8 rounded-2xl bg-gradient-to-b ${item.color} border border-white/5 hover:border-white/10 transition-all duration-300 ${i === 0 ? 'lg:col-span-2' : ''}`}
              >
                {item.badge && (
                  <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full bg-[#FF3B30]/20 text-[#FF3B30] font-medium">
                    {item.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#0B0B0D]">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t.howItWorks.title}
            </h2>
            <p className="text-gray-400 text-lg">{t.howItWorks.subtitle}</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Connection line */}
            <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#FF3B30]/50 via-[#FF6A3D]/50 to-[#FF3B30]/50" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {t.howItWorks.steps.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative text-center">
                  {/* Step number */}
                  <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center shadow-lg shadow-[#FF3B30]/30">
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{step.num}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: PRICING PREVIEW */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-6"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t.pricing.title}
            </h2>
            <p className="text-gray-400 text-lg mb-3">{t.pricing.subtitle}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/20">
              <Zap className="w-4 h-4 text-[#FF3B30]" />
              <span className="text-sm text-[#FF3B30] font-medium">{t.pricing.yearly}</span>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {t.pricing.plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className={`relative p-6 lg:p-8 rounded-2xl border transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-[#FF3B30]/10 to-transparent border-[#FF3B30]/50 shadow-xl shadow-[#FF3B30]/10 scale-[1.02]' 
                    : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#FF3B30] text-white text-xs font-semibold rounded-full shadow-lg">
                    {plan.desc}
                  </div>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-gray-500 mt-1">{plan.yearlyPrice}/mo {language === 'ru' ? 'при оплате за год' : 'billed yearly'}</p>
                  )}
                  {!plan.popular && <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[#FF3B30] flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-12 font-medium ${plan.popular ? 'bg-[#FF3B30] hover:bg-[#FF4D42] text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                  onClick={() => { setIsLogin(false); setShowAuth(true); }}
                  data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                >
                  {language === 'ru' ? 'Начать' : 'Get Started'}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Button
              variant="ghost"
              className="text-[#FF3B30] hover:text-[#FF4D42] font-medium"
              onClick={() => { setIsLogin(false); setShowAuth(true); }}
              data-testid="pricing-compare-btn"
            >
              {t.pricing.compare} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 5: SOCIAL PROOF */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#0B0B0D]">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t.proof.title}
            </h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {t.proof.stats.map((stat, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp} 
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-[#FF3B30]" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D] via-[#FF3B30]/5 to-[#0B0B0D]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF3B30]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {t.final.headline}
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-xl text-gray-400 mb-10 max-w-xl mx-auto"
          >
            {t.final.subheadline}
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Button
              size="lg"
              className="h-16 px-12 text-lg font-semibold bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-xl shadow-[#FF3B30]/30 transition-all hover:shadow-[#FF3B30]/50 hover:scale-[1.02]"
              onClick={() => { setIsLogin(false); setShowAuth(true); }}
              data-testid="final-cta-btn"
            >
              {t.final.cta}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 border-t border-white/5 bg-[#0B0B0D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-500 text-sm">{t.footer.copyright}</span>
          </div>
          <div className="flex items-center gap-6">
            {t.footer.links.map((link, i) => (
              <a key={i} href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10" data-testid="auth-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {isLogin ? t.auth.signIn : t.auth.signUp}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-400">{t.auth.name}</Label>
                <Input
                  id="fullName"
                  type="text"
                  className="bg-white/5 border-white/10 text-white h-12"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required={!isLogin}
                  data-testid="auth-name-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-400">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                className="bg-white/5 border-white/10 text-white h-12"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="auth-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-400">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                className="bg-white/5 border-white/10 text-white h-12"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="auth-password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading ? t.auth.processing : (isLogin ? t.auth.signIn : t.auth.signUp)}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-3 text-gray-500">{t.auth.or}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 border-white/10 text-white hover:bg-white/5"
            onClick={handleGoogleLogin}
            data-testid="auth-google-btn"
          >
            <GoogleIcon />
            {t.auth.google}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? t.auth.switchToSignUp : t.auth.switchToSignIn}{' '}
            <button
              type="button"
              className="text-[#FF3B30] hover:text-[#FF4D42] font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? t.auth.signUp : t.auth.signIn}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
