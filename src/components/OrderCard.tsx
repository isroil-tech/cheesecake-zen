import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice } from '@/data/products';
import type { Order, OrderStatus } from '@/stores/orderStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  accepted: 'bg-sky-100 text-sky-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-secondary text-muted-foreground',
  cancelled: 'bg-red-100 text-red-600',
};

interface OrderCardProps {
  order: Order;
  index: number;
}

export function OrderCard({ order, index }: OrderCardProps) {
  const { t, language } = useTranslation();

  const date = new Date(order.date);
  const formattedDate = date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card rounded-2xl p-4 card-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusColors[order.status])}>
          {t(`orders.status.${order.status}`)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('orders.items', { count: order.items.length || 2 })}
        </span>
        <span className="text-base font-semibold text-foreground">
          {formatPrice(order.total)} {t('currency')}
        </span>
      </div>
    </motion.div>
  );
}
