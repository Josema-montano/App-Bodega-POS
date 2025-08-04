import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Supplier } from '../types'

export const supplierService = {
  // Obtener todos los proveedores
  async getAll(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
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
        contactPerson: item.contact_person,
        paymentTerms: 30, // TODO: agregar campo en BD
        currentDebt: 0, // TODO: agregar campo en BD
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  },

  // Obtener proveedor por ID
  async getById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        contactPerson: data.contact_person,
        paymentTerms: 30, // TODO: agregar campo en BD
        currentDebt: 0, // TODO: agregar campo en BD
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo proveedor
  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplier.name,
          contact_person: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address
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
        contactPerson: data.contact_person,
        paymentTerms: 30, // TODO: agregar campo en BD
        currentDebt: 0, // TODO: agregar campo en BD
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar proveedor
  async update(id: string, supplier: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supplier> {
    try {
      const updateData: any = {}
      if (supplier.name !== undefined) updateData.name = supplier.name
      if (supplier.contactPerson !== undefined) updateData.contact_person = supplier.contactPerson
      if (supplier.email !== undefined) updateData.email = supplier.email
      if (supplier.phone !== undefined) updateData.phone = supplier.phone
      if (supplier.address !== undefined) updateData.address = supplier.address
      // Removed isActive field as it's not in Supplier type

      const { data, error } = await supabase
        .from('suppliers')
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
        contactPerson: data.contact_person,
        paymentTerms: 30, // TODO: agregar campo en BD
        currentDebt: 0, // TODO: agregar campo en BD
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Eliminar proveedor (soft delete)
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar proveedores por nombre
  async search(query: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,contact_person.ilike.%${query}%`)
        .order('name')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        address: item.address,
        contactPerson: item.contact_person,
        paymentTerms: 30, // TODO: agregar campo en BD
        currentDebt: 0, // TODO: agregar campo en BD
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || []
    } catch (error) {
      handleSupabaseError(error)
      return []
    }
  }
}