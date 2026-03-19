import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import type { Product } from '@/data/products';

type Tab = 'home' | 'cart' | 'orders' | 'profile';
type Screen = { type: 'tabs' } | { type: 'product'; product: Product } | { type: 'checkout' };

const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>({ type: 'tabs' });

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
          onBack={() => setScreen({ type: 'tabs' })}
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
