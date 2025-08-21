import { create } from 'zustand'
import type { Customer } from '../types'
import { customerService } from '../services/customerService'

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
      set(state => ({ customers: [...state.customers, customer], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateCustomer: async (id, customerData) => {
    set({ loading: true, error: null })
    try {
      const customer = await customerService.update(id, customerData)
      set(state => ({ customers: state.customers.map(c => c.id === id ? customer : c), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteCustomer: async (id) => {
    set({ loading: true, error: null })
    try {
      await customerService.delete(id)
      set(state => ({ customers: state.customers.filter(c => c.id !== id), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getCustomer: (id) => get().customers.find(c => c.id === id),
  searchCustomers: async (query) => {
    try {
      return await customerService.search(query)
    } catch (error) {
      console.error('Error al buscar clientes:', error)
      return []
    }
  }
}))
