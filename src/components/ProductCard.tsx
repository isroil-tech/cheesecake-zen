import { Plus } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice, type Product } from '@/types/products';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onTap: (product: Product) => void;
  index: number;
}

export function ProductCard({ product, onTap, index }: ProductCardProps) {
  const { t, language } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.wholeStock === 0 && product.sliceStock === 0;
  const defaultPrice = product.sliceStock > 0 ? product.priceSlice : product.priceWhole;
  const defaultFormat = product.sliceStock > 0 ? 'slice' : 'whole';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      productVariantId: defaultFormat === 'whole' ? product.wholeVariantId : product.sliceVariantId,
      format: defaultFormat as 'whole' | 'slice',
      quantity: 1,
      pricePerUnit: defaultPrice,
      name: product.name,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative flex flex-col bg-card rounded-2xl overflow-hidden card-shadow active-scale cursor-pointer',
        isOutOfStock && 'opacity-50'
      )}
      onClick={() => onTap(product)}
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name[language]}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
          {product.name[language]}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {product.description[language]}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(defaultPrice)} <span className="text-xs font-normal text-muted-foreground">{t('currency')}</span>
          </span>
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 active-scale',
              added
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground'
            )}
          >
            {added ? (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path d="M5 12l5 5L19 7" />
              </motion.svg>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
