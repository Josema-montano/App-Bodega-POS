import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useProductsStore, useInventoryStore } from '../store';
import { Product, InventoryItem } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inventorySchema = z.object({
  productId: z.string().min(1, 'Debe seleccionar un producto'),
  quantity: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  minStock: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  maxStock: z.number().min(0, 'El stock máximo debe ser mayor o igual a 0'),
  location: z.string().optional()
});

const stockUpdateSchema = z.object({
  quantity: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  reason: z.string().min(1, 'Debe especificar el motivo')
});

type InventoryFormData = z.infer<typeof inventorySchema>;
type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;

const categoryOptions = [
  { value: 'wine', label: 'Vinos' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'packaging', label: 'Empaque' }
];

export const Inventory: React.FC = () => {
  const { products, fetchProducts, loading: productsLoading, error: productsError } = useProductsStore();
  const { 
    inventory, 
    fetchInventory, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem,
    updateStock,
    getLowStockItems,
    loading: inventoryLoading, 
    error: inventoryError 
  } = useInventoryStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProducts();
    fetchInventory();
    loadLowStockItems();
  }, [fetchProducts, fetchInventory]);

  const loadLowStockItems = async () => {
    try {
      const items = await getLowStockItems();
      setLowStockItems(items);
    } catch (error) {
      console.error('Error al cargar productos con stock bajo:', error);
    }
  };

  // Formularios
  const {
    register: registerInventory,
    handleSubmit: handleSubmitInventory,
    reset: resetInventory,
    formState: { errors: inventoryErrors },
    setValue: setInventoryValue
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema)
  });

  const {
    register: registerStock,
    handleSubmit: handleSubmitStock,
    reset: resetStock,
    formState: { errors: stockErrors }
  } = useForm<StockUpdateFormData>({
    resolver: zodResolver(stockUpdateSchema)
  });

  // Combinar productos con inventario
  const productsWithInventory = products.map(product => {
    const inventoryItem = inventory.find(inv => inv.productId === product.id);
    return {
      ...product,
      inventory: inventoryItem
    };
  });

  // Filtrar productos
  const filteredProducts = productsWithInventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesLowStock = !showLowStock || (product.inventory && product.inventory.quantity <= product.inventory.minStock);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Funciones de manejo
  const handleOpenInventoryModal = (inventoryItem?: InventoryItem) => {
    if (inventoryItem) {
      setEditingInventory(inventoryItem);
      setInventoryValue('productId', inventoryItem.productId);
      setInventoryValue('quantity', inventoryItem.quantity);
      setInventoryValue('minStock', inventoryItem.minStock);
      setInventoryValue('maxStock', inventoryItem.maxStock || 0);
      setInventoryValue('location', inventoryItem.location || '');
    } else {
      setEditingInventory(null);
      resetInventory();
    }
    setIsModalOpen(true);
  };

  const handleOpenStockModal = (inventoryItem: InventoryItem) => {
    setSelectedInventory(inventoryItem);
    resetStock();
    setIsStockModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsStockModalOpen(false);
    setEditingInventory(null);
    setSelectedInventory(null);
    resetInventory();
    resetStock();
  };

  const onSubmitInventory = async (data: InventoryFormData) => {
    try {
      if (editingInventory) {
        await updateInventoryItem(editingInventory.id, data);
      } else {
        await addInventoryItem(data);
      }
      await loadLowStockItems();
      handleCloseModals();
    } catch (error) {
      console.error('Error al guardar inventario:', error);
    }
  };

  const onSubmitStockUpdate = async (data: StockUpdateFormData) => {
    if (!selectedInventory) return;
    
    try {
      await updateStock(selectedInventory.productId, data.quantity);
      await loadLowStockItems();
      handleCloseModals();
    } catch (error) {
      console.error('Error al actualizar stock:', error);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro de inventario?')) {
      try {
        await deleteInventoryItem(id);
        await loadLowStockItems();
      } catch (error) {
        console.error('Error al eliminar inventario:', error);
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(opt => opt.value === category)?.label || category;
  };

  const getStockStatus = (inventoryItem?: InventoryItem) => {
    if (!inventoryItem) {
      return { label: 'Sin inventario', color: 'text-gray-600 bg-gray-50' };
    }
    
    if (inventoryItem.quantity === 0) {
      return { label: 'Agotado', color: 'text-red-600 bg-red-50' };
    }
    
    if (inventoryItem.quantity <= inventoryItem.minStock) {
      return { label: 'Stock Bajo', color: 'text-orange-600 bg-orange-50' };
    }
    
    return { label: 'Disponible', color: 'text-green-600 bg-green-50' };
  };

  const getProductsWithoutInventory = () => {
    return products.filter(product => 
      !inventory.find(inv => inv.productId === product.id)
    );
  };

  // Calcular estadísticas
  const totalValue = inventory.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product ? product.cost * item.quantity : 0);
  }, 0);

  const loading = productsLoading || inventoryLoading;
  const error = productsError || inventoryError;

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">Error al cargar inventario: {error}</p>
          <Button onClick={() => { fetchProducts(); fetchInventory(); }}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600">Administra productos, stock y alertas de inventario</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenInventoryModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Inventario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Valor Total Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Sin Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getProductsWithoutInventory().length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              options={[{ value: '', label: 'Todas las categorías' }, ...categoryOptions]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48"
            />
            <Button
              variant={showLowStock ? 'primary' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Solo Stock Bajo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Stock Mín/Máx</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Valor Stock</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.inventory);
                const stockValue = product.inventory ? product.cost * product.inventory.quantity : 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryLabel(product.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {product.inventory ? product.inventory.quantity : 'N/A'}
                        </span>
                        {product.inventory && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenStockModal(product.inventory!)}
                          >
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.inventory ? (
                        <span className="text-sm">
                          {product.inventory.minStock} / {product.inventory.maxStock || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {product.inventory?.location || 'No especificada'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${stockValue.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {product.inventory ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenInventoryModal(product.inventory!)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteInventory(product.inventory!.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setInventoryValue('productId', product.id);
                              handleOpenInventoryModal();
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron productos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModals}
        title={editingInventory ? 'Editar Inventario' : 'Agregar Inventario'}
        size="lg"
      >
        <form onSubmit={handleSubmitInventory(onSubmitInventory)} className="space-y-4">
          <Select
            label="Producto"
            options={[
              { value: '', label: 'Seleccionar producto' },
              ...products.map(p => ({ value: p.id, label: p.name }))
            ]}
            {...registerInventory('productId')}
            error={inventoryErrors.productId?.message}
            disabled={!!editingInventory}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cantidad Actual"
              type="number"
              {...registerInventory('quantity', { valueAsNumber: true })}
              error={inventoryErrors.quantity?.message}
            />
            
            <Input
              label="Stock Mínimo"
              type="number"
              {...registerInventory('minStock', { valueAsNumber: true })}
              error={inventoryErrors.minStock?.message}
            />
            
            <Input
              label="Stock Máximo"
              type="number"
              {...registerInventory('maxStock', { valueAsNumber: true })}
              error={inventoryErrors.maxStock?.message}
            />
          </div>
          
          <Input
            label="Ubicación"
            {...registerInventory('location')}
            error={inventoryErrors.location?.message}
            placeholder="Ej: Bodega A, Estante 1"
          />
          
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModals}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingInventory ? 'Actualizar' : 'Agregar'} Inventario
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={handleCloseModals}
        title="Actualizar Stock"
        size="md"
      >
        {selectedInventory && (
          <form onSubmit={handleSubmitStock(onSubmitStockUpdate)} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">
                {products.find(p => p.id === selectedInventory.productId)?.name}
              </h3>
              <p className="text-sm text-gray-600">Stock actual: {selectedInventory.quantity}</p>
            </div>
            
            <Input
              label="Nueva Cantidad"
              type="number"
              {...registerStock('quantity', { valueAsNumber: true })}
              error={stockErrors.quantity?.message}
            />
            
            <Input
              label="Motivo del Cambio"
              {...registerStock('reason')}
              error={stockErrors.reason?.message}
              placeholder="Ej: Compra, Venta, Ajuste de inventario"
            />
            
            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Stock
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
};