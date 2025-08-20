import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug temporal
console.log('🔍 SUPABASE CONFIG DEBUG:')
console.log('URL from env:', supabaseUrl)
console.log('Anon key from env:', supabaseAnonKey ? '***...***' : 'NOT SET')
console.log('All env vars:', import.meta.env)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('✅ Supabase client created with URL:', supabaseUrl)

// Tipos para las tablas de la base de datos
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre: string
          rol: 'admin' | 'empleado'
          activo: boolean
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          nombre: string
          rol: 'admin' | 'empleado'
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          rol?: 'admin' | 'empleado'
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
      }
      productos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio: number
          costo: number
          categoria: string
          marca: string | null
          sku: string
          codigo_barras: string | null
          activo: boolean
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio: number
          costo: number
          categoria: string
          marca?: string | null
          sku: string
          codigo_barras?: string | null
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          precio?: number
          costo?: number
          categoria?: string
          marca?: string | null
          sku?: string
          codigo_barras?: string | null
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          email: string | null
          telefono: string | null
          direccion: string | null
          deuda_actual: number
          limite_credito: number
          activo: boolean
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          nombre: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          deuda_actual?: number
          limite_credito?: number
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          deuda_actual?: number
          limite_credito?: number
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
      }
      proveedores: {
        Row: {
          id: string
          nombre: string
          contacto: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          activo: boolean
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          nombre: string
          contacto?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombre?: string
          contacto?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          activo?: boolean
          creado_en?: string
          actualizado_en?: string
        }
      }
      ventas: {
        Row: {
          id: string
          cliente_id: string | null
          usuario_id: string
          monto_total: number
          descuento: number
          impuesto: number
          metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | 'cheque'
          estado: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada'
          notas: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          usuario_id: string
          monto_total: number
          descuento?: number
          impuesto?: number
          metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | 'cheque'
          estado?: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada'
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          cliente_id?: string | null
          usuario_id?: string
          monto_total?: number
          descuento?: number
          impuesto?: number
          metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | 'cheque'
          estado?: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada'
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
      }
    }
  }
}

// Funciones de utilidad para manejar errores de Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Error de Supabase:', error)
  throw new Error(error.message || 'Error desconocido de la base de datos')
}

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) throw error
    console.log('Conexión a Supabase exitosa')
    return true
  } catch (error) {
    console.error('Error al conectar con Supabase:', error)
    return false
  }
}