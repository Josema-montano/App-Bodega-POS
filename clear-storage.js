// SCRIPT TEMPORAL PARA LIMPIAR LOCALSTORAGE
// Ejecutar este código en la consola del navegador

console.log("🧹 Limpiando localStorage...");

// Limpiar todos los stores de Zustand
const keysToRemove = [
  'auth-storage',
  'products-storage', 
  'customers-storage',
  'suppliers-storage',
  'sales-storage',
  'inventory-storage',
  'transactions-storage'
];

keysToRemove.forEach(key => {
  const item = localStorage.getItem(key);
  if (item) {
    console.log(`❌ Eliminando: ${key}`, JSON.parse(item));
    localStorage.removeItem(key);
  }
});

// Limpiar cualquier clave relacionada con Supabase
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth')) {
    console.log(`❌ Eliminando clave relacionada: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log("✅ localStorage limpiado. Recarga la página (F5)");
