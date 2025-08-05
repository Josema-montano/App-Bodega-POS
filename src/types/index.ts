// Tipos de usuario y autenticación
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'employee';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// Tipos de productos e inventario
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  cost: number;
  category: string;
  brand?: string | null;
  sku: string;
  barcode?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de clientes
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currentDebt: number;
  creditLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de proveedores
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de ventas
export interface Sale {
  id: string;
  customerId?: string;
  customer?: Customer;
  userId: string;
  user: User;
  items: SaleItem[];
  totalAmount: number; // Cambiado de 'total' a 'totalAmount' para coincidir con 'total_amount' en DB
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number; // Coincide con 'unit_price' en DB
  total: number; // Coincide con 'total' en DB
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit' | 'check';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';



// Tipos financieros
export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  paymentMethod?: PaymentMethod;
  userId: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'sales' | 'purchases' | 'fixed_costs' | 'variable_costs' | 'other';



// Tipos de notificaciones
export interface Notification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
}

export type NotificationPriority = 'low' | 'medium' | 'high';

// Tipos de reportes
export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: ProductSalesData[];
  salesByDay: DailySalesData[];
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface DailySalesData {
  date: string;
  sales: number;
  revenue: number;
}

export interface FinancialReport {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: CategoryData[];
  expensesByCategory: CategoryData[];
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

// Tipos de formularios
export interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  brand?: string;
  sku: string;
  price: number;
  cost: number;
  barcode?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
}

export interface SupplierFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SaleFormData {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  paymentMethod?: PaymentMethod;
}

// Tipos de estado global
export interface AppState {
  notifications: Notification[];
  transactions: Transaction[];
  settings: AppConfig;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  markAsRead: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<AppConfig>) => void;
}

// Tipos de configuración
export interface AppConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number;
  currency: string;
  lowStockThreshold: number;
  orderDueDays: number;
  timezone: string;
  language: string;
}