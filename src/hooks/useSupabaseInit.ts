import { useEffect } from 'react'
import { useAuthStore, useProductsStore, useCustomersStore, useSuppliersStore, useSalesStore } from '../store'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

/**
 * Hook personalizado para inicializar la conexión con Supabase
 * y cargar los datos iniciales de la aplicación
 */
export const useSupabaseInit = () => {
  const { isAuthenticated } = useAuthStore()
  const { fetchProducts } = useProductsStore()
  const { fetchCustomers } = useCustomersStore()
  const { fetchSuppliers } = useSuppliersStore()
  const { fetchSales } = useSalesStore()

  // Verificar conexión con Supabase
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('count')
          .limit(1)
        if (error) {
          console.error('Error de conexión con Supabase:', error)
          toast.error('Error de conexión con la base de datos')
        } else {
          console.log('✅ Conexión con Supabase establecida correctamente')
        }
      } catch (error) {
        console.error('Error al verificar conexión:', error)
        toast.error('No se pudo conectar con la base de datos')
      }
    }
    checkConnection()
  }, [])

  // Cargar datos iniciales cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchProducts(),
            fetchCustomers(),
            fetchSuppliers(),
            fetchSales()
          ])
          console.log('✅ Datos iniciales cargados correctamente')
        } catch (error) {
          console.error('Error al cargar datos iniciales:', error)
          toast.error('Error al cargar los datos de la aplicación')
        }
      }
      loadInitialData()
    }
  }, [isAuthenticated, fetchProducts, fetchCustomers, fetchSuppliers, fetchSales])
}

import { useRef } from 'react'
export const useSupabaseAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const isProcessingAuth = useRef(false)

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      if (isProcessingAuth.current) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session && isAuthenticated && !isProcessingAuth.current) {
          isProcessingAuth.current = true
          await logout()
          isProcessingAuth.current = false
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
        isProcessingAuth.current = false
      }
    }
    checkSession()

    // Listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== 'TOKEN_REFRESHED') {
          console.log('Auth event:', event)
        }
        if ((event === 'SIGNED_OUT' || !session) && isAuthenticated && !isProcessingAuth.current) {
          isProcessingAuth.current = true
          try {
            await logout()
          } catch (error) {
            console.error('Error en logout:', error)
          } finally {
            isProcessingAuth.current = false
          }
        }
      }
    )
    return () => {
      subscription.unsubscribe()
      isProcessingAuth.current = false
    }
  }, [isAuthenticated, logout])

  return { user, isAuthenticated }
}