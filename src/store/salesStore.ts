import { create } from 'zustand'
import type { Sale } from '../types'
import { saleService } from '../services/saleService'

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
  getTodaySales: () => Sale[]
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
      set(state => ({ sales: [...state.sales, sale], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateSale: async (id, saleData) => {
    set({ loading: true, error: null })
    try {
      const sale = await saleService.update(id, saleData)
      set(state => ({ sales: state.sales.map(s => s.id === id ? sale : s), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getSale: (id) => get().sales.find(s => s.id === id),
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
        sales: state.sales.map(s => s.id === id ? { ...s, status: 'cancelled' } : s),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getTodaySales: () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    return get().sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= startOfDay && saleDate < endOfDay
    })
  }
}))
