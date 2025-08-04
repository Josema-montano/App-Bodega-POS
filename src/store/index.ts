import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
} from '../types'
import { supabase } from '../lib/supabase'
import { productService } from '../services/productService'
import { customerService } from '../services/customerService'
import { supplierService } from '../services/supplierService'
import { saleService } from '../services/saleService'

// Auth Store con Supabase
export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        if (data.user) {
          // Obtener información adicional del usuario desde la tabla users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()
          
          if (userError) {
            // Si no existe el usuario en la tabla, crear uno básico
            const newUser: User = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || 'Usuario',
              role: 'worker' as UserRole,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            set({ user: newUser, isAuthenticated: true })
          } else {
            const user: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              isActive: userData.is_active,
              createdAt: new Date(userData.created_at),
              updatedAt: new Date(userData.updated_at)
            }
            set({ user, isAuthenticated: true })
          }
        }
      } catch (error: any) {
        throw new Error(error.message || 'Error al iniciar sesión')
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
        set({ user: null, isAuthenticated: false })
      }
    },
    register: async (userData) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password || 'defaultPassword123',
          options: {
            data: {
              name: userData.name
            }
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          // Crear usuario en la tabla users
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              role: userData.role || 'worker' as UserRole,
              is_active: true
            })
          
          if (insertError) throw insertError
          
          const user: User = {
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'employee',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          set({ user, isAuthenticated: true })
        }
      } catch (error: any) {
        throw new Error(error.message || 'Error al registrar usuario')
      }
    },
    updateProfile: async (userData) => {
      const currentUser = get().user
      if (!currentUser) return
      
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: userData.name,
            role: userData.role
          })
          .eq('id', currentUser.id)
        
        if (error) throw error
        
        set(state => ({
          user: state.user ? { 
            ...state.user, 
            ...userData, 
            updatedAt: new Date()
          } : null
        }))
      } catch (error) {
        console.error('Error al actualizar perfil:', error)
        throw error
      }
    }
  }),
  {
    name: 'auth-storage'
  }
))

// App Store para notificaciones y configuración
export const useAppStore = create<AppState>()((set, get) => ({
  notifications: [],
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
    }
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }))
  },
  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },
  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },
  markAllNotificationsAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }))
  },
  deleteNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  clearNotifications: () => {
    set({ notifications: [] })
  },
  clearAllNotifications: () => {
    set({ notifications: [] })
  },
  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }))
  },
  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    set(state => ({
      transactions: [...state.transactions, newTransaction]
    }))
  }
}))

// Products Store con Supabase
interface ProductsState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProduct: (id: string) => Product | undefined
  searchProducts: (query: string) => Promise<Product[]>
}

export const useProductsStore = create<ProductsState>()((set, get) => ({
  products: [],
  loading: false,
  error: null,
  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const products = await productService.getAll()
      set({ products, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      const product = await productService.create(productData)
      set(state => ({ 
        products: [...state.products, product], 
        loading: false 
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateProduct: async (id, productData) => {
    set({ loading: true, error: null })
    try {
      const product = await productService.update(id, productData)
      set(state => ({
        products: state.products.map(p => p.id === id ? product : p),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await productService.delete(id)
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getProduct: (id) => {
    return get().products.find(p => p.id === id)
  },
  searchProducts: async (query) => {
    try {
      return await productService.search(query)
    } catch (error) {
      console.error('Error al buscar productos:', error)
      return []
    }
  }
}))

// Customers Store con Supabase
interface CustomersState {
  customers: Customer[]
  loading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  getCustomer: (id: string) => Customer | undefined
  searchCustomers: (query: string) => Promise<Customer[]>
}

export const useCustomersStore = create<CustomersState>()((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  fetchCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const customers = await customerService.getAll()
      set({ customers, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addCustomer: async (customerData) => {
    set({ loading: true, error: null })
    try {
      const customer = await customerService.create(customerData)
      set(state => ({ 
        customers: [...state.customers, customer], 
        loading: false 
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateCustomer: async (id, customerData) => {
    set({ loading: true, error: null })
    try {
      const customer = await customerService.update(id, customerData)
      set(state => ({
        customers: state.customers.map(c => c.id === id ? customer : c),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteCustomer: async (id) => {
    set({ loading: true, error: null })
    try {
      await customerService.delete(id)
      set(state => ({
        customers: state.customers.filter(c => c.id !== id),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getCustomer: (id) => {
    return get().customers.find(c => c.id === id)
  },
  searchCustomers: async (query) => {
    try {
      return await customerService.search(query)
    } catch (error) {
      console.error('Error al buscar clientes:', error)
      return []
    }
  }
}))

// Suppliers Store con Supabase
interface SuppliersState {
  suppliers: Supplier[]
  loading: boolean
  error: string | null
  fetchSuppliers: () => Promise<void>
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  getSupplier: (id: string) => Supplier | undefined
  searchSuppliers: (query: string) => Promise<Supplier[]>
}

export const useSuppliersStore = create<SuppliersState>()((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,
  fetchSuppliers: async () => {
    set({ loading: true, error: null })
    try {
      const suppliers = await supplierService.getAll()
      set({ suppliers, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addSupplier: async (supplierData) => {
    set({ loading: true, error: null })
    try {
      const supplier = await supplierService.create(supplierData)
      set(state => ({ 
        suppliers: [...state.suppliers, supplier], 
        loading: false 
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateSupplier: async (id, supplierData) => {
    set({ loading: true, error: null })
    try {
      const supplier = await supplierService.update(id, supplierData)
      set(state => ({
        suppliers: state.suppliers.map(s => s.id === id ? supplier : s),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteSupplier: async (id) => {
    set({ loading: true, error: null })
    try {
      await supplierService.delete(id)
      set(state => ({
        suppliers: state.suppliers.filter(s => s.id !== id),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getSupplier: (id) => {
    return get().suppliers.find(s => s.id === id)
  },
  searchSuppliers: async (query) => {
    try {
      return await supplierService.search(query)
    } catch (error) {
      console.error('Error al buscar proveedores:', error)
      return []
    }
  }
}))

// Sales Store con Supabase
interface SalesState {
  sales: Sale[]
  loading: boolean
  error: string | null
  fetchSales: () => Promise<void>
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>
  getSale: (id: string) => Sale | undefined
  getSalesByDateRange: (startDate: string, endDate: string) => Promise<Sale[]>
  cancelSale: (id: string) => Promise<void>
}

export const useSalesStore = create<SalesState>()((set, get) => ({
  sales: [],
  loading: false,
  error: null,
  fetchSales: async () => {
    set({ loading: true, error: null })
    try {
      const sales = await saleService.getAll()
      set({ sales, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addSale: async (saleData) => {
    set({ loading: true, error: null })
    try {
      const sale = await saleService.create(saleData)
      set(state => ({ 
        sales: [...state.sales, sale], 
        loading: false 
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateSale: async (id, saleData) => {
    set({ loading: true, error: null })
    try {
      const sale = await saleService.update(id, saleData)
      set(state => ({
        sales: state.sales.map(s => s.id === id ? sale : s),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getSale: (id) => {
    return get().sales.find(s => s.id === id)
  },
  getSalesByDateRange: async (startDate, endDate) => {
    try {
      return await saleService.getByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error al obtener ventas por rango de fechas:', error)
      return []
    }
  },
  cancelSale: async (id) => {
    set({ loading: true, error: null })
    try {
      await saleService.cancel(id)
      set(state => ({
        sales: state.sales.map(s => 
          s.id === id ? { ...s, status: 'cancelled' } : s
        ),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))