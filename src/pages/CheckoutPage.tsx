import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Phone, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice } from '@/data/products';


interface CheckoutPageProps {
  telegramId: string;
  onBack: () => void;
  onPayment: (orderId: string, orderNumber: number, total: number) => void;
}

export function CheckoutPage({ telegramId, onBack, onPayment }: CheckoutPageProps) {
  const { t, language } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [extraPhone, setExtraPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile info from backend (Fix 4)
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      let tgId = telegramId;
      if (!tgId) tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
      if (!tgId) return;
      try {
        const res = await fetch('/api/v1/users/me', {
          headers: { 'x-telegram-id': tgId },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setUserPhone(data.phone);
          if (data.firstName) setUserName(data.firstName + (data.lastName ? ' ' + data.lastName : ''));
        }
      } catch (_) {}
    };
    fetchProfile();
  }, [telegramId]);

  const handleLocationChange = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleConfirm = async () => {
    if (loading) return;
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    // Get telegramId — try from props, then from Telegram WebApp
    let tgId = telegramId;
    if (!tgId) {
      tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
    }

    // Fallback: allow guest orders when Telegram context is unavailable
    if (!tgId) {
      tgId = `guest-${Date.now()}`;
    }

    try {
      if (userName || userPhone) {
        await fetch('/api/v1/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-telegram-id': tgId,
          },
          body: JSON.stringify({
            firstName: userName,
            phone: userPhone,
          }),
        }).catch(() => {});
      }

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': tgId,
        },
        body: JSON.stringify({
          deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          latitude: deliveryType === 'delivery' ? latitude : undefined,
          longitude: deliveryType === 'delivery' ? longitude : undefined,
          extraPhone: extraPhone || undefined,
          floor: deliveryType === 'delivery' ? (floor || undefined) : undefined,
          comment: comment || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            format: item.format,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const order = await res.json();

      if (order.id) {
        addOrder({
          items: [...items],
          total: getTotalPrice(),
          deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          comment: comment || undefined,
        });
        const total = getTotalPrice();
        clearCart();
        onPayment(order.id, order.orderNumber, total);
      } else {
        setError(order.error || (language === 'ru' ? 'Ошибка создания заказа' : 'Buyurtma yaratishda xatolik'));
      }
    } catch (err: any) {
      console.error('Order error:', err);
      setError(language === 'ru'
        ? 'Не удалось отправить заказ. Проверьте интернет.'
        : 'Buyurtmani yuborib bo\'lmadi. Internetni tekshiring.');
    }
    setLoading(false);
  };


  return (
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
        {/* Profile info editable */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              {language === 'ru' ? 'Имя и фамилия' : 'Ism familiya'}
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={language === 'ru' ? 'Ваше имя' : 'Ismingiz'}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              {language === 'ru' ? 'Телефон номер' : 'Telefon raqam'}
            </label>
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+998 ..."
              className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

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

        {/* Address section */}
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
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('checkout.addressPlaceholder')}
                  rows={2}
                  className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              {/* Extra phone (Fix 4 — qo'shimcha raqam ixtiyoriy) */}
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {language === 'ru' ? 'Доп. номер (необязательно)' : "Qo'shimcha raqam (ixtiyoriy)"}
                </label>
                <input
                  type="tel"
                  value={extraPhone}
                  onChange={(e) => setExtraPhone(e.target.value)}
                  placeholder="+998 ..."
                  className="w-full mt-2 px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Floor */}
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === 'ru' ? 'Этаж / квартира' : 'Qavat / xonadon'}
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder={language === 'ru' ? 'Напр: 3-й этаж, кв. 12' : 'Mas: 3-qavat, 12-xonadon'}
                  className="w-full mt-2 px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </motion.div>
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
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-start gap-2 mb-3 p-3 bg-destructive/10 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleConfirm}
          disabled={loading || (deliveryType === 'delivery' && !address.trim()) || items.length === 0 || !userName.trim() || !userPhone.trim()}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('checkout.confirm')
          )}
        </button>
      </div>
    </motion.div>
  );
}
