import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Customer } from '../types'

export const customerService = {
  // Obtener todos los clientes
  async getAll(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        email: item.email,
        phone: item.telefono,
        address: item.direccion,
        currentDebt: item.deuda_actual,
        creditLimit: item.limite_credito,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
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
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        currentDebt: data.deuda_actual,
        creditLimit: data.limite_credito,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo cliente
  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nombre: customerData.name,
          email: customerData.email,
          telefono: customerData.phone,
          direccion: customerData.address,
          deuda_actual: customerData.currentDebt,
          limite_credito: customerData.creditLimit,
          activo: customerData.isActive
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        currentDebt: data.deuda_actual,
        creditLimit: data.limite_credito,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar cliente
  async update(id: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    try {
      const updateData: any = {}
      if (customerData.name !== undefined) updateData.nombre = customerData.name
      if (customerData.email !== undefined) updateData.email = customerData.email
      if (customerData.phone !== undefined) updateData.telefono = customerData.phone
      if (customerData.address !== undefined) updateData.direccion = customerData.address
      if (customerData.currentDebt !== undefined) updateData.deuda_actual = customerData.currentDebt
      if (customerData.creditLimit !== undefined) updateData.limite_credito = customerData.creditLimit
      if (customerData.isActive !== undefined) updateData.activo = customerData.isActive
      
      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        currentDebt: data.deuda_actual,
        creditLimit: data.limite_credito,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
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
        .from('clientes')
        .update({ activo: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar clientes
  async search(term: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`nombre.ilike.%${term}%,email.ilike.%${term}%,telefono.ilike.%${term}%`)
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        email: item.email,
        phone: item.telefono,
        address: item.direccion,
        currentDebt: item.deuda_actual,
        creditLimit: item.limite_credito,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
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
        .from('clientes')
        .update({ deuda_actual: amount })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  }
}
