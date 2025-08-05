import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Customer } from '../types'
import { useAppStore } from '../store'

export const customerService = {
  // Obtener todos los clientes
  async getAll(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        address: item.address,
        creditLimit: item.credit_limit || 0,
        currentDebt: item.current_debt || 0,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener cliente por ID
  async getById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      const customer = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        creditLimit: data.credit_limit || 0,
        currentDebt: data.current_debt || 0,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      // Crear notificación de nuevo cliente
       const { addNotification } = useAppStore.getState();
       addNotification({
         type: 'info',
         title: 'Nuevo Cliente Registrado',
         message: `Se ha registrado un nuevo cliente: ${customer.name} (${customer.email}).`,
         priority: 'low',
         read: false
       });

      return customer
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo cliente
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          current_debt: customer.currentDebt || 0,
          credit_limit: customer.creditLimit || 0,
          is_active: customer.isActive ?? true
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        creditLimit: data.credit_limit || 0,
        currentDebt: data.current_debt || 0,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar cliente
  async update(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    try {
      const updateData: any = {}
      if (customer.name !== undefined) updateData.name = customer.name
      if (customer.email !== undefined) updateData.email = customer.email
      if (customer.phone !== undefined) updateData.phone = customer.phone
      if (customer.address !== undefined) updateData.address = customer.address
      if (customer.currentDebt !== undefined) updateData.current_debt = customer.currentDebt
      if (customer.creditLimit !== undefined) updateData.credit_limit = customer.creditLimit
      if (customer.isActive !== undefined) updateData.is_active = customer.isActive

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        creditLimit: data.credit_limit || 0,
        currentDebt: data.current_debt || 0,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Eliminar cliente (soft delete)
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar clientes por nombre o email
  async search(query: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        address: item.address,
        creditLimit: item.credit_limit || 0,
        currentDebt: item.current_debt || 0,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Actualizar deuda del cliente
  async updateDebt(id: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ current_debt: amount })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  }
}