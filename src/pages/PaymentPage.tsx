import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Upload, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/data/products';
import { SuccessAnimation } from '@/components/SuccessAnimation';

interface PaymentPageProps {
  telegramId: string;
  orderId: string;
  orderNumber: number;
  total: number;
  onSuccess: () => void;
}

export function PaymentPage({ telegramId, orderId, orderNumber, total, onSuccess }: PaymentPageProps) {
  const { t, language } = useTranslation();
  const [paymentType] = useState<'card'>('card');
  const [screenshot, setScreenshot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('8600 4929 3992 2874');
  const [cardHolder, setCardHolder] = useState('ABRORBEK AXMEDOV');

  useEffect(() => {
    fetch('/api/v1/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.cardNumber) setCardNumber(d.cardNumber);
        if (d?.cardHolder) setCardHolder(d.cardHolder);
      })
      .catch(() => {});
  }, []);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (loading) return;
    if (paymentType === 'card' && !screenshot) return;

    setLoading(true);
    try {
      await fetch(`/api/v1/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': telegramId,
        },
        body: JSON.stringify({
          paymentType,
          paymentScreenshot: paymentType === 'card' ? screenshot : undefined,
        }),
      });

      setShowSuccess(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error('Payment error:', err);
    }
    setLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="min-h-screen bg-background pb-32"
      >
        {/* Header */}
        <div className="px-5 pt-12 pb-4">
          <h1 className="text-[22px] font-bold text-foreground">{t('payment.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('payment.orderInfo', { number: String(orderNumber).padStart(4, '0'), total: formatPrice(total) })}
          </p>
        </div>

        <div className="px-5 space-y-6">
          {/* Payment method */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">{t('payment.method')}</h3>
            <div className="space-y-3">
              {/* Cash — disabled */}
              <div className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-secondary/40 opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                  <Banknote className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-muted-foreground line-through">{t('payment.cash')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'ru'
                      ? 'Временно недоступно — оплатите онлайн'
                      : 'Hozircha mavjud emas — oldindan online to\'lov qiling'}
                  </p>
                </div>
              </div>

              {/* Card — always selected */}
              <div className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">{t('payment.card')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('payment.cardDesc')}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Card payment details */}
          <AnimatePresence>
            {paymentType === 'card' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-4"
              >
                {/* Card number */}
                <div className="bg-secondary rounded-2xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">{t('payment.cardNumber')}</p>
                  <p className="text-2xl font-bold text-foreground tracking-widest font-mono">
                    {cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{cardHolder}</p>
                </div>

                {/* Upload screenshot */}
                <label className={`flex flex-col items-center justify-center w-full py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  screenshot ? 'border-primary bg-primary/5' : 'border-border bg-secondary'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshot}
                    className="hidden"
                  />
                  {screenshot ? (
                    <>
                      <Check className="w-8 h-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-primary">{t('payment.uploaded')}</p>
                      <img src={screenshot} alt="Receipt" className="w-full max-h-32 object-contain rounded-xl mt-3" />
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">{t('payment.upload')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('payment.uploadDesc')}</p>
                    </>
                  )}
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <button
            onClick={handleConfirm}
            disabled={loading || (paymentType === 'card' && !screenshot)}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('payment.confirm')
            )}
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
