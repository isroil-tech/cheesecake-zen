import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { ChevronRight, Globe, MapPin, ClipboardList, User, Sun, Moon } from 'lucide-react';

interface ProfilePageProps {
  onNavigateOrders: () => void;
}

export function ProfilePage({ onNavigateOrders }: ProfilePageProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();

  const tg = window.Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;
  const telegramId = tgUser?.id?.toString() || localStorage.getItem('guest_telegram_id') || '';

  const [userName, setUserName] = useState(
    tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'User' : 'User'
  );
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    if (!telegramId) return;
    fetch('/api/v1/users/me', {
      headers: { 'x-telegram-id': telegramId },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) {
          const name = [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
          if (name) setUserName(name);
          if (d.phone) setUserPhone(d.phone);
        }
      })
      .catch(() => {});
  }, [telegramId]);

  return (
    <div className="pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">{t('profile.title')}</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* User info */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{userName}</h2>
              {userPhone && <p className="text-sm text-muted-foreground mt-0.5">{userPhone}</p>}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1">{t('profile.language')}</span>
            <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active-scale ${
                  language === 'uz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                O'zb
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active-scale ${
                  language === 'ru' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Рус
              </button>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-foreground flex-1">{t('profile.theme')}</span>
            <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active-scale flex items-center gap-1.5 ${
                  theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                {t('profile.lightTheme')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active-scale flex items-center gap-1.5 ${
                  theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {t('profile.darkTheme')}
              </button>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden divide-y divide-border">
          <button
            onClick={onNavigateOrders}
            className="w-full px-5 py-4 flex items-center gap-3 active-scale text-left"
          >
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1">{t('profile.orderHistory')}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="px-5 py-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{t('profile.addresses')}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profile.noAddresses')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
