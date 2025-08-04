import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Product } from '../types'

export const productService = {
  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        cost: item.cost,
        stock: 0, // TODO: obtener del inventario
        minStock: 0, // TODO: obtener del inventario
        unit: 'unit',
        barcode: item.barcode,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener producto por ID
  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo producto
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          category: product.category,
          barcode: product.barcode
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        cost: data.cost,
        stock: 0, // TODO: obtener del inventario
        minStock: 0, // TODO: obtener del inventario
        unit: 'unit',
        barcode: data.barcode,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar producto
  async update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    try {
      const updateData: any = {}
      if (product.name !== undefined) updateData.name = product.name
      if (product.description !== undefined) updateData.description = product.description
      if (product.price !== undefined) updateData.price = product.price
      if (product.cost !== undefined) updateData.cost = product.cost
      if (product.category !== undefined) updateData.category = product.category
      if (product.barcode !== undefined) updateData.barcode = product.barcode

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        cost: data.cost,
        category: data.category,
        brand: data.brand,
        sku: data.sku,
        barcode: data.barcode,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Eliminar producto (soft delete)
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar productos por nombre o SKU
  async search(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        cost: item.cost,
        stock: 0, // TODO: obtener del inventario
        minStock: 0, // TODO: obtener del inventario
        unit: 'unit',
        barcode: item.barcode,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  }
}