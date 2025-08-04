// Prueba de conexión a Supabase
import { supabase } from './src/lib/supabase.js';

async function testConnection() {
  try {
    console.log('Probando conexión a Supabase...');
    
    // Probar una consulta simple
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error al conectar:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa a Supabase!');
    console.log('Datos de prueba:', data);
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

testConnection();