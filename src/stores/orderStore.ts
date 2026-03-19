import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from './cartStore';

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  deliveryType: 'delivery' | 'pickup';
  address?: string;
  comment?: string;
}

interface OrderState {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [
        {
          id: 'demo-1',
          items: [],
          total: 185000,
          status: 'delivered',
          date: '2025-03-15T14:30:00',
          deliveryType: 'delivery',
          address: 'Tashkent, Amir Temur 5',
        },
        {
          id: 'demo-2',
          items: [],
          total: 92000,
          status: 'preparing',
          date: '2025-03-18T10:00:00',
          deliveryType: 'pickup',
        },
      ],
      addOrder: (order) =>
        set((state) => ({
          orders: [
            {
              ...order,
              id: `order-${Date.now()}`,
              date: new Date().toISOString(),
              status: 'new',
            },
            ...state.orders,
          ],
        })),
    }),
    { name: '77ck-orders' }
  )
);
