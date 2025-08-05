import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Transaction, TransactionType, PaymentMethod } from '../types'

export const transactionService = {
  // Obtener todas las transacciones
  async getAll(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          user:users(id, name)
        `)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        type: item.type as TransactionType,
        category: item.category,
        amount: item.amount,
        description: item.description,
        referenceId: item.reference_id,
        referenceType: item.reference_type,
        paymentMethod: item.payment_method,
        userId: item.user_id,
        transactionDate: new Date(item.transaction_date),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener transacciones por rango de fechas
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          user:users(id, name)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        type: item.type as TransactionType,
        category: item.category,
        amount: item.amount,
        description: item.description,
        referenceId: item.reference_id,
        referenceType: item.reference_type,
        paymentMethod: item.payment_method,
        userId: item.user_id,
        transactionDate: new Date(item.transaction_date),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener transacciones de hoy
  async getToday(): Promise<Transaction[]> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      
      return await this.getByDateRange(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      )
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Crear nueva transacción
  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const insertData = {
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        reference_id: transaction.referenceId,
        reference_type: transaction.referenceType,
        payment_method: transaction.paymentMethod,
        user_id: transaction.userId,
        transaction_date: transaction.transactionDate?.toISOString() || new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
        .select(`
          *,
          user:users(id, name)
        `)
        .single()
      
      if (error) throw error
      
      return {
        id: data.id,
        type: data.type as TransactionType,
        category: data.category,
        amount: data.amount,
        description: data.description,
        referenceId: data.reference_id,
        referenceType: data.reference_type,
        paymentMethod: data.payment_method,
        userId: data.user_id,
        transactionDate: new Date(data.transaction_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar transacción
  async update(id: string, transaction: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction> {
    try {
      const updateData: any = {}
      if (transaction.type !== undefined) updateData.type = transaction.type
      if (transaction.category !== undefined) updateData.category = transaction.category
      if (transaction.amount !== undefined) updateData.amount = transaction.amount
      if (transaction.description !== undefined) updateData.description = transaction.description
      if (transaction.referenceId !== undefined) updateData.reference_id = transaction.referenceId
      if (transaction.referenceType !== undefined) updateData.reference_type = transaction.referenceType
      if (transaction.paymentMethod !== undefined) updateData.payment_method = transaction.paymentMethod
      if (transaction.userId !== undefined) updateData.user_id = transaction.userId
      if (transaction.transactionDate !== undefined) updateData.transaction_date = transaction.transactionDate?.toISOString()

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          user:users(id, name)
        `)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        type: data.type as TransactionType,
        category: data.category,
        amount: data.amount,
        description: data.description,
        referenceId: data.reference_id,
        referenceType: data.reference_type,
        paymentMethod: data.payment_method,
        userId: data.user_id,
        transactionDate: new Date(data.transaction_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Eliminar transacción
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Crear transacción automática para venta
  async createSaleTransaction(saleId: string, amount: number, userId: string, paymentMethod?: PaymentMethod): Promise<Transaction> {
    return await this.create({
      type: 'income',
      category: 'sales',
      amount: amount,
      description: 'Venta registrada automáticamente',
      referenceId: saleId,
      referenceType: 'sale',
      paymentMethod: paymentMethod || 'cash',
      userId: userId,
      transactionDate: new Date()
    })
  }
}