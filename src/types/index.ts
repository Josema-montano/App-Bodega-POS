// Tipos de usuario y autenticación
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  position?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'worker' | 'distributor';

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
  description: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 'wine' | 'supplies' | 'equipment' | 'packaging';

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  location: string;
  lastUpdated: Date;
}

// Tipos de clientes
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type: CustomerType;
  taxId?: string;
  creditLimit: number;
  currentDebt: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerType = 'individual' | 'business';

// Tipos de proveedores
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  contactPerson?: string;
  contactName?: string;
  website?: string;
  category?: string;
  paymentTerms: number;
  currentDebt: number;
  notes?: string;
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
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  invoiceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Tipos de pedidos
export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  userId: string;
  user: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  deliveryDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';

// Tipos financieros
export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  reference?: string;
  paymentMethod: string;
  notes?: string;
  userId: string;
  user: User;
  relatedId?: string; // ID de venta, compra, etc.
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'sales' | 'purchases' | 'fixed_costs' | 'variable_costs' | 'other';

// Tipos de cuentas por cobrar/pagar
export interface AccountReceivable {
  id: string;
  customerId: string;
  customer: Customer;
  amount: number;
  dueDate: Date;
  status: DebtStatus;
  description: string;
  saleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountPayable {
  id: string;
  supplierId: string;
  supplier: Supplier;
  amount: number;
  dueDate: Date;
  status: DebtStatus;
  description: string;
  purchaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue';

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  userId?: string;
  relatedId?: string;
  data?: any;
  createdAt: Date;
}

export type NotificationType = 'low_stock' | 'order_due' | 'payment_due' | 'system' | 'alert' | 'success' | 'info' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

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
  description: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type: CustomerType;
  taxId?: string;
  creditLimit: number;
  notes?: string;
}

export interface SupplierFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  contactPerson?: string;
  contactName?: string;
  website?: string;
  category?: string;
  paymentTerms: number;
  notes?: string;
}

export interface SaleFormData {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  discount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
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