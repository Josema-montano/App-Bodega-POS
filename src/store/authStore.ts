import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole, AuthState } from '../types'
import { supabase } from '../lib/supabase'

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error

        if (data.user) {
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (userError) {
            const newUser: User = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || 'Usuario',
              role: 'employee' as UserRole,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            set({ user: newUser, isAuthenticated: true })
          } else {
            const user: User = {
              id: userData.id,
              email: data.user.email!,
              name: userData.nombre,
              role: userData.rol === 'admin' ? 'admin' : 'employee',
              isActive: userData.activo,
              createdAt: new Date(userData.creado_en),
              updatedAt: new Date(userData.actualizado_en)
            }
            set({ user, isAuthenticated: true })
          }
        }
      } catch (error: any) {
        throw new Error(error.message || 'Error al iniciar sesión')
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
        set({ user: null, isAuthenticated: false })
      }
    },
    register: async (userData) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password || 'defaultPassword123',
          options: { data: { name: userData.name } }
        })
        if (error) throw error

        if (data.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              role: userData.role || ('employee' as UserRole),
              is_active: true
            })
          if (insertError) throw insertError

          const user: User = {
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'employee',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          set({ user, isAuthenticated: true })
        }
      } catch (error: any) {
        throw new Error(error.message || 'Error al registrar usuario')
      }
    },
    updateProfile: async (userData) => {
      const currentUser = get().user
      if (!currentUser) return
      try {
        const { error } = await supabase
          .from('users')
          .update({ name: userData.name, role: userData.role })
          .eq('id', currentUser.id)
        if (error) throw error
        set(state => ({
          user: state.user ? { ...state.user, ...userData, updatedAt: new Date() } : null
        }))
      } catch (error) {
        console.error('Error al actualizar perfil:', error)
        throw error
      }
    }
  }),
  { name: 'auth-storage' }
))
