import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Supplier } from '../types'

export const supplierService = {
  // Obtener todos los proveedores
  async getAll(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        contactPerson: item.contacto,
        email: item.email,
        phone: item.telefono,
        address: item.direccion,
        isActive: item.activo,
        createdAt: new Date(item.creado_en),
        updatedAt: new Date(item.actualizado_en)
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
        .from('proveedores')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        contactPerson: data.contacto,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      return null
    }
  },

  // Crear nuevo proveedor
  async create(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .insert({
          nombre: supplierData.name,
          contacto: supplierData.contactPerson,
          email: supplierData.email,
          telefono: supplierData.phone,
          direccion: supplierData.address,
          activo: supplierData.isActive
        })
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        contactPerson: data.contacto,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
      }
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Actualizar proveedor
  async update(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supplier> {
    try {
      const updateData: any = {}
      if (supplierData.name !== undefined) updateData.nombre = supplierData.name
      if (supplierData.contactPerson !== undefined) updateData.contacto = supplierData.contactPerson
      if (supplierData.email !== undefined) updateData.email = supplierData.email
      if (supplierData.phone !== undefined) updateData.telefono = supplierData.phone
      if (supplierData.address !== undefined) updateData.direccion = supplierData.address
      if (supplierData.isActive !== undefined) updateData.activo = supplierData.isActive
      
      const { data, error } = await supabase
        .from('proveedores')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return {
        id: data.id,
        name: data.nombre,
        contactPerson: data.contacto,
        email: data.email,
        phone: data.telefono,
        address: data.direccion,
        isActive: data.activo,
        createdAt: new Date(data.creado_en),
        updatedAt: new Date(data.actualizado_en)
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
        .from('proveedores')
        .update({ activo: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error)
      throw error
    }
  },

  // Buscar proveedores
  async search(term: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .or(`nombre.ilike.%${term}%,contacto.ilike.%${term}%,email.ilike.%${term}%`)
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      return data?.map(item => ({
        id: item.id,
        name: item.nombre,
        contactPerson: item.contacto,
        email: item.email,
        phone: item.telefono,
        address: item.direccion,
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
