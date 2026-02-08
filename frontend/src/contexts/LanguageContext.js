import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Translations
const translations = {
  en: {
    // Navigation
    nav: {
      signIn: 'Sign In',
    },
    // Hero
    hero: {
      badge: 'Powered by GPT-5',
      title1: 'Stop Writing.',
      title2: 'Start Publishing.',
      subtitle: 'Ready content in 30 seconds. Social media posts, video ideas, and product descriptions — everything you need to grow your business.',
      cta: 'Create content for free',
      watchDemo: 'Watch demo',
      freeGenerations: '3 free generations',
      noCard: 'No credit card',
      readyIn30: 'Ready in 30 sec',
      createFor: 'Create content for',
    },
    // Demo
    demo: {
      title: 'Postify AI — Live Demo',
      aiActive: 'AI Active',
      yourPrompt: 'Your prompt',
      topic: 'Topic:',
      platform: 'Platform:',
      tone: 'Tone:',
      topicValue: 'Motivation for entrepreneurs',
      toneValue: 'Motivational',
      processing: 'Processing: ~3 sec',
      aiResult: 'AI result',
      tryIt: 'Try it yourself',
      demoOutput: `🚀 Ready to scale your business? Here's what separates top performers from the rest:

1️⃣ They focus on systems, not just goals
2️⃣ They invest in their network
3️⃣ They learn from every failure

Your next breakthrough is one decision away. What will you choose today?

#BusinessGrowth #Entrepreneurship #Success #Mindset`,
    },
    // Features
    features: {
      title: 'Three tools. Endless possibilities.',
      subtitle: 'Choose a format and get ready-to-use content',
      social: {
        title: 'Social Media Posts',
        description: 'Instagram, TikTok, Telegram — with hashtags and emojis',
      },
      video: {
        title: 'Video Ideas',
        description: 'Viral concepts with hooks and structure',
      },
      product: {
        title: 'Product Descriptions',
        description: 'Selling copy that converts',
      },
    },
    // Pricing
    pricing: {
      title: 'Simple and honest pricing',
      subtitle: 'Start free. Scale when ready.',
      month: '/month',
      popular: 'Popular',
      free: {
        name: 'Free',
        generations: '3 generations/month',
        allTools: 'All 3 tools',
        cta: 'Start for free',
      },
      pro: {
        name: 'Pro',
        generations: '200 generations/month',
        tones: 'All tones and styles',
        export: 'Export to CSV/PDF',
        cta: 'Choose Pro',
      },
      business: {
        name: 'Business',
        generations: '600 generations/month',
        priority: 'Priority processing',
        analytics: 'Advanced analytics',
        cta: 'Choose Business',
      },
    },
    // Final CTA
    finalCta: {
      title: 'Ready to create content faster?',
      subtitle: 'Join thousands of content creators who save hours every week.',
      cta: 'Start for free',
    },
    // Auth
    auth: {
      signIn: 'Sign In',
      createAccount: 'Create Account',
      welcomeBack: 'Welcome back to Postify AI',
      startCreating: 'Start creating amazing content today',
      continueGoogle: 'Continue with Google',
      or: 'or',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      processing: 'Processing...',
      noAccount: "Don't have an account? Sign up",
      hasAccount: 'Already have an account? Sign in',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      generationsLeft: 'generations left',
      quickStart: 'Quick Start',
      createPost: 'Create a social media post',
      createVideo: 'Generate video ideas',
      createProduct: 'Write product description',
    },
    // Sidebar
    sidebar: {
      dashboard: 'Dashboard',
      socialPost: 'Social Post',
      videoIdeas: 'Video Ideas',
      productDesc: 'Product Description',
      history: 'History',
      settings: 'Settings',
      logout: 'Logout',
    },
    // Generator pages
    generator: {
      topic: 'Topic',
      topicPlaceholder: 'What would you like to create content about?',
      platform: 'Platform',
      tone: 'Tone',
      audience: 'Target Audience',
      audiencePlaceholder: 'Who is this content for?',
      generate: 'Generate',
      generating: 'Generating...',
      result: 'Result',
      copy: 'Copy',
      copied: 'Copied!',
      regenerate: 'Regenerate',
      // Social Post
      socialTitle: 'Social Media Post Generator',
      socialSubtitle: 'Create engaging posts for your social media',
      // Video Ideas
      videoTitle: 'Video Ideas Generator',
      videoSubtitle: 'Get creative video concepts for your content',
      niche: 'Niche',
      nichePlaceholder: 'e.g., Fitness, Cooking, Tech reviews',
      goal: 'Goal',
      goalPlaceholder: 'e.g., Grow audience, Sell product, Educate',
      // Product Description
      productTitle: 'Product Description Generator',
      productSubtitle: 'Create compelling product descriptions',
      productName: 'Product Name',
      productNamePlaceholder: 'Enter your product name',
      customer: 'Target Customer',
      customerPlaceholder: 'Who would buy this product?',
      benefits: 'Key Benefits',
      benefitsPlaceholder: 'Main benefits of your product',
    },
    // History
    history: {
      title: 'Generation History',
      subtitle: 'View and manage your past content generations',
      export: 'Export',
      exportHint: 'Export your history to CSV or PDF',
      upgradeHint: 'Upgrade to Pro or Business plan to download your content history',
      upgrade: 'Upgrade',
      noHistory: 'No generations yet. Start creating content!',
      tokens: 'tokens',
    },
    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Manage your account and subscription',
      currentPlan: 'Current Plan',
      activeSubscription: 'Your active subscription',
      usedOf: 'of',
      generationsUsed: 'generations used this month',
      manageBilling: 'Manage Billing',
      billingHint: 'Manage your payment methods, view invoices, or cancel your subscription through the Stripe Customer Portal.',
      upgradePlans: 'Upgrade Plans',
      choosePlan: 'Choose the plan that works for you',
      currentPlanBadge: 'Current Plan',
    },
    // Tones
    tones: {
      neutral: 'Neutral',
      professional: 'Professional',
      casual: 'Casual',
      funny: 'Funny',
      inspiring: 'Inspiring',
      selling: 'Selling',
      expert: 'Expert',
      bold: 'Bold',
      ironic: 'Ironic',
      provocative: 'Provocative',
    },
    // Post Goals (CTA)
    postGoals: {
      label: 'Post Goal',
      none: 'No specific goal',
      sell: 'Sell / Convert',
      likes: 'Get Likes',
      comments: 'Get Comments',
      dm: 'Move to DM',
      proOnly: 'Pro feature',
    },
    // Favorites
    favorites: {
      title: 'Favorites',
      subtitle: 'Your saved generations',
      addToFavorites: 'Add to favorites',
      removeFromFavorites: 'Remove from favorites',
      added: 'Added to favorites!',
      removed: 'Removed from favorites',
      empty: 'No favorites yet. Save your best generations!',
      proOnly: 'Favorites are available for Pro and Business plans',
    },
    // Priority Processing (Business)
    priority: {
      badge: 'Priority',
      processing: 'Priority processing...',
      processed: 'Priority processed',
      businessOnly: 'Business feature',
      enhanced: 'Enhanced output with A/B variants',
      description: 'Business plan includes priority generation with enhanced detailed output',
    },
    // Social Proof
    socialProof: {
      creators: '1,000+ creators already using',
      posts: '40,000+ posts generated',
      review1: '"Postify AI saves me hours every week. The content is always on point!"',
      review1Author: '— Sarah M., Content Creator',
      review2: '"Finally, AI that understands my brand voice. Highly recommend!"',
      review2Author: '— Alex K., Marketing Manager',
      review3: '"The best investment for my social media strategy."',
      review3Author: '— Mike R., Entrepreneur',
    },
    // Trust badges
    trust: {
      fastGeneration: 'Usually takes 10-20 seconds',
      noStorage: "We don't store your ideas",
    },
    // Platforms
    platforms: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      telegram: 'Telegram',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    },
    // Onboarding
    onboarding: {
      welcome: 'Welcome to Postify AI!',
      welcomeText: "You have 3 free generations to explore. Let's create something amazing!",
      startCreating: 'Start creating',
      firstAction: 'What would you like to create first?',
      instagramPost: 'Instagram post',
      videoIdea: 'Video idea',
      productDesc: 'Product description',
    },
    // Limit reached
    limitReached: {
      title: 'Free limit reached',
      text: "You've used all 3 free generations. Upgrade to Pro for 200 generations per month!",
      upgrade: 'Upgrade to Pro',
      later: 'Maybe later',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
    },
  },
  ru: {
    // Navigation
    nav: {
      signIn: 'Войти',
    },
    // Hero
    hero: {
      badge: 'Powered by GPT-5',
      title1: 'Хватит писать.',
      title2: 'Пора публиковать.',
      subtitle: 'Готовый контент за 30 секунд. Посты для соцсетей, идеи для видео и описания продуктов — всё, что нужно для роста вашего бизнеса.',
      cta: 'Создать контент бесплатно',
      watchDemo: 'Смотреть демо',
      freeGenerations: '3 бесплатных генерации',
      noCard: 'Без карты',
      readyIn30: 'Готово за 30 сек',
      createFor: 'Создавайте контент для',
    },
    // Demo
    demo: {
      title: 'Postify AI — Live Demo',
      aiActive: 'AI Active',
      yourPrompt: 'Ваш запрос',
      topic: 'Тема:',
      platform: 'Платформа:',
      tone: 'Тон:',
      topicValue: 'Мотивация для предпринимателей',
      toneValue: 'Мотивационный',
      processing: 'Обработка: ~3 сек',
      aiResult: 'AI результат',
      tryIt: 'Попробовать самому',
      demoOutput: `🚀 Готовы масштабировать свой бизнес? Вот что отличает лидеров от остальных:

1️⃣ Они фокусируются на системах, а не только на целях
2️⃣ Они инвестируют в свою сеть контактов
3️⃣ Они учатся на каждой неудаче

Ваш следующий прорыв — это одно решение. Что вы выберете сегодня?

#РостБизнеса #Предпринимательство #Успех #Мышление`,
    },
    // Features
    features: {
      title: 'Три инструмента. Бесконечные возможности.',
      subtitle: 'Выберите формат и получите готовый контент',
      social: {
        title: 'Посты для соцсетей',
        description: 'Instagram, TikTok, Telegram — с хэштегами и эмодзи',
      },
      video: {
        title: 'Идеи для видео',
        description: 'Вирусные концепции с хуками и структурой',
      },
      product: {
        title: 'Описания продуктов',
        description: 'Продающие тексты, которые конвертируют',
      },
    },
    // Pricing
    pricing: {
      title: 'Простые и честные цены',
      subtitle: 'Начните бесплатно. Масштабируйтесь когда готовы.',
      month: '/месяц',
      popular: 'Популярный',
      free: {
        name: 'Free',
        generations: '3 генерации/месяц',
        allTools: 'Все 3 инструмента',
        cta: 'Начать бесплатно',
      },
      pro: {
        name: 'Pro',
        generations: '200 генераций/месяц',
        tones: 'Все тоны и стили',
        export: 'Экспорт в CSV/PDF',
        cta: 'Выбрать Pro',
      },
      business: {
        name: 'Business',
        generations: '600 генераций/месяц',
        priority: 'Приоритетная обработка',
        analytics: 'Продвинутая аналитика',
        cta: 'Выбрать Business',
      },
    },
    // Final CTA
    finalCta: {
      title: 'Готовы создавать контент быстрее?',
      subtitle: 'Присоединяйтесь к тысячам создателей контента, которые экономят часы каждую неделю.',
      cta: 'Начать бесплатно',
    },
    // Auth
    auth: {
      signIn: 'Войти',
      createAccount: 'Создать аккаунт',
      welcomeBack: 'С возвращением в Postify AI',
      startCreating: 'Начните создавать контент уже сегодня',
      continueGoogle: 'Продолжить с Google',
      or: 'или',
      name: 'Имя',
      email: 'Email',
      password: 'Пароль',
      processing: 'Обработка...',
      noAccount: 'Нет аккаунта? Зарегистрироваться',
      hasAccount: 'Уже есть аккаунт? Войти',
    },
    // Dashboard
    dashboard: {
      title: 'Дашборд',
      welcome: 'С возвращением',
      generationsLeft: 'генераций осталось',
      quickStart: 'Быстрый старт',
      createPost: 'Создать пост для соцсетей',
      createVideo: 'Сгенерировать идеи для видео',
      createProduct: 'Написать описание продукта',
    },
    // Sidebar
    sidebar: {
      dashboard: 'Дашборд',
      socialPost: 'Пост для соцсетей',
      videoIdeas: 'Идеи для видео',
      productDesc: 'Описание продукта',
      history: 'История',
      settings: 'Настройки',
      logout: 'Выйти',
    },
    // Generator pages
    generator: {
      topic: 'Тема',
      topicPlaceholder: 'О чём вы хотите создать контент?',
      platform: 'Платформа',
      tone: 'Тон',
      audience: 'Целевая аудитория',
      audiencePlaceholder: 'Для кого этот контент?',
      generate: 'Сгенерировать',
      generating: 'Генерация...',
      result: 'Результат',
      copy: 'Копировать',
      copied: 'Скопировано!',
      regenerate: 'Перегенерировать',
      // Social Post
      socialTitle: 'Генератор постов для соцсетей',
      socialSubtitle: 'Создавайте вовлекающие посты для ваших соцсетей',
      // Video Ideas
      videoTitle: 'Генератор идей для видео',
      videoSubtitle: 'Получите креативные концепции для вашего контента',
      niche: 'Ниша',
      nichePlaceholder: 'напр., Фитнес, Кулинария, Обзоры техники',
      goal: 'Цель',
      goalPlaceholder: 'напр., Рост аудитории, Продажа продукта, Обучение',
      // Product Description
      productTitle: 'Генератор описаний продуктов',
      productSubtitle: 'Создавайте убедительные описания продуктов',
      productName: 'Название продукта',
      productNamePlaceholder: 'Введите название продукта',
      customer: 'Целевой покупатель',
      customerPlaceholder: 'Кто будет покупать этот продукт?',
      benefits: 'Ключевые преимущества',
      benefitsPlaceholder: 'Главные преимущества вашего продукта',
    },
    // History
    history: {
      title: 'История генераций',
      subtitle: 'Просмотр и управление вашими прошлыми генерациями',
      export: 'Экспорт',
      exportHint: 'Экспортируйте историю в CSV или PDF',
      upgradeHint: 'Перейдите на Pro или Business план для скачивания истории',
      upgrade: 'Улучшить',
      noHistory: 'Пока нет генераций. Начните создавать контент!',
      tokens: 'токенов',
    },
    // Settings
    settings: {
      title: 'Настройки',
      subtitle: 'Управление аккаунтом и подпиской',
      currentPlan: 'Текущий план',
      activeSubscription: 'Ваша активная подписка',
      usedOf: 'из',
      generationsUsed: 'генераций использовано в этом месяце',
      manageBilling: 'Управление оплатой',
      billingHint: 'Управляйте способами оплаты, просматривайте счета или отмените подписку через Stripe Customer Portal.',
      upgradePlans: 'Тарифные планы',
      choosePlan: 'Выберите план, который вам подходит',
      currentPlanBadge: 'Текущий план',
    },
    // Tones
    tones: {
      neutral: 'Нейтральный',
      professional: 'Профессиональный',
      casual: 'Неформальный',
      funny: 'Смешной',
      inspiring: 'Вдохновляющий',
      selling: 'Продающий',
      expert: 'Экспертный',
      bold: 'Дерзкий',
      ironic: 'Ироничный',
      provocative: 'Провокационный',
    },
    // Post Goals (CTA)
    postGoals: {
      label: 'Цель поста',
      none: 'Без конкретной цели',
      sell: 'Продать / Конвертировать',
      likes: 'Набрать лайки',
      comments: 'Получить комментарии',
      dm: 'Перевести в директ',
      proOnly: 'Функция Pro',
    },
    // Favorites
    favorites: {
      title: 'Избранное',
      subtitle: 'Ваши сохранённые генерации',
      addToFavorites: 'Добавить в избранное',
      removeFromFavorites: 'Удалить из избранного',
      added: 'Добавлено в избранное!',
      removed: 'Удалено из избранного',
      empty: 'Пока нет избранного. Сохраняйте лучшие генерации!',
      proOnly: 'Избранное доступно на планах Pro и Business',
    },
    // Social Proof
    socialProof: {
      creators: 'Уже используют 1000+ создателей',
      posts: 'Сгенерировано 40 000+ постов',
      review1: '"Postify AI экономит мне часы каждую неделю. Контент всегда в точку!"',
      review1Author: '— Анна М., Контент-креатор',
      review2: '"Наконец-то ИИ, который понимает голос моего бренда. Рекомендую!"',
      review2Author: '— Алексей К., Маркетинг-менеджер',
      review3: '"Лучшая инвестиция в мою стратегию соцсетей."',
      review3Author: '— Михаил Р., Предприниматель',
    },
    // Trust badges
    trust: {
      fastGeneration: 'Обычно занимает 10-20 секунд',
      noStorage: 'Мы не сохраняем ваши идеи',
    },
    // Platforms
    platforms: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      telegram: 'Telegram',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    },
    // Priority Processing (Business)
    priority: {
      badge: 'Приоритет',
      processing: 'Приоритетная обработка...',
      processed: 'Приоритетно обработано',
      businessOnly: 'Функция Business',
      enhanced: 'Расширенный вывод с A/B вариантами',
      description: 'Business план включает приоритетную генерацию с расширенным детальным выводом',
    },
    // Onboarding
    onboarding: {
      welcome: 'Добро пожаловать в Postify AI!',
      welcomeText: 'У вас есть 3 бесплатных генерации. Давайте создадим что-то потрясающее!',
      startCreating: 'Начать создавать',
      firstAction: 'Что вы хотите создать первым?',
      instagramPost: 'Пост для Instagram',
      videoIdea: 'Идею для видео',
      productDesc: 'Описание продукта',
    },
    // Limit reached
    limitReached: {
      title: 'Лимит исчерпан',
      text: 'Вы использовали все 3 бесплатных генерации. Перейдите на Pro для 200 генераций в месяц!',
      upgrade: 'Перейти на Pro',
      later: 'Позже',
    },
    // Common
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      cancel: 'Отмена',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      close: 'Закрыть',
    },
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get from localStorage or detect browser language
    const saved = localStorage.getItem('postify_language');
    if (saved) return saved;
    
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ru' ? 'ru' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('postify_language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English
        value = translations.en;
        for (const k2 of keys) {
          if (value && value[k2] !== undefined) {
            value = value[k2];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }
    
    return value;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
