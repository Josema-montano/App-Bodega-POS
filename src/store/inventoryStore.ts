import { create } from 'zustand'
import type { InventoryItem } from '../types'
import { inventoryService } from '../services/inventoryService'

interface InventoryState {
  inventory: InventoryItem[]
  loading: boolean
  error: string | null
  fetchInventory: () => Promise<void>
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) => Promise<void>
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>
  deleteInventoryItem: (id: string) => Promise<void>
  getInventoryItem: (id: string) => InventoryItem | undefined
  getInventoryByProductId: (productId: string) => InventoryItem | undefined
  updateStock: (productId: string, quantity: number) => Promise<void>
  getLowStockItems: () => Promise<InventoryItem[]>
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  inventory: [],
  loading: false,
  error: null,
  fetchInventory: async () => {
    set({ loading: true, error: null })
    try {
      const inventory = await inventoryService.getAll()
      set({ inventory, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addInventoryItem: async (itemData) => {
    set({ loading: true, error: null })
    try {
      const item = await inventoryService.create(itemData)
      set(state => ({ inventory: [...state.inventory, item], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateInventoryItem: async (id, itemData) => {
    set({ loading: true, error: null })
    try {
      const item = await inventoryService.update(id, itemData)
      set(state => ({ inventory: state.inventory.map(i => i.id === id ? item : i), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteInventoryItem: async (id) => {
    set({ loading: true, error: null })
    try {
      await inventoryService.delete(id)
      set(state => ({ inventory: state.inventory.filter(i => i.id !== id), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getInventoryItem: (id) => get().inventory.find(i => i.id === id),
  getInventoryByProductId: (productId) => get().inventory.find(i => i.productId === productId),
  updateStock: async (productId, quantity) => {
    set({ loading: true, error: null })
    try {
      await inventoryService.updateStock(productId, quantity)
      set(state => ({
        inventory: state.inventory.map(i => i.productId === productId ? { ...i, quantity } : i),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getLowStockItems: async () => {
    try {
      return await inventoryService.getLowStock()
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error)
      return []
    }
  }
}))
