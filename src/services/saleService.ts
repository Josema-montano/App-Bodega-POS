import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Sale, SaleItem } from '../types'
import { inventoryService } from './inventoryService'
import { transactionService } from './transactionService'

export const saleService = {
  // Obtener todas las ventas
  async getAll(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          customer:clientes(id, nombre),
          user:usuarios(id, nombre),
          items_venta(
            id,
            producto_id,
            cantidad,
            precio_unitario,
            total,
            producto:productos(id, nombre, sku)
          )
        `)
  .order('creado_en', { ascending: false })
      
      if (error) throw error
      return (data?.map(item => ({
        id: item.id,
        customerId: item.cliente_id,
        customer: item.customer as any,
        userId: item.usuario_id,
        user: item.user as any,
        items: item.items_venta?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.producto_id,
          product: saleItem.producto as any,
          quantity: saleItem.cantidad,
          unitPrice: saleItem.precio_unitario,
          total: saleItem.total
        })) || [],
  totalAmount: item.monto_total,
        discount: item.descuento || 0,
        tax: item.impuesto || 0,
        paymentMethod: item.metodo_pago,
        status: item.estado,
        notes: item.notas,
  createdAt: new Date(item.creado_en),
  updatedAt: new Date(item.actualizado_en)
      })) || []) as Sale[]
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener venta por ID
  async getById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          customer:clientes(id, nombre),
          user:usuarios(id, nombre),
          items_venta(
            id,
            producto_id,
            cantidad,
            precio_unitario,
            total,
            producto:productos(id, nombre, sku)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        customerId: data.cliente_id,
        customer: data.customer as any,
        userId: data.usuario_id,
        user: data.user as any,
        items: data.items_venta?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.producto_id,
          product: saleItem.producto as any,
          quantity: saleItem.cantidad,
          unitPrice: saleItem.precio_unitario,
          total: saleItem.total
        })) || [],
  totalAmount: data.monto_total,
        discount: data.descuento || 0,
        tax: data.impuesto || 0,
        paymentMethod: data.metodo_pago,
        status: data.estado,
        notes: data.notas,
  createdAt: new Date(data.creado_en),
  updatedAt: new Date(data.actualizado_en)
      } as Sale
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
        .from('ventas')
        .insert({
          cliente_id: sale.customerId,
          usuario_id: sale.userId,
          monto_total: sale.totalAmount,
          descuento: sale.discount,
          impuesto: sale.tax,
          metodo_pago: sale.paymentMethod,
          estado: sale.status,
          notas: sale.notes
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Crear items de venta
      const saleItemsData = sale.items.map(item => ({
        venta_id: saleData.id,
        producto_id: item.productId,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        total: item.total
      }))

      const { error: itemsError } = await supabase
        .from('items_venta')
        .insert(saleItemsData)

      if (itemsError) throw itemsError

      // Actualizar inventario
      for (const item of sale.items) {
        await inventoryService.updateStock(item.productId, -item.quantity)
      }

      // Registrar transacción
      await transactionService.create({
        type: 'income',
        amount: sale.totalAmount,
        description: `Venta #${saleData.id}`,
        category: 'Ventas',
        transactionDate: new Date(),
        userId: sale.userId
      })

      // Obtener la venta completa
      const completeSale = await this.getById(saleData.id)
      if (!completeSale) throw new Error('Error al obtener la venta creada')

      return completeSale
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar venta
  async update(id: string, updates: Partial<Sale>): Promise<Sale> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .update({
          cliente_id: updates.customerId,
          usuario_id: updates.userId,
          monto_total: updates.totalAmount,
          descuento: updates.discount,
          impuesto: updates.tax,
          metodo_pago: updates.paymentMethod,
          estado: updates.status,
          notas: updates.notes
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Obtener la venta actualizada
      const updatedSale = await this.getById(id)
      if (!updatedSale) throw new Error('Error al obtener la venta actualizada')

      return updatedSale
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Eliminar venta
  async delete(id: string): Promise<void> {
    try {
      // Primero obtener la venta para restaurar inventario
      const sale = await this.getById(id)
      if (sale) {
        // Restaurar stock
        for (const item of sale.items) {
          await inventoryService.updateStock(item.productId, item.quantity)
        }
      }

      // Eliminar items de venta primero
      const { error: itemsError } = await supabase
        .from('items_venta')
        .delete()
        .eq('venta_id', id)

      if (itemsError) throw itemsError

      // Eliminar venta
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Cancelar venta
  async cancel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ventas')
  .update({ estado: 'cancelada' })
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
        .from('ventas')
        .select(`
          *,
          customer:clientes(id, nombre),
          user:usuarios(id, nombre),
          items_venta(
            id,
            producto_id,
            cantidad,
            precio_unitario,
            total,
            producto:productos(id, nombre, sku)
          )
        `)
  .gte('creado_en', startDate)
  .lte('creado_en', endDate)
  .order('creado_en', { ascending: false })

      if (error) throw error
      return (data?.map(item => ({
        id: item.id,
        customerId: item.cliente_id,
        customer: item.customer as any,
        userId: item.usuario_id,
        user: item.user as any,
        items: item.items_venta?.map((saleItem: any) => ({
          id: saleItem.id,
          productId: saleItem.producto_id,
          product: saleItem.producto as any,
          quantity: saleItem.cantidad,
          unitPrice: saleItem.precio_unitario,
          total: saleItem.total
        })) || [],
  totalAmount: item.monto_total,
        discount: item.descuento || 0,
        tax: item.impuesto || 0,
        paymentMethod: item.metodo_pago,
        status: item.estado,
        notes: item.notas,
  createdAt: new Date(item.creado_en),
  updatedAt: new Date(item.actualizado_en)
      })) || []) as Sale[]
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener estadísticas de ventas
  async getStats(startDate?: Date, endDate?: Date) {
    try {
      let query = supabase
        .from('ventas')
        .select('monto_total, creado_en, estado')

      if (startDate) {
  query = query.gte('creado_en', startDate.toISOString())
      }
      if (endDate) {
  query = query.lte('creado_en', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      const totalSales = data?.length || 0
  const totalRevenue = data?.reduce((sum, sale: any) => sum + (sale.monto_total || 0), 0) || 0
  const completedSales = data?.filter((sale: any) => sale.estado === 'completada').length || 0
  const pendingSales = data?.filter((sale: any) => sale.estado === 'pendiente').length || 0

      return {
        totalSales,
        totalRevenue,
        completedSales,
        pendingSales,
        averageSaleAmount: totalSales > 0 ? totalRevenue / totalSales : 0
      }
    } catch (error) {
      handleSupabaseError(error)
      return {
        totalSales: 0,
        totalRevenue: 0,
        completedSales: 0,
        pendingSales: 0,
        averageSaleAmount: 0
      }
    }
  }
}
