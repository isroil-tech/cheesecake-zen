import { create } from 'zustand';
import { Product } from '@/data/products';

export interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  sortOrder: number;
}

interface CatalogStore {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  fetchCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch active categories
      const catRes = await fetch('/api/v1/catalog/categories');
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const categories: Category[] = await catRes.json();

      // Fetch active products with variants
      const prodRes = await fetch('/api/v1/catalog/products');
      if (!prodRes.ok) throw new Error('Failed to fetch products');
      const rawProducts: any[] = await prodRes.json();

      // Map backend products to frontend Product interface
      const products: Product[] = rawProducts.map((p) => {
        const wholeV = p.variants?.find((v: any) => v.unitType === 'whole');
        const sliceV = p.variants?.find((v: any) => v.unitType === 'slice');
        
        return {
          id: p.id,
          name: { uz: p.nameUz, ru: p.nameRu },
          description: { uz: p.descriptionUz || '', ru: p.descriptionRu || '' },
          category: p.categoryId, // Keep the categoryId to match dynamic categories
          image: p.imageUrl || 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&h=600&fit=crop',
          priceWhole: wholeV ? Number(wholeV.price) : 0,
          priceSlice: sliceV ? Number(sliceV.price) : 0,
          slicesPerWhole: wholeV?.piecesPerUnit || 8,
          wholeStock: wholeV ? 100 : 0, // Mock stock, since DB doesn't track inventory strictly
          sliceStock: sliceV ? 100 : 0,
          wholeVariantId: wholeV?.id,
          sliceVariantId: sliceV?.id,
        };
      });

      set({ products, categories, isLoading: false });
    } catch (err: any) {
      console.error('fetchCatalog error:', err);
      set({ error: err.message, isLoading: false });
    }
  },
}));
