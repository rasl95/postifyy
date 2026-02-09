import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Sparkles, Zap, ArrowRight, ArrowDown, MessageSquare, Image, 
  LayoutGrid, BarChart3, Check, Target, Palette, Clock, Star,
  Users, TrendingUp, Award, Lock, X, Eye, CalendarClock, 
  Copy, Layers, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
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
  const exampleRef = useRef(null);

  const referralCode = new URLSearchParams(window.location.search).get('ref') || null;

  useEffect(() => {
    if (user) navigate('/dashboard');
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
        toast.success(language === 'ru' ? 'Аккаунт создан!' : 'Account created!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try { await loginWithGoogle(); } catch { toast.error('Google login failed'); }
  };

  const scrollToExample = () => {
    exampleRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openSignup = () => { setIsLogin(false); setShowAuth(true); };

  const t = {
    ru: {
      nav: { signIn: 'Войти', startFree: 'Начать' },
      hero: {
        headline: '30 дней контента',
        headlineSub: 'за 10 минут.',
        sub: 'AI создаёт готовые посты, изображения и кампании для ваших соцсетей. Вы публикуете — и растёте.',
        cta: 'Создать контент сейчас',
        ctaSec: 'Посмотреть пример'
      },
      steps: {
        title: 'Как это работает',
        items: [
          { num: '1', title: 'Опишите задачу', desc: 'Выберите платформу, тон и тему. Или используйте шаблон.' },
          { num: '2', title: 'AI создаёт контент', desc: 'За 2 секунды — готовый пост с хештегами или изображение под ваш бренд.' },
          { num: '3', title: 'Публикуйте и растите', desc: 'Скопируйте, скачайте или запланируйте. Экономьте 5-10 часов в неделю.' }
        ]
      },
      example: {
        title: 'Вот что создаёт AI',
        sub: 'Реальный результат — без редактуры, готов к публикации',
        post: `Хотите увеличить продажи через контент?

Вот 3 правила, которые работают:

1. Говорите на языке клиента
2. Давайте пользу, а не просто продавайте
3. Будьте регулярны — алгоритм любит стабильность

Попробуйте применить хотя бы одно уже сегодня.

#маркетинг #контентплан #smm #продажи #бизнес`,
        platform: 'Instagram',
        tone: 'Экспертный',
        time: '~2 сек'
      },
      freeMiss: {
        title: 'Что упускают пользователи Free',
        sub: 'Бесплатный план даёт попробовать. Но для роста нужен Pro.',
        free: [
          '3 генерации в месяц',
          'Водяной знак на контенте',
          'Нет сохранения шаблонов',
          'Нет планировщика',
          'Нет аналитики'
        ],
        pro: [
          '200 генераций в месяц',
          'Без водяных знаков',
          'Сохранение и переиспользование шаблонов',
          'AI-планировщик публикаций',
          'Аналитика и рекомендации',
          'Brand AI — контент в стиле бренда',
          '30 AI-изображений'
        ]
      },
      whyPro: {
        title: 'Почему Pro окупается',
        sub: 'Сравните: нанять SMM-специалиста стоит от €500/мес. Pro план — €15/мес.',
        items: [
          { stat: '€15', label: 'в месяц за Pro', desc: 'Вместо €500+ за SMM-специалиста' },
          { stat: '200', label: 'генераций', desc: 'Постов, описаний и идей для видео' },
          { stat: '5-10ч', label: 'экономии в неделю', desc: 'Время, которое вы тратите на контент' }
        ]
      },
      finalCta: {
        title: 'Попробуйте прямо сейчас',
        sub: 'Создайте первый пост бесплатно — без карты.',
        btn: 'Создать контент сейчас'
      },
      footer: {
        copy: '© 2026 Postify AI. Все права защищены.',
        links: ['Конфиденциальность', 'Условия', 'Контакты']
      },
      auth: {
        signIn: 'Войти', signUp: 'Создать аккаунт', email: 'Email', password: 'Пароль',
        name: 'Полное имя', or: 'или продолжить с', google: 'Войти через Google',
        switchToSignUp: 'Нет аккаунта?', switchToSignIn: 'Уже есть аккаунт?', processing: 'Обработка...'
      }
    },
    en: {
      nav: { signIn: 'Sign In', startFree: 'Start Free' },
      hero: {
        headline: '30 days of content',
        headlineSub: 'in 10 minutes.',
        sub: 'AI creates ready-to-publish posts, images, and campaigns for your social media. You publish — and grow.',
        cta: 'Create content now',
        ctaSec: 'See example'
      },
      steps: {
        title: 'How it works',
        items: [
          { num: '1', title: 'Describe your task', desc: 'Choose platform, tone, and topic. Or use a template.' },
          { num: '2', title: 'AI creates content', desc: 'In 2 seconds — a ready post with hashtags or a branded image.' },
          { num: '3', title: 'Publish & grow', desc: 'Copy, download, or schedule. Save 5-10 hours per week.' }
        ]
      },
      example: {
        title: 'This is what AI creates',
        sub: 'Real result — no editing needed, ready to publish',
        post: `Want to boost sales through content?

Here are 3 rules that actually work:

1. Speak your customer's language
2. Provide value, don't just sell
3. Be consistent — algorithms love stability

Try applying at least one of these today.

#marketing #contentplan #smm #sales #business`,
        platform: 'Instagram',
        tone: 'Expert',
        time: '~2 sec'
      },
      freeMiss: {
        title: 'What Free users miss',
        sub: 'Free lets you try. But growth requires Pro.',
        free: [
          '3 generations per month',
          'Watermark on content',
          'No template saving',
          'No scheduler',
          'No analytics'
        ],
        pro: [
          '200 generations per month',
          'No watermarks',
          'Save & reuse templates',
          'AI-powered post scheduler',
          'Analytics & recommendations',
          'Brand AI — on-brand content',
          '30 AI images'
        ]
      },
      whyPro: {
        title: 'Why Pro pays for itself',
        sub: 'Compare: hiring an SMM specialist costs €500+/mo. Pro plan — €15/mo.',
        items: [
          { stat: '€15', label: 'per month for Pro', desc: 'Instead of €500+ for a social media manager' },
          { stat: '200', label: 'generations', desc: 'Posts, descriptions, and video ideas' },
          { stat: '5-10h', label: 'saved per week', desc: 'Time you spend on content creation' }
        ]
      },
      finalCta: {
        title: 'Try it right now',
        sub: 'Create your first post for free — no card required.',
        btn: 'Create content now'
      },
      footer: {
        copy: '© 2026 Postify AI. All rights reserved.',
        links: ['Privacy', 'Terms', 'Contact']
      },
      auth: {
        signIn: 'Sign In', signUp: 'Create Account', email: 'Email', password: 'Password',
        name: 'Full Name', or: 'or continue with', google: 'Continue with Google',
        switchToSignUp: "Don't have an account?", switchToSignIn: 'Already have an account?', processing: 'Processing...'
      }
    }
  }[language] || t?.en;

  return (
    <div className="min-h-[100svh] bg-[#0B0B0D] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0B0D]/80 border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Postify AI</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitch variant="minimal" />
            <Button variant="ghost" className="text-gray-400 hover:text-white hidden sm:flex"
              onClick={() => { setIsLogin(true); setShowAuth(true); }} data-testid="nav-sign-in-btn">
              {t.nav.signIn}
            </Button>
            <Button className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium"
              onClick={openSignup} data-testid="nav-start-free-btn">
              {t.nav.startFree}
            </Button>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-6 lg:px-12 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#FF3B30]/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            {t.hero.headline}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3B30] to-[#FF6A3D]">
              {t.hero.headlineSub}
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            {t.hero.sub}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg"
              className="h-14 px-10 text-base font-semibold bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-lg shadow-[#FF3B30]/25 transition-all hover:shadow-[#FF3B30]/40 hover:scale-[1.02]"
              onClick={openSignup} data-testid="hero-start-free-btn">
              {t.hero.cta}<ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline"
              className="h-14 px-10 text-base font-medium border-white/10 text-white hover:bg-white/5 hover:border-white/20"
              onClick={scrollToExample} data-testid="hero-example-btn">
              {t.hero.ctaSec}<ArrowDown className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
          {/* Trust line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-500" />{language === 'ru' ? 'Без карты' : 'No card required'}</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#FF3B30]" />{language === 'ru' ? '3 бесплатных генерации' : '3 free generations'}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" />{language === 'ru' ? 'Результат за 2 секунды' : 'Results in 2 seconds'}</span>
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (3 steps) ============ */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{t.steps.title}</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="relative">
            <div className="hidden lg:block absolute top-20 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#FF3B30]/40 via-[#FF6A3D]/40 to-[#FF3B30]/40" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {t.steps.items.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative text-center">
                  <div className="relative z-10 w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center shadow-lg shadow-[#FF3B30]/30">
                    <span className="text-xl font-bold text-white">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-xs mx-auto text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ EXAMPLE AI CONTENT ============ */}
      <section ref={exampleRef} className="py-20 lg:py-28 px-6 lg:px-12 bg-[#0B0B0D]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">{t.example.title}</h2>
            <p className="text-gray-400 text-lg">{t.example.sub}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
            <div className="max-w-2xl mx-auto">
              <div className="relative bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Post header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">AI Generated Post</div>
                      <div className="text-gray-500 text-xs flex items-center gap-1.5">
                        <span>{t.example.platform}</span><span>·</span><span>{t.example.tone}</span><span>·</span><span>{t.example.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 text-xs bg-green-500/15 text-green-400 rounded-full font-medium">
                      {language === 'ru' ? 'Готов к публикации' : 'Ready to publish'}
                    </div>
                  </div>
                </div>
                {/* Post content */}
                <div className="p-5">
                  <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line mb-4">{t.example.post}</div>
                </div>
                {/* Post footer */}
                <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-[#FF3B30]" />{t.example.time}</span>
                    <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" />{language === 'ru' ? 'Скопировать' : 'Copy'}</span>
                  </div>
                  <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white text-xs h-8 px-4" onClick={openSignup} data-testid="example-cta-btn">
                    {language === 'ru' ? 'Создать такой же' : 'Create one like this'}<ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ WHAT FREE USERS MISS ============ */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-[#080808]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">{t.freeMiss.title}</h2>
            <p className="text-gray-400 text-lg">{t.freeMiss.sub}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free column */}
            <motion.div variants={scaleIn} className="p-6 rounded-2xl bg-[#0A0A0B] border border-white/5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Free</h3>
                  <p className="text-xs text-gray-500">€0/{language === 'ru' ? 'мес' : 'mo'}</p>
                </div>
              </div>
              <div className="space-y-3">
                {t.freeMiss.free.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                    <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            {/* Pro column */}
            <motion.div variants={scaleIn} className="p-6 rounded-2xl bg-gradient-to-b from-[#FF3B30]/10 to-transparent border border-[#FF3B30]/30 relative">
              <div className="absolute -top-3 right-4 px-3 py-1 bg-[#FF3B30] text-white text-xs font-semibold rounded-full">
                {language === 'ru' ? 'Рекомендуем' : 'Recommended'}
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FF3B30]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pro</h3>
                  <p className="text-xs text-gray-500">€15/{language === 'ru' ? 'мес' : 'mo'}</p>
                </div>
              </div>
              <div className="space-y-3">
                {t.freeMiss.pro.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-200 text-sm">
                    <Check className="w-4 h-4 text-[#FF3B30] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium h-11"
                onClick={openSignup} data-testid="free-miss-cta-btn">
                {language === 'ru' ? 'Разблокировать полный доступ' : 'Unlock full access'}<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ WHY PRO PAYS FOR ITSELF ============ */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-[#0B0B0D]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">{t.whyPro.title}</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.whyPro.sub}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.whyPro.items.map((item, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{item.stat}</div>
                <div className="text-[#FF3B30] font-medium mb-2 text-sm uppercase tracking-wide">{item.label}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-28 lg:py-36 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D] via-[#FF3B30]/5 to-[#0B0B0D]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF3B30]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5">{t.finalCta.title}</motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">{t.finalCta.sub}</motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <Button size="lg"
              className="h-16 px-12 text-lg font-semibold bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-xl shadow-[#FF3B30]/30 transition-all hover:shadow-[#FF3B30]/50 hover:scale-[1.02]"
              onClick={openSignup} data-testid="final-cta-btn">
              {t.finalCta.btn}<ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 lg:px-12 border-t border-white/5 bg-[#0B0B0D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#FF3B30] to-[#FF6A3D] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-500 text-sm">{t.footer.copy}</span>
          </div>
          <div className="flex items-center gap-6">
            {t.footer.links.map((link, i) => (
              <a key={i} href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* AUTH DIALOG */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10" data-testid="auth-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white text-center">{isLogin ? t.auth.signIn : t.auth.signUp}</DialogTitle>
            <DialogDescription className="sr-only">{isLogin ? 'Sign in' : 'Create account'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-400">{t.auth.name}</Label>
                <Input id="fullName" type="text" className="bg-white/5 border-white/10 text-white h-12"
                  value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required={!isLogin} data-testid="auth-name-input" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-400">{t.auth.email}</Label>
              <Input id="email" type="email" className="bg-white/5 border-white/10 text-white h-12"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required data-testid="auth-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-400">{t.auth.password}</Label>
              <Input id="password" type="password" className="bg-white/5 border-white/10 text-white h-12"
                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required data-testid="auth-password-input" />
            </div>
            <Button type="submit" className="w-full h-12 bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-medium"
              disabled={loading} data-testid="auth-submit-btn">
              {loading ? t.auth.processing : (isLogin ? t.auth.signIn : t.auth.signUp)}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0a0a] px-3 text-gray-500">{t.auth.or}</span></div>
          </div>
          <Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5"
            onClick={handleGoogleLogin} data-testid="auth-google-btn"><GoogleIcon />{t.auth.google}</Button>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? t.auth.switchToSignUp : t.auth.switchToSignIn}{' '}
            <button type="button" className="text-[#FF3B30] hover:text-[#FF4D42] font-medium" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? t.auth.signUp : t.auth.signIn}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
