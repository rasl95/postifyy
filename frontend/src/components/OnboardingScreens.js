import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const WelcomeScreen = ({ onContinue }) => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] p-4">
      <Card className="max-w-lg w-full bg-[#111113] border-white/10">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#FF3B30]" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('onboarding.welcome')}
            </h1>
            <p className="text-base text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {t('onboarding.welcomeText')}
            </p>
          </div>

          <Button
            onClick={onContinue}
            className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-lg py-6 mt-8 shadow-lg shadow-[#FF3B30]/30"
            data-testid="start-creating-btn"
          >
            {t('onboarding.startCreating')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const FirstActionScreen = ({ onSelect }) => {
  const { t } = useLanguage();
  
  const options = [
    { id: 'instagram', label: t('onboarding.instagramPost'), route: '/create?tab=social_post', platform: 'instagram' },
    { id: 'tiktok', label: t('onboarding.videoIdea'), route: '/create?tab=video_idea', platform: 'tiktok' },
    { id: 'telegram', label: t('onboarding.productDesc'), route: '/create?tab=product_description', platform: 'telegram' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] p-4">
      <Card className="max-w-lg w-full bg-[#111113] border-white/10">
        <CardContent className="pt-12 pb-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('onboarding.firstAction')}
            </h1>
          </div>

          <div className="space-y-3">
            {options.map((option) => (
              <Button
                key={option.id}
                onClick={() => onSelect(option)}
                variant="outline"
                className="w-full text-lg py-6 border-white/20 text-white hover:border-[#FF3B30] hover:bg-[#FF3B30]/10"
                data-testid={`option-${option.id}`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AfterGenerationHint = ({ remaining }) => {
  const { language } = useLanguage();
  
  if (remaining === 2) {
    return (
      <Card className="border-[#FF3B30]/20 bg-[#FF3B30]/10 mt-4">
        <CardContent className="py-4">
          <p className="text-sm text-center text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {language === 'ru' 
              ? <>Отличный результат! У вас осталось <span className="font-semibold">{remaining} бесплатных генерации</span>.</>
              : <>Great result! You have <span className="font-semibold">{remaining} free generations left</span>.</>
            }
          </p>
          <p className="text-xs text-center text-gray-400 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {language === 'ru' 
              ? 'Pro снимает лимиты и даёт более детальные результаты.'
              : 'Pro removes limits and gives more detailed outputs.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  if (remaining === 1) {
    return (
      <Card className="border-[#FF3B30]/30 bg-[#111113] mt-4">
        <CardContent className="py-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {language === 'ru' ? 'Хотите продолжить без лимитов?' : 'Want to continue without limits?'}
            </h3>
            <div className="text-sm text-gray-400 space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p>{language === 'ru' ? 'Pro открывает:' : 'Pro unlocks:'}</p>
              <ul className="space-y-1 mt-2">
                <li>• {language === 'ru' ? '200 генераций в месяц' : '200 generations per month'}</li>
                <li>• {language === 'ru' ? 'Более детальный контент' : 'More detailed content'}</li>
                <li>• {language === 'ru' ? 'Приоритетная генерация' : 'Priority generation'}</li>
              </ul>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/settings'}
            className="w-full bg-[#FF3B30] hover:bg-[#FF4D42]"
          >
            {language === 'ru' ? 'Продолжить без лимитов' : 'Continue without limits'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export const LimitReachedConversion = ({ onUpgrade }) => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] p-4">
      <Card className="max-w-lg w-full bg-[#111113] border-white/10">
        <CardContent className="pt-12 pb-8 space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {language === 'ru' ? 'Вы достигли лимита' : "You've reached the free limit"}
            </h1>
            <div className="text-base text-gray-400 space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p>{language === 'ru' ? 'Вы использовали все 3 бесплатных генерации.' : "You've used all 3 free generations."}</p>
              <p>{language === 'ru' ? 'Продолжайте создавать контент без ограничений.' : 'Continue creating content without interruptions.'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onUpgrade}
              className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-lg py-6 shadow-lg shadow-[#FF3B30]/30"
              data-testid="continue-without-limits-btn"
            >
              {language === 'ru' ? 'Продолжить без лимитов' : 'Continue without limits'}
            </Button>
            <p className="text-xs text-center text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              {language === 'ru' ? 'Отмена в любое время' : 'Cancel anytime'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const UpgradeConfirmation = ({ onContinue }) => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] p-4">
      <Card className="max-w-lg w-full bg-[#111113] border-white/10">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#FF3B30]" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {language === 'ru' ? 'Добро пожаловать в Pro' : 'Welcome to Pro'}
            </h1>
            <div className="text-base text-gray-400 space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p>{language === 'ru' ? 'Теперь у вас 200 генераций в месяц.' : 'You now have 200 generations per month.'}</p>
              <p>{language === 'ru' ? 'Создавайте контент без лимитов.' : 'Create content without limits.'}</p>
            </div>
          </div>

          <Button
            onClick={onContinue}
            className="w-full bg-[#FF3B30] hover:bg-[#FF4D42] text-lg py-6 mt-8 shadow-lg shadow-[#FF3B30]/30"
            data-testid="create-content-btn"
          >
            {language === 'ru' ? 'Создать контент' : 'Create content'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
