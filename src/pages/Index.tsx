import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AuthPage } from '@/pages/AuthPage';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { Product } from '@/data/products';
import { useCatalogStore } from '@/stores/catalogStore';

type Tab = 'home' | 'cart' | 'orders' | 'profile';
type Screen =
  | { type: 'tabs' }
  | { type: 'product'; product: Product }
  | { type: 'auth'; redirectToCheckout?: boolean }
  | { type: 'checkout' }
  | { type: 'payment'; orderId: string; orderNumber: number; total: number };

const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>({ type: 'tabs' });
  const [telegramId, setTelegramId] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const fetchCatalog = useCatalogStore(s => s.fetchCatalog);

  useEffect(() => {
    fetchCatalog();
    // Get Supabase session
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      // If user just logged in and was redirected here for checkout
      if (sess && screen.type === 'auth' && (screen as any).redirectToCheckout) {
        setScreen({ type: 'checkout' });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const user = tg?.initDataUnsafe?.user;
    let tgId: string;

    const urlUid = new URLSearchParams(window.location.search).get('uid');

    if (user?.id) {
      tgId = user.id.toString();
    } else if (urlUid) {
      tgId = urlUid;
    } else {
      const stored = localStorage.getItem('guest_telegram_id');
      if (stored) {
        tgId = stored;
      } else {
        tgId = `guest-${Date.now()}`;
        localStorage.setItem('guest_telegram_id', tgId);
      }
    }

    setTelegramId(tgId);

    fetch('/api/v1/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: tgId,
        firstName: user?.first_name,
        lastName: user?.last_name,
      }),
    }).catch(() => {});
  }, []);

  const handleCheckout = () => {
    setScreen({ type: 'checkout' });
  };

  const renderContent = () => {
    if (screen.type === 'auth') {
      return (
        <AuthPage
          onAuth={() => {
            // After auth, go to checkout if that was the intent
            if ((screen as any).redirectToCheckout) {
              setScreen({ type: 'checkout' });
            } else {
              setScreen({ type: 'tabs' });
            }
          }}
        />
      );
    }

    if (screen.type === 'product') {
      return (
        <ProductDetailPage
          product={screen.product}
          onBack={() => setScreen({ type: 'tabs' })}
        />
      );
    }

    if (screen.type === 'checkout') {
      return (
        <CheckoutPage
          telegramId={telegramId}
          onBack={() => setScreen({ type: 'tabs' })}
          onPayment={(orderId, orderNumber, total) => {
            setScreen({ type: 'payment', orderId, orderNumber, total });
          }}
        />
      );
    }

    if (screen.type === 'payment') {
      return (
        <PaymentPage
          telegramId={telegramId}
          orderId={screen.orderId}
          orderNumber={screen.orderNumber}
          total={screen.total}
          onSuccess={() => {
            setScreen({ type: 'tabs' });
            setTab('orders');
          }}
        />
      );
    }

    switch (tab) {
      case 'home':
        return (
          <HomePage
            onProductTap={(product) => setScreen({ type: 'product', product })}
          />
        );
      case 'cart':
        return <CartPage onCheckout={handleCheckout} />;
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return <ProfilePage onNavigateOrders={() => setTab('orders')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.type === 'tabs' ? tab : screen.type}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full h-full min-h-screen"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
      {screen.type === 'tabs' && (
        <BottomNav active={tab} onChange={(t) => setTab(t)} />
      )}
    </div>
  );
};

export default Index;
