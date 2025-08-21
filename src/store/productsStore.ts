import { create } from 'zustand'
import type { Product } from '../types'
import { productService } from '../services/productService'

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
  getLowStockProducts: () => Product[]
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
      set(state => ({ products: [...state.products, product], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateProduct: async (id, productData) => {
    set({ loading: true, error: null })
    try {
      const product = await productService.update(id, productData)
      set(state => ({ products: state.products.map(p => p.id === id ? product : p), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await productService.delete(id)
      set(state => ({ products: state.products.filter(p => p.id !== id), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getProduct: (id) => get().products.find(p => p.id === id),
  searchProducts: async (query) => {
    try {
      return await productService.search(query)
    } catch (error) {
      console.error('Error al buscar productos:', error)
      return []
    }
  },
  getLowStockProducts: () => {
    return []
  }
}))
