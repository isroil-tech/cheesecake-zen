import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductFormat = 'whole' | 'slice';

export interface CartItem {
  productId: string;
  productVariantId?: string;
  format: ProductFormat;
  quantity: number;
  pricePerUnit: number;
  name: { uz: string; ru: string };
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, format: ProductFormat) => void;
  updateQuantity: (productId: string, format: ProductFormat, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(
          (i) => i.productId === item.productId && i.format === item.format
        );
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.productId === item.productId && i.format === item.format
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (productId, format) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.format === format)
          ),
        })),
      updateQuantity: (productId, format, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => !(i.productId === productId && i.format === format))
            : state.items.map((i) =>
                i.productId === productId && i.format === format
                  ? { ...i, quantity }
                  : i
              ),
        })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0),
    }),
    { name: '77ck-cart' }
  )
);
