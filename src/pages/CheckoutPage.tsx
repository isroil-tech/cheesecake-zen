import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice } from '@/data/products';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { YandexAddressSearch } from '@/components/YandexAddressSearch';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CheckoutPage({ onBack, onSuccess }: CheckoutPageProps) {
  const { t, language } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = () => {
    addOrder({
      items: [...items],
      total: getTotalPrice(),
      deliveryType,
      address: deliveryType === 'delivery' ? address : undefined,
      comment: comment || undefined,
    });
    clearCart();
    setShowSuccess(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen bg-background pb-32"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active-scale">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[22px] font-bold text-foreground">{t('checkout.title')}</h1>
        </div>

        <div className="px-5 space-y-6">
          {/* Delivery / Pickup */}
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 active-scale ${
                deliveryType === 'delivery'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {t('checkout.delivery')}
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 active-scale ${
                deliveryType === 'pickup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {t('checkout.pickup')}
            </button>
          </div>

          {/* Address */}
          <AnimatePresence>
            {deliveryType === 'delivery' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <label className="text-sm font-medium text-foreground">{t('checkout.address')}</label>
                <div className="mt-2">
                  <YandexAddressSearch
                    value={address}
                    onChange={setAddress}
                    placeholder={t('checkout.addressPlaceholder')}
                  />
                </div>
            )}
          </AnimatePresence>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-foreground">{t('checkout.comment')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('checkout.commentPlaceholder')}
              rows={3}
              className="w-full mt-2 px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
            />
          </div>

          {/* Order summary */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">{t('checkout.orderSummary')}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={`${item.productId}-${item.format}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name[language]} × {item.quantity}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(item.pricePerUnit * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex justify-between">
                <span className="font-medium text-foreground">{t('cart.total')}</span>
                <span className="text-lg font-bold text-foreground">{formatPrice(getTotalPrice())} {t('currency')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <button
            onClick={handleConfirm}
            disabled={deliveryType === 'delivery' && !address.trim()}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50"
          >
            {t('checkout.confirm')}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation onDone={() => { setShowSuccess(false); onSuccess(); }} />
        )}
      </AnimatePresence>
    </>
  );
}
