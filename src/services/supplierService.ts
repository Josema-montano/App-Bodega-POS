import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Supplier } from '../types'
import { useAppStore } from '../store'

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
        contactPerson: item.contact_person,
        email: item.email,
        phone: item.phone,
        address: item.address,
        isActive: item.is_active,
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
      const supplier = {
        id: data.id,
        name: data.name,
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }

      // Crear notificación de nuevo proveedor
       const { addNotification } = useAppStore.getState();
       addNotification({
         type: 'info',
         title: 'Nuevo Proveedor Registrado',
         message: `Se ha registrado un nuevo proveedor: ${supplier.name} (${supplier.email}).`,
         priority: 'low',
         read: false
       });

      return supplier
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
          address: supplier.address,
          is_active: supplier.isActive ?? true
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: data.is_active,
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
      if (supplier.isActive !== undefined) updateData.is_active = supplier.isActive

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
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: data.is_active,
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
        contactPerson: item.contact_person,
        email: item.email,
        phone: item.phone,
        address: item.address,
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