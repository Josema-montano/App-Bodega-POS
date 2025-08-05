import { supabase, handleSupabaseError } from '../lib/supabase'
import type { InventoryItem } from '../types'
import { useAppStore } from '../store'

export const inventoryService = {
  // Obtener todos los registros de inventario con información del producto
  async getAll(): Promise<(InventoryItem & { product: { name: string; sku: string; category: string } })[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            name,
            sku,
            category,
            is_active
          )
        `)
        .eq('products.is_active', true)
        .order('last_updated', { ascending: false })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        minStock: item.min_stock,
        maxStock: item.max_stock,
        location: item.location,
        lastUpdated: new Date(item.last_updated),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        product: {
          name: item.products.name,
          sku: item.products.sku,
          category: item.products.category
        }
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener inventario por ID de producto
  async getByProductId(productId: string): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        productId: data.product_id,
        quantity: data.quantity,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear registro de inventario para un producto
  async create(inventoryData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          product_id: inventoryData.productId,
          quantity: inventoryData.quantity,
          min_stock: inventoryData.minStock || 0,
          max_stock: inventoryData.maxStock,
          location: inventoryData.location
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        productId: data.product_id,
        quantity: data.quantity,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar registro de inventario completo
  async update(id: string, inventoryData: Partial<Omit<InventoryItem, 'id' | 'productId' | 'lastUpdated' | 'createdAt' | 'updatedAt'>>): Promise<InventoryItem> {
    try {
      const updateData: any = {
        last_updated: new Date().toISOString()
      }
      
      if (inventoryData.quantity !== undefined) updateData.quantity = inventoryData.quantity
      if (inventoryData.minStock !== undefined) updateData.min_stock = inventoryData.minStock
      if (inventoryData.maxStock !== undefined) updateData.max_stock = inventoryData.maxStock
      if (inventoryData.location !== undefined) updateData.location = inventoryData.location

      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        productId: data.product_id,
        quantity: data.quantity,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar solo la cantidad de stock (para ventas/compras)
  async updateStock(productId: string, quantityChange: number): Promise<InventoryItem | null> {
    try {
      // Primero obtenemos el inventario actual
      const currentInventory = await this.getByProductId(productId)
      if (!currentInventory) {
        throw new Error(`No se encontró inventario para el producto ${productId}`)
      }

      const newQuantity = currentInventory.quantity + quantityChange
      if (newQuantity < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${currentInventory.quantity}, cantidad solicitada: ${Math.abs(quantityChange)}`)
      }

      const { data, error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        productId: data.product_id,
        quantity: data.quantity,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Obtener productos con stock bajo
  async getLowStock(): Promise<(InventoryItem & { product: { name: string; sku: string; category: string } })[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            name,
            sku,
            category,
            is_active
          )
        `)
        .eq('products.is_active', true)
        .filter('quantity', 'lte', 'min_stock')
        .order('quantity', { ascending: true })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        minStock: item.min_stock,
        maxStock: item.max_stock,
        location: item.location,
        lastUpdated: new Date(item.last_updated),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        product: {
          name: item.products.name,
          sku: item.products.sku,
          category: item.products.category
        }
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Eliminar registro de inventario
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Verificar stock bajo y generar notificaciones
  async checkLowStock(): Promise<void> {
    try {
      const { data: lowStockItems, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            name,
            sku,
            category,
            is_active
          )
        `)
        .eq('products.is_active', true)
        .filter('quantity', 'lte', 'min_stock')
        .gt('quantity', 0)

      if (error) throw error

      const { addNotification } = useAppStore.getState();
      
      lowStockItems?.forEach(item => {
         addNotification({
           type: 'warning',
           title: 'Stock Bajo',
           message: `El producto "${item.products.name}" tiene solo ${item.quantity} unidades disponibles.`,
           priority: 'high',
           read: false
         });
       });

      // Verificar productos agotados
      const { data: outOfStockItems, error: outError } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            name,
            sku,
            category,
            is_active
          )
        `)
        .eq('products.is_active', true)
        .eq('quantity', 0)

      if (outError) throw outError

      outOfStockItems?.forEach(item => {
         addNotification({
           type: 'error',
           title: 'Producto Agotado',
           message: `El producto "${item.products.name}" está completamente agotado.`,
           priority: 'high',
           read: false
         });
       });

    } catch (error) {
      handleSupabaseError(error)
    }
  }
}