import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useProductsStore } from '../store';
import { Product, ProductCategory } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  category: z.enum(['wine', 'supplies', 'equipment', 'packaging']),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  minStock: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  unit: z.string().min(1, 'La unidad es requerida'),
  barcode: z.string().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

const categoryOptions = [
  { value: 'wine', label: 'Vinos' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'packaging', label: 'Empaque' }
];

export const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, getLowStockProducts } = useProductsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema)
  });

  const lowStockProducts = getLowStockProducts();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesLowStock = !showLowStock || product.stock <= product.minStock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('category', product.category);
      setValue('price', product.price);
      setValue('cost', product.cost);
      setValue('stock', product.stock);
      setValue('minStock', product.minStock);
      setValue('unit', product.unit);
      setValue('barcode', product.barcode || '');
    } else {
      setEditingProduct(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  const getCategoryLabel = (category: ProductCategory) => {
    return categoryOptions.find(opt => opt.value === category)?.label || category;
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Sin stock', color: 'text-red-600 bg-red-50' };
    if (product.stock <= product.minStock) return { label: 'Stock bajo', color: 'text-orange-600 bg-orange-50' };
    return { label: 'En stock', color: 'text-green-600 bg-green-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600">Administra productos, stock y alertas de inventario</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Valor Total Inventario</p>
              <p className="text-2xl font-bold text-gray-900">
                ${products.reduce((sum, p) => sum + (p.stock * p.cost), 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(products.map(p => p.category)).size}
              </p>
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
          <CardTitle>Productos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
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
                      <div>
                        <p className="font-medium">{product.stock} {product.unit}</p>
                        <p className="text-sm text-gray-600">Mín: {product.minStock}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>${product.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Producto' : 'Agregar Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Producto"
              {...register('name')}
              error={errors.name?.message}
            />
            
            <Select
              label="Categoría"
              options={categoryOptions}
              {...register('category')}
              error={errors.category?.message}
            />
          </div>
          
          <Input
            label="Descripción"
            {...register('description')}
            error={errors.description?.message}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Precio de Venta"
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
            />
            
            <Input
              label="Costo"
              type="number"
              step="0.01"
              {...register('cost', { valueAsNumber: true })}
              error={errors.cost?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Stock Actual"
              type="number"
              {...register('stock', { valueAsNumber: true })}
              error={errors.stock?.message}
            />
            
            <Input
              label="Stock Mínimo"
              type="number"
              {...register('minStock', { valueAsNumber: true })}
              error={errors.minStock?.message}
            />
            
            <Input
              label="Unidad"
              {...register('unit')}
              error={errors.unit?.message}
              placeholder="ej: botella, kg, litro"
            />
          </div>
          
          <Input
            label="Código de Barras (Opcional)"
            {...register('barcode')}
            error={errors.barcode?.message}
          />
          
          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProduct ? 'Actualizar' : 'Agregar'} Producto
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};