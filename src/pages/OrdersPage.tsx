import { ClipboardList } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useOrderStore } from '@/stores/orderStore';
import { OrderCard } from '@/components/OrderCard';

export function OrdersPage() {
  const { t } = useTranslation();
  const orders = useOrderStore((s) => s.orders);

  return (
    <div className="pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">{t('orders.title')}</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-5">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t('orders.empty')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('orders.emptyDesc')}</p>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
