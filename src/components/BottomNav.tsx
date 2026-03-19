import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'home' | 'cart' | 'orders' | 'profile';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { key: Tab; icon: typeof Home }[] = [
  { key: 'home', icon: Home },
  { key: 'cart', icon: ShoppingBag },
  { key: 'orders', icon: ClipboardList },
  { key: 'profile', icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-4">
        {tabs.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'relative flex items-center justify-center w-12 h-12 rounded-2xl transition-colors duration-200 active-scale',
              active === key ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-[22px] h-[22px]" strokeWidth={active === key ? 2.2 : 1.8} />
            {active === key && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            {key === 'cart' && totalItems > 0 && (
              <AnimatePresence>
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold"
                >
                  {totalItems}
                </motion.span>
              </AnimatePresence>
            )}
          </button>
        ))}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
