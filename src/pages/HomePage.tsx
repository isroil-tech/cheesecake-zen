import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { products, type Product } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

type Category = 'all' | 'classic' | 'fruit' | 'special';

interface HomePageProps {
  onProductTap: (product: Product) => void;
}

export function HomePage({ onProductTap }: HomePageProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<Category>('all');

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: t('home.categories.all') },
    { key: 'classic', label: t('home.categories.classic') },
    { key: 'fruit', label: t('home.categories.fruit') },
    { key: 'special', label: t('home.categories.special') },
  ];

  const filtered = category === 'all' ? products : products.filter((p) => p.category === category);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">77Cheesecake</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('tagline')}</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 active-scale ${
              category === cat.key
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 px-5">
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} onTap={onProductTap} index={i} />
        ))}
      </div>
    </div>
  );
}
