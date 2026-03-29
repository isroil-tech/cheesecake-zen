import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { type Product } from '@/types/products';
import { ProductCard } from '@/components/ProductCard';
import { useCatalogStore } from '@/stores/catalogStore';

interface HomePageProps {
  onProductTap: (product: Product) => void;
}

export function HomePage({ onProductTap }: HomePageProps) {
  const { t, language } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { products, categories, isLoading } = useCatalogStore();

  const filtered = selectedCategory === 'all' 
    ? products 
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">77CHEESECAKE</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('tagline')}</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 active-scale ${
            selectedCategory === 'all'
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {t('home.categories.all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 active-scale ${
              selectedCategory === cat.id
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {language === 'ru' ? cat.nameRu : cat.nameUz}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="px-5 text-center py-10 text-muted-foreground text-sm flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {language === 'ru' ? 'Загрузка каталога...' : 'Katalog yuklanmoqda...'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} onTap={onProductTap} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
