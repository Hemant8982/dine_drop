export interface User {
  id: number;
  auth_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  category?: Category;
}

export interface CartItem {
  id: number;
  user_id: number;
  menu_item_id: number;
  quantity: number;
  menu_item: MenuItem;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price_at_time: number;
  menu_item: MenuItem;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'PENDING' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  estimated_delivery_minutes: number;
  order_date: string;
  delivery_address: string | null;
  order_type: 'DINE_IN' | 'HOME_DELIVERY';
  table_number: string | null;
  order_items?: OrderItem[];
  user?: { name: string; email: string; phone: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
