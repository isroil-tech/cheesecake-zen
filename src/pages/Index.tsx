import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import type { Product } from '@/data/products';

type Tab = 'home' | 'cart' | 'orders' | 'profile';
type Screen =
  | { type: 'tabs' }
  | { type: 'product'; product: Product }
  | { type: 'checkout' }
  | { type: 'payment'; orderId: string; orderNumber: number; total: number };

const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>({ type: 'tabs' });
  const [telegramId, setTelegramId] = useState<string>('');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const user = tg?.initDataUnsafe?.user;
    let tgId: string;

    if (user?.id) {
      tgId = user.id.toString();
    } else {
      // Guest fallback — for browser testing outside Telegram
      const stored = localStorage.getItem('guest_telegram_id');
      if (stored) {
        tgId = stored;
      } else {
        tgId = `guest-${Date.now()}`;
        localStorage.setItem('guest_telegram_id', tgId);
      }
    }

    setTelegramId(tgId);

    // Auth with backend (creates user if not exists)
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

  const renderContent = () => {
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
        return <CartPage onCheckout={() => setScreen({ type: 'checkout' })} />;
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return <ProfilePage onNavigateOrders={() => setTab('orders')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
      {screen.type === 'tabs' && (
        <BottomNav active={tab} onChange={(t) => setTab(t)} />
      )}
    </div>
  );
};

export default Index;
