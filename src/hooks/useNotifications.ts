import { useEffect } from 'react';
import { useAppStore, useProductsStore, useInventoryStore, useSalesStore, useCustomersStore, useSuppliersStore } from '../store';
import { inventoryService } from '../services/inventoryService';

export const useNotifications = () => {
  const { addNotification } = useAppStore();
  const { products } = useProductsStore();
  const { inventory } = useInventoryStore();
  const { sales } = useSalesStore();
  const { customers } = useCustomersStore();
  const { suppliers } = useSuppliersStore();

  // Verificar stock bajo cada 5 minutos
  const checkLowStock = async () => {
    try {
      await inventoryService.checkLowStock();
    } catch (error) {
      console.error('Error verificando stock bajo:', error);
      addNotification({
         type: 'error',
         title: 'Error del Sistema',
         message: 'No se pudo verificar el estado del inventario.',
         priority: 'high',
         read: false
       });
    }
  };

  // Función para crear notificación de venta completada
  const notifySaleCompleted = (saleAmount: number, customerName?: string) => {
    addNotification({
      type: 'success',
      title: 'Venta Completada',
      message: `Nueva venta registrada por $${saleAmount.toLocaleString()}${customerName ? ` para ${customerName}` : ''}.`,
      priority: 'medium',
      read: false
    });
  };

  // Función para crear notificación de nuevo cliente
  const notifyNewCustomer = (customerName: string) => {
    addNotification({
      type: 'info',
      title: 'Nuevo Cliente',
      message: `Se ha registrado un nuevo cliente: ${customerName}.`,
      priority: 'low',
      read: false
    });
  };

  // Función para crear notificación de nuevo proveedor
  const notifyNewSupplier = (supplierName: string) => {
    addNotification({
      type: 'info',
      title: 'Nuevo Proveedor',
      message: `Se ha registrado un nuevo proveedor: ${supplierName}.`,
      priority: 'low',
      read: false
    });
  };

  // Función para crear notificación de error del sistema
  const notifySystemError = (errorMessage: string) => {
    addNotification({
      type: 'error',
      title: 'Error del Sistema',
      message: errorMessage,
      priority: 'high',
      read: false
    });
  };

  // Función para crear notificación de producto agotado
  const notifyOutOfStock = (productName: string) => {
    addNotification({
      type: 'error',
      title: 'Producto Agotado',
      message: `El producto "${productName}" se ha agotado completamente.`,
      priority: 'high',
      read: false
    });
  };

  // Función para crear notificaciones de ejemplo (solo para demostración)
  const createSampleNotifications = () => {
    const sampleNotifications = [
      {
        type: 'info' as const,
        title: 'Bienvenido al Sistema',
        message: 'Sistema POS de Bodega de Vinos iniciado correctamente. Todas las funciones están operativas.',
        priority: 'low' as const,
        read: false
      },
      {
        type: 'warning' as const,
        title: 'Revisión de Inventario',
        message: 'Se recomienda realizar una revisión del inventario. Algunos productos pueden necesitar reabastecimiento.',
        priority: 'medium' as const,
        read: false
      },
      {
        type: 'success' as const,
        title: 'Backup Completado',
        message: 'La copia de seguridad diaria se ha completado exitosamente.',
        priority: 'low' as const,
        read: false
      },
      {
        type: 'info' as const,
        title: 'Actualización Disponible',
        message: 'Hay una nueva actualización del sistema disponible. Considera actualizar para obtener las últimas funciones.',
        priority: 'low' as const,
        read: false
      },
      {
        type: 'warning' as const,
        title: 'Mantenimiento Programado',
        message: 'Se ha programado mantenimiento del sistema para el próximo domingo a las 2:00 AM.',
        priority: 'medium' as const,
        read: false
      }
    ];

    sampleNotifications.forEach(notification => {
      addNotification(notification);
    });
  };

  // Verificar stock bajo cada vez que cambie el inventario
  useEffect(() => {
    if (inventory.length > 0 && products.length > 0) {
      checkLowStock();
    }
  }, [inventory, products]);

  // Crear notificaciones de ejemplo al cargar el hook por primera vez
  useEffect(() => {
    // Solo crear notificaciones de ejemplo si no hay notificaciones existentes
    const { notifications } = useAppStore.getState();
    if (notifications.length === 0) {
      createSampleNotifications();
    }
  }, []);

  return {
    notifySaleCompleted,
    notifyNewCustomer,
    notifyNewSupplier,
    notifySystemError,
    notifyOutOfStock,
    checkLowStock,
    createSampleNotifications
  };
};