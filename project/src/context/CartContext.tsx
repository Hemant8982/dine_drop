import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import api from '../lib/api';
import type { CartItem } from '../lib/types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (menuItemId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('dinedrop_token');
    if (!token) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (menuItemId: number, quantity = 1) => {
    try {
      await api.post('/cart/add', { menuItemId, quantity });
      toast.success('Added to cart');
      await fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await api.put('/cart/update', { cartItemId, quantity });
      await fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      toast.success('Item removed');
      await fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setItems([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear cart');
    }
  };

  const total = items.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
