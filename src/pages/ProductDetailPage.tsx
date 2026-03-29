import { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { formatPrice, type Product } from '@/data/products';
import { useCartStore, type ProductFormat } from '@/stores/cartStore';
import { FormatPicker } from '@/components/FormatPicker';
import { QuantitySelector } from '@/components/QuantitySelector';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetailPage({ product, onBack }: ProductDetailProps) {
  const { t, language } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const wholeAvailable = product.wholeStock > 0;
  const sliceAvailable = product.sliceStock > 0;

  const defaultFormat: ProductFormat = sliceAvailable ? 'slice' : 'whole';
  const [format, setFormat] = useState<ProductFormat>(defaultFormat);
  const [quantity, setQuantity] = useState(1);

  const price = format === 'whole' ? product.priceWhole : product.priceSlice;
  const stock = format === 'whole' ? product.wholeStock : product.sliceStock;
  const isLowStock = stock > 0 && stock <= 3;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productVariantId: format === 'whole' ? product.wholeVariantId : product.sliceVariantId,
      format,
      quantity,
      pricePerUnit: price,
      name: product.name,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onBack();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background"
    >
      {/* Hero image */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name[language]}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center active-scale"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pt-5 pb-32 -mt-4 bg-background rounded-t-3xl relative z-10">
        <h1 className="text-2xl font-bold text-foreground">{product.name[language]}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{product.description[language]}</p>

        <div className="text-2xl font-bold text-foreground mt-4">
          {formatPrice(price)} <span className="text-base font-normal text-muted-foreground">{t('currency')}</span>
        </div>

        {/* Format picker */}
        <div className="mt-6">
          <FormatPicker
            value={format}
            onChange={(f) => { setFormat(f); setQuantity(1); }}
            wholeAvailable={wholeAvailable}
            sliceAvailable={sliceAvailable}
          />
        </div>

        {/* Stock info */}
        {stock === 0 ? (
          <div className="flex items-center gap-2 mt-4 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            {t('product.outOfStock')}
          </div>
        ) : (
          <>
            {format === 'slice' && (
              <p className="text-sm text-muted-foreground mt-3">
                {t('product.slicesLeft', { count: stock })}
              </p>
            )}
            {isLowStock && (
              <p className="text-sm text-amber-600 mt-1">
                {t('product.lowStock', { count: stock })}
              </p>
            )}
          </>
        )}

        {/* Quantity & Add */}
        {stock > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={stock}
            />
            <div className="text-lg font-semibold text-foreground">
              {formatPrice(price * quantity)} {t('currency')}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 active-scale ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {added ? t('product.added') : t('product.addToCart')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
