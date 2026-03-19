import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/data/products';
import { QuantitySelector } from '@/components/QuantitySelector';
import { ShoppingBag } from 'lucide-react';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { t, language } = useTranslation();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t('cart.empty')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('cart.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="pb-36">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">{t('cart.title')}</h1>
      </div>

      <div className="px-5 space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={`${item.productId}-${item.format}`}
              layout
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3 p-3 bg-card rounded-2xl card-shadow"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                <img src={item.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.name[language]}</h3>
                    <span className="text-xs text-muted-foreground">
                      {t(`product.${item.format}`)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.format)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors active-scale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <QuantitySelector
                    quantity={item.quantity}
                    onChange={(q) => updateQuantity(item.productId, item.format, q)}
                    size="sm"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(item.pricePerUnit * item.quantity)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-14 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{t('cart.total')}</span>
          <span className="text-xl font-bold text-foreground">{formatPrice(getTotalPrice())} {t('currency')}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200"
        >
          {t('cart.checkout')}
        </button>
      </div>
    </div>
  );
}
