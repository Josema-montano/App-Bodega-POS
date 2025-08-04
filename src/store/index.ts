import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, 
  UserRole, 
  AuthState, 
  Notification, 
  AppState,
  Product,
  Customer,
  Supplier,
  Sale,
  Order,
  Transaction,
  AccountReceivable,
  AccountPayable
} from '../types';

// Mock data para desarrollo
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Vino Tinto Reserva',
    description: 'Vino tinto de alta calidad',
    category: 'wine',
    price: 25.00,
    cost: 15.00,
    stock: 50,
    minStock: 10,
    unit: 'botella',
    barcode: '123456789',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Corchos Naturales',
    description: 'Corchos de corcho natural',
    category: 'supplies',
    price: 0.50,
    cost: 0.30,
    stock: 1000,
    minStock: 200,
    unit: 'unidad',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Etiquetas Premium',
    description: 'Etiquetas para vinos premium',
    category: 'packaging',
    price: 0.75,
    cost: 0.45,
    stock: 500,
    minStock: 100,
    unit: 'unidad',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@email.com',
    phone: '+1234567890',
    address: 'Calle Principal 123',
    city: 'Ciudad',
    type: 'individual',
    creditLimit: 1000,
    currentDebt: 250,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@email.com',
    phone: '+1234567891',
    address: 'Avenida Central 456',
    city: 'Ciudad',
    type: 'business',
    creditLimit: 1500,
    currentDebt: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Proveedora de Corchos SA',
    email: 'ventas@corchos.com',
    phone: '+1234567892',
    address: 'Industrial 789',
    city: 'Ciudad Industrial',
    contactPerson: 'Carlos López',
    paymentTerms: 30,
    currentDebt: 500,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Auth Store
export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    login: async (email: string, password: string) => {
      // Simulación de login
      if (email === 'admin@bodega.com' && password === 'admin123') {
        const user: User = {
          id: '1',
          email,
          name: 'Administrador',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ user, isAuthenticated: true });
      } else if (email === 'worker@bodega.com' && password === 'worker123') {
        const user: User = {
          id: '2',
          email,
          name: 'Trabajador',
          role: 'worker',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ user, isAuthenticated: true });
      } else if (email === 'distributor@bodega.com' && password === 'dist123') {
        const user: User = {
          id: '3',
          email,
          name: 'Distribuidor',
          role: 'distributor',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ user, isAuthenticated: true });
      } else {
        throw new Error('Credenciales inválidas');
      }
    },
    logout: () => {
      set({ user: null, isAuthenticated: false });
    },
    register: async (userData) => {
      // Simulación de registro
      const user: User = {
        id: Date.now().toString(),
        ...userData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set({ user, isAuthenticated: true });
    },
    updateProfile: (userData) => {
      set(state => ({
        user: state.user ? { ...state.user, ...userData, updatedAt: new Date() } : null
      }));
    }
  }),
  {
    name: 'auth-storage'
  }
));

// App Store para notificaciones
export const useAppStore = create<AppState>()((set, get) => ({
  notifications: [
    {
      id: '1',
      type: 'low_stock',
      title: 'Stock Bajo',
      message: 'El producto "Corchos Naturales" tiene stock bajo',
      priority: 'high',
      read: false,
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'order_due',
      title: 'Pedido Próximo a Vencer',
      message: 'El pedido #001 vence mañana',
      priority: 'medium',
      read: false,
      createdAt: new Date()
    }
  ],
  transactions: [],
  settings: {
    companyName: 'Bodega Premium',
    companyAddress: 'Calle Principal 123',
    companyPhone: '+1234567890',
    companyEmail: 'info@bodegapremium.com',
    taxRate: 0.16,
    currency: 'MXN',
    lowStockThreshold: 10,
    orderDueDays: 7,
    timezone: 'America/Mexico_City',
    language: 'es'
  },
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }));
  },
  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },
  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },
  markAllNotificationsAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },
  deleteNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
  clearAllNotifications: () => {
    set({ notifications: [] });
  },
  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },
  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    set(state => ({
      transactions: [...state.transactions, newTransaction]
    }));
  }
}));

// Products Store
interface ProductsState {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[];
}

export const useProductsStore = create<ProductsState>()(persist(
  (set, get) => ({
    products: mockProducts,
    addProduct: (productData) => {
      const product: Product = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set(state => ({ products: [...state.products, product] }));
    },
    updateProduct: (id, productData) => {
      set(state => ({
        products: state.products.map(p => 
          p.id === id ? { ...p, ...productData, updatedAt: new Date() } : p
        )
      }));
    },
    deleteProduct: (id) => {
      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    },
    getProduct: (id) => {
      return get().products.find(p => p.id === id);
    },
    getLowStockProducts: () => {
      return get().products.filter(p => p.stock <= p.minStock);
    }
  }),
  {
    name: 'products-storage'
  }
));

// Customers Store
interface CustomersState {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
}

export const useCustomersStore = create<CustomersState>()(persist(
  (set, get) => ({
    customers: mockCustomers,
    addCustomer: (customerData) => {
      const customer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set(state => ({ customers: [...state.customers, customer] }));
    },
    updateCustomer: (id, customerData) => {
      set(state => ({
        customers: state.customers.map(c => 
          c.id === id ? { ...c, ...customerData, updatedAt: new Date() } : c
        )
      }));
    },
    deleteCustomer: (id) => {
      set(state => ({
        customers: state.customers.filter(c => c.id !== id)
      }));
    },
    getCustomer: (id) => {
      return get().customers.find(c => c.id === id);
    }
  }),
  {
    name: 'customers-storage'
  }
));

// Suppliers Store
interface SuppliersState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
}

export const useSuppliersStore = create<SuppliersState>()(persist(
  (set, get) => ({
    suppliers: mockSuppliers,
    addSupplier: (supplierData) => {
      const supplier: Supplier = {
        ...supplierData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set(state => ({ suppliers: [...state.suppliers, supplier] }));
    },
    updateSupplier: (id, supplierData) => {
      set(state => ({
        suppliers: state.suppliers.map(s => 
          s.id === id ? { ...s, ...supplierData, updatedAt: new Date() } : s
        )
      }));
    },
    deleteSupplier: (id) => {
      set(state => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      }));
    },
    getSupplier: (id) => {
      return get().suppliers.find(s => s.id === id);
    }
  }),
  {
    name: 'suppliers-storage'
  }
));

// Sales Store
interface SalesState {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  getSale: (id: string) => Sale | undefined;
  getSalesByPeriod: (startDate: Date, endDate: Date) => Sale[];
  getTodaySales: () => Sale[];
}

export const useSalesStore = create<SalesState>()(persist(
  (set, get) => ({
    sales: [],
    addSale: (saleData) => {
      const sale: Sale = {
        ...saleData,
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      set(state => ({ sales: [...state.sales, sale] }));
    },
    updateSale: (id, saleData) => {
      set(state => ({
        sales: state.sales.map(s => 
          s.id === id ? { ...s, ...saleData, updatedAt: new Date() } : s
        )
      }));
    },
    getSale: (id) => {
      return get().sales.find(s => s.id === id);
    },
    getSalesByPeriod: (startDate, endDate) => {
      return get().sales.filter(s => 
        s.createdAt >= startDate && s.createdAt <= endDate
      );
    },
    getTodaySales: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return get().sales.filter(s => 
        s.createdAt >= today && s.createdAt < tomorrow
      );
    }
  }),
  {
    name: 'sales-storage'
  }
));