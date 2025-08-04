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
          .from('users')
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
          // Cargar datos en paralelo para mejor rendimiento
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

  // Configurar listener para cambios en tiempo real (opcional)
  useEffect(() => {
    if (!isAuthenticated) return

    // Listener para cambios en productos
    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Cambio en productos:', payload)
          // Recargar productos cuando hay cambios
          fetchProducts()
        }
      )
      .subscribe()

    // Listener para cambios en clientes
    const customersSubscription = supabase
      .channel('customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          console.log('Cambio en clientes:', payload)
          fetchCustomers()
        }
      )
      .subscribe()

    // Listener para cambios en proveedores
    const suppliersSubscription = supabase
      .channel('suppliers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers' },
        (payload) => {
          console.log('Cambio en proveedores:', payload)
          fetchSuppliers()
        }
      )
      .subscribe()

    // Listener para cambios en ventas
    const salesSubscription = supabase
      .channel('sales-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('Cambio en ventas:', payload)
          fetchSales()
        }
      )
      .subscribe()

    // Cleanup: desuscribirse cuando el componente se desmonta
    return () => {
      supabase.removeChannel(productsSubscription)
      supabase.removeChannel(customersSubscription)
      supabase.removeChannel(suppliersSubscription)
      supabase.removeChannel(salesSubscription)
    }
  }, [isAuthenticated, fetchProducts, fetchCustomers, fetchSuppliers, fetchSales])
}

/**
 * Hook para verificar el estado de autenticación con Supabase
 */
export const useSupabaseAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && isAuthenticated) {
        // Si no hay sesión pero el store dice que está autenticado, cerrar sesión
        logout()
      }
    }

    checkSession()

    // Listener para cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Cambio en autenticación:', event, session)
        
        if (event === 'SIGNED_OUT' || !session) {
          logout()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isAuthenticated, logout])

  return { user, isAuthenticated }
}