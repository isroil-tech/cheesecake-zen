import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { CheckCircle2 } from 'lucide-react';

export function SuccessAnimation({ onDone }: { onDone: () => void }) {
  const { language } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-5"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        className="flex flex-col items-center gap-5 text-center bg-card p-8 rounded-[32px] shadow-2xl border border-border/50 max-w-sm w-full"
      >
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground"
        >
          {language === 'ru' ? 'Спасибо за заказ!' : 'Xaridingiz uchun rahmat!'}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[15px] text-muted-foreground leading-relaxed"
        >
          {language === 'ru' 
            ? 'Ваш заказ успешно принят. Наши менеджеры свяжутся с вами в ближайшее время для подтверждения.' 
            : 'Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada menedjerlarimiz siz bilan bog\'lanishadi.'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onDone}
          className="mt-4 w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold active-scale"
        >
          {language === 'ru' ? 'Отлично' : 'Tushunarli'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
