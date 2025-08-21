import { create } from 'zustand'
import type { Supplier } from '../types'
import { supplierService } from '../services/supplierService'

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
      set(state => ({ suppliers: [...state.suppliers, supplier], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateSupplier: async (id, supplierData) => {
    set({ loading: true, error: null })
    try {
      const supplier = await supplierService.update(id, supplierData)
      set(state => ({ suppliers: state.suppliers.map(s => s.id === id ? supplier : s), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteSupplier: async (id) => {
    set({ loading: true, error: null })
    try {
      await supplierService.delete(id)
      set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getSupplier: (id) => get().suppliers.find(s => s.id === id),
  searchSuppliers: async (query) => {
    try {
      return await supplierService.search(query)
    } catch (error) {
      console.error('Error al buscar proveedores:', error)
      return []
    }
  }
}))
