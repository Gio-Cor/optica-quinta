export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  stock?: number;
  category?: 'lente' | 'accesorio';
  ar_image?: string;
  model_3d?: string;
  is_featured?: boolean;
  discount_percent?: number;
  ar_scale?: number;
  ar_offset_x?: number;
  ar_offset_y?: number;
  ar_offset_z?: number;
}

export interface Appointment {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  address?: string;
  payment_method?: string;
}

export interface LensOption {
  id: number;
  name: string;
  price_add: number;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lensOption: LensOption;
}

export interface WorkOrder {
  id: number;
  user_id?: number;
  prescription_id?: number;
  total_amount: number;
  deposit_amount: number;
  balance_due: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  user_name?: string;
}

