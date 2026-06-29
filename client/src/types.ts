export type ProductType = 'moto' | 'pieza' | 'otros';

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stock: number;
  features: string[];
  // Optional computed or cached values for rating and reviews
  rating?: number;
  reviewsCount?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userEmail: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'pendiente' | 'pagado' | 'enviado' | 'cancelado';

export interface Order {
  id: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cliente';
  createdAt: string;
  active: boolean;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  details?: string;
  // PayPal settings
  email?: string;
  clientId?: string;
  sandboxMode?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  schedule: string;
  image: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  paymentsEnabled: boolean;
  paymentMethods: PaymentMethodConfig[];
  contactPhone?: string;
  contactEmail?: string;
  shopAddress?: string;
  shopHours?: string;
  reservationsEnabled?: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  facebookPageId?: string;
  facebookPageAccessToken?: string;
  facebookPageName?: string;
  shopImage?: string;
}

export interface DatabaseState {
  products: Product[];
  orders: Order[];
  users: User[];
  settings: SystemSettings;
}

