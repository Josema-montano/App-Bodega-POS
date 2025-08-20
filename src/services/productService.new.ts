import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Product } from '../types'

export const productService = {
  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        description: item.descripcion,
        category: item.categoria,
        brand: item.marca,
        sku: item.sku,
        price: item.precio,
        cost: item.costo,
        barcode: item.codigo_barras,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
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
        .from('productos')
        .select(`
          *,
          inventario(
            cantidad,
            stock_minimo,
            stock_maximo,
            ubicacion
          )
        `)
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        description: item.descripcion,
        category: item.categoria,
        brand: item.marca,
        sku: item.sku,
        price: item.precio,
        cost: item.costo,
        barcode: item.codigo_barras,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en),
        inventory: item.inventario?.[0] ? {
          quantity: item.inventario[0].cantidad,
          minStock: item.inventario[0].stock_minimo,
          maxStock: item.inventario[0].stock_maximo,
          location: item.inventario[0].ubicacion
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
        .from('productos')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        description: data.descripcion,
        category: data.categoria,
        brand: data.marca,
        sku: data.sku,
        price: data.precio,
        cost: data.costo,
        barcode: data.codigo_barras,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo producto
  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: productData.name,
          descripcion: productData.description,
          precio: productData.price,
          costo: productData.cost,
          categoria: productData.category,
          marca: productData.brand,
          sku: productData.sku,
          codigo_barras: productData.barcode,
          activo: productData.isActive
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        description: data.descripcion,
        category: data.categoria,
        brand: data.marca,
        sku: data.sku,
        price: data.precio,
        cost: data.costo,
        barcode: data.codigo_barras,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar producto
  async update(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    try {
      const updateData: any = {}
      if (productData.name !== undefined) updateData.nombre = productData.name
      if (productData.description !== undefined) updateData.descripcion = productData.description
      if (productData.price !== undefined) updateData.precio = productData.price
      if (productData.cost !== undefined) updateData.costo = productData.cost
      if (productData.category !== undefined) updateData.categoria = productData.category
      if (productData.brand !== undefined) updateData.marca = productData.brand
      if (productData.sku !== undefined) updateData.sku = productData.sku
      if (productData.barcode !== undefined) updateData.codigo_barras = productData.barcode
      if (productData.isActive !== undefined) updateData.activo = productData.isActive
      
      const { data, error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        description: data.descripcion,
        category: data.categoria,
        brand: data.marca,
        sku: data.sku,
        price: data.precio,
        cost: data.costo,
        barcode: data.codigo_barras,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
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
        .from('productos')
        .update({ activo: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar productos por término
  async search(term: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .or(`nombre.ilike.%${term}%,sku.ilike.%${term}%,codigo_barras.ilike.%${term}%`)
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        description: item.descripcion,
        category: item.categoria,
        brand: item.marca,
        sku: item.sku,
        price: item.precio,
        cost: item.costo,
        barcode: item.codigo_barras,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener productos por categoría
  async getByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('categoria', category)
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        description: item.descripcion,
        category: item.categoria,
        brand: item.marca,
        sku: item.sku,
        price: item.precio,
        cost: item.costo,
        barcode: item.codigo_barras,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  }
}
