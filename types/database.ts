
export type Role = 'user' | 'admin';
export type OrderStatus = 'Placed' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
export type FeedbackType = 'Feedback' | 'Complaint';

export interface Profile {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: Role;
  is_banned: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  pincode: string;
  state: string;
  is_default: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  category: string;
  specs: Record<string, string>;
  images: string[];
  rating: number;
  stock_quantity: number;
  created_at: string;
  delivery_charge?: number;
  delivery_days?: number;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profile?: {
    name: string;
  };
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at?: string;
  product?: Product;
}

export interface OrderItemSummary {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  address: Address;
  items_summary: OrderItemSummary[];
  created_at: string;
  order_items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
}

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  message: string;
  status: 'Pending' | 'Resolved';
  created_at: string;
  profile?: Profile;
}
