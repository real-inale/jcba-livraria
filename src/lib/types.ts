export type AppRole = 'client' | 'seller' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type OrderStatus = 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'multicaixa_express' | 'atm_reference' | 'paypay' | 'visa';
export type BookType = 'physical' | 'digital' | 'both';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  terms_accepted: boolean;
  terms_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  status: SellerStatus;
  commission_rate: number;
  terms_accepted: boolean;
  terms_accepted_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Book {
  id: string;
  seller_id: string;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  price: number;
  original_price?: number;
  book_type: BookType;
  stock: number;
  category_id?: string;
  cover_image_url?: string;
  digital_file_url?: string;
  pages?: number;
  publisher?: string;
  published_year?: number;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: SellerProfile;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  platform_commission: number;
  total: number;
  shipping_address?: string;
  payment_proof_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id?: string;
  seller_id?: string;
  quantity: number;
  unit_price: number;
  commission_amount: number;
  created_at: string;
  book?: Book;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  created_at: string;
  book?: Book;
}

export interface PaymentSetting {
  id: string;
  method: PaymentMethod;
  is_active: boolean;
  account_holder?: string;
  account_number?: string;
  entity_code?: string;
  additional_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface DigitalPurchase {
  id: string;
  user_id: string;
  book_id: string;
  order_id?: string;
  download_count: number;
  created_at: string;
  book?: Book;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  multicaixa_express: 'Multicaixa Express',
  atm_reference: 'Pagamento por Referência (ATM)',
  paypay: 'PayPay',
  visa: 'Cartão Visa',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  awaiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Em Processamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const SELLER_STATUS_LABELS: Record<SellerStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  suspended: 'Suspenso',
  rejected: 'Rejeitado',
};

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  physical: 'Físico',
  digital: 'Digital',
  both: 'Físico e Digital',
};
