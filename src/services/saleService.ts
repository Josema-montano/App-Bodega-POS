import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Sale, SaleItem } from '../types'

export const saleService = {
  // Obtener todas las ventas
  async getAll(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name),
          user:users(id, name),
          sale_items(
            id,
            product_id,
            quantity,
            unit_price,
            total,
            product:products(id, name, sku)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customer: item.customer,
        userId: item.user_id,
        user: item.user,
        items: item.sale_items?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.product_id,
          product: saleItem.product,
          quantity: saleItem.quantity,
          unitPrice: saleItem.unit_price,
          total: saleItem.total
        })) || [],
        totalAmount: item.total_amount,
        discount: item.discount,
        tax: item.tax,
        paymentMethod: item.payment_method,
        status: item.status,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener venta por ID
  async getById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name),
          user:users(id, name),
          sale_items(
            id,
            product_id,
            quantity,
            unit_price,
            total,
            product:products(id, name, sku)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        customerId: data.customer_id,
        customer: data.customer,
        userId: data.user_id,
        user: data.user,
        items: data.sale_items?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.product_id,
          product: saleItem.product,
          quantity: saleItem.quantity,
          unitPrice: saleItem.unit_price,
          total: saleItem.total
        })) || [],
        totalAmount: data.total_amount,
        discount: data.discount,
        tax: data.tax,
        paymentMethod: data.payment_method,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nueva venta
  async create(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
    try {
      // Iniciar transacción
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: sale.customerId,
          user_id: sale.userId,
          total_amount: sale.totalAmount,
          discount: sale.discount,
          tax: sale.tax,
          payment_method: sale.paymentMethod,
          status: sale.status,
          notes: sale.notes
        })
        .select()
        .single()
      
      if (saleError) throw saleError

      // Insertar items de la venta
      if (sale.items && sale.items.length > 0) {
        const saleItems = sale.items.map(item => ({
          sale_id: saleData.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        }))

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems)
        
        if (itemsError) throw itemsError
      }

      // Obtener la venta completa con relaciones
      return await this.getById(saleData.id) as Sale
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar venta
  async update(id: string, sale: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> {
    try {
      const updateData: any = {}
      if (sale.customerId !== undefined) updateData.customer_id = sale.customerId
      if (sale.userId !== undefined) updateData.user_id = sale.userId
      if (sale.totalAmount !== undefined) updateData.total_amount = sale.totalAmount
      if (sale.discount !== undefined) updateData.discount = sale.discount
      if (sale.tax !== undefined) updateData.tax = sale.tax
      if (sale.paymentMethod !== undefined) updateData.payment_method = sale.paymentMethod
      if (sale.status !== undefined) updateData.status = sale.status
      if (sale.notes !== undefined) updateData.notes = sale.notes

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id)
      
      if (error) throw error
      return await this.getById(id) as Sale
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Cancelar venta
  async cancel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'cancelled' })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Obtener ventas por rango de fechas
  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name),
          user:users(id, name),
          sale_items(
            id,
            product_id,
            quantity,
            unit_price,
            total,
            product:products(id, name, sku)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customer: item.customer,
        userId: item.user_id,
        user: item.user,
        items: item.sale_items?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.product_id,
          product: saleItem.product,
          quantity: saleItem.quantity,
          unitPrice: saleItem.unit_price,
          total: saleItem.total
        })) || [],
        totalAmount: item.total_amount,
        discount: item.discount,
        tax: item.tax,
        paymentMethod: item.payment_method,
        status: item.status,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  }
}