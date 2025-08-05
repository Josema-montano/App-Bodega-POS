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
        brand: item.brand,
        sku: item.sku,
        price: item.price,
        cost: item.cost,
        barcode: item.barcode,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener todos los productos con información de inventario
  async getAllWithInventory(): Promise<(Product & { inventory?: { quantity: number; minStock: number; maxStock?: number; location?: string } })[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory(
            quantity,
            min_stock,
            max_stock,
            location
          )
        `)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        brand: item.brand,
        sku: item.sku,
        price: item.price,
        cost: item.cost,
        barcode: item.barcode,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        inventory: item.inventory?.[0] ? {
          quantity: item.inventory[0].quantity,
          minStock: item.inventory[0].min_stock,
          maxStock: item.inventory[0].max_stock,
          location: item.inventory[0].location
        } : undefined
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
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        brand: data.brand,
        sku: data.sku,
        price: data.price,
        cost: data.cost,
        barcode: data.barcode,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
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
          brand: product.brand,
          sku: product.sku,
          barcode: product.barcode,
          is_active: product.isActive ?? true
        })
        .select()
        .single()
      
      if (error) throw error

      // El inventario debe crearse por separado usando el servicio de inventario

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        brand: data.brand,
        sku: data.sku,
        price: data.price,
        cost: data.cost,
        barcode: data.barcode,
        isActive: data.is_active,
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
      if (product.brand !== undefined) updateData.brand = product.brand
      if (product.sku !== undefined) updateData.sku = product.sku
      if (product.barcode !== undefined) updateData.barcode = product.barcode
      if (product.isActive !== undefined) updateData.is_active = product.isActive

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      // La actualización de inventario debe manejarse por separado
      // usando el servicio de inventario correspondiente

      // Obtener el producto actualizado con información de inventario
      return await this.getById(id) as Product
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
        brand: item.brand,
        sku: item.sku,
        price: item.price,
        cost: item.cost,
        barcode: item.barcode,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  }
}