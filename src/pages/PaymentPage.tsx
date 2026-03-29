import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Upload, Check, Loader2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/data/products';
import { SuccessAnimation } from '@/components/SuccessAnimation';

interface PaymentPageProps {
  telegramId: string;
  orderId: string;
  orderNumber: number;
  total: number;
  deliveryType: string;
  onSuccess: () => void;
}

export function PaymentPage({ telegramId, orderId, orderNumber, total, deliveryType, onSuccess }: PaymentPageProps) {
  const { t, language } = useTranslation();
  const [paymentType, setPaymentType] = useState<'card' | 'cash'>('card');
  const [screenshot, setScreenshot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('8600 4929 3992 2874');
  const [cardHolder, setCardHolder] = useState('ABRORBEK AXMEDOV');
  const [copied, setCopied] = useState(false);

  const copyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    setCopied(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="min-h-screen bg-background pb-32">
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
              {/* Cash */}
              {deliveryType === 'pickup' ? (
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active-scale ${
                    paymentType === 'cash' ? 'border-primary bg-primary/5' : 'border-border bg-transparent hover:bg-secondary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    paymentType === 'cash' ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
                    <Banknote className={`w-6 h-6 ${paymentType === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-semibold ${paymentType === 'cash' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t('payment.cash')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'ru' ? 'Оплата при получении' : 'Joyida to\'lash'}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    paymentType === 'cash' ? 'bg-primary' : 'border-2 border-muted'
                  }`}>
                    {paymentType === 'cash' && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </button>
              ) : (
                <div className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-secondary/40 opacity-60 cursor-not-allowed">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                    <Banknote className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-muted-foreground line-through">{t('payment.cash')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'ru'
                        ? 'Только для самовывоза'
                        : 'Faqat olib ketish uchun'}
                    </p>
                  </div>
                </div>
              )}

              {/* Card */}
              <button
                type="button"
                onClick={() => setPaymentType('card')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active-scale ${
                  paymentType === 'card' ? 'border-primary bg-primary/5' : 'border-border bg-transparent hover:bg-secondary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  paymentType === 'card' ? 'bg-primary/10' : 'bg-secondary'
                }`}>
                  <CreditCard className={`w-6 h-6 ${paymentType === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-left flex-1">
                  <p className={`font-semibold ${paymentType === 'card' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t('payment.card')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('payment.cardDesc')}</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  paymentType === 'card' ? 'bg-primary' : 'border-2 border-muted'
                }`}>
                  {paymentType === 'card' && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
              </button>
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
                <div 
                  onClick={copyCard}
                  className="bg-secondary rounded-2xl p-4 text-center cursor-pointer active:scale-95 transition-transform relative overflow-hidden group"
                >
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 justify-center">
                    {t('payment.cardNumber')}
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                  </p>
                  <p className="text-2xl font-bold text-foreground tracking-widest font-mono">
                    {cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{cardHolder}</p>
                  <div className={`absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px] transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      Nusxalandi!
                    </span>
                  </div>
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
      </div>

      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation onDone={() => { setShowSuccess(false); onSuccess(); }} />
        )}
      </AnimatePresence>
    </>
  );
}
