import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useSalesStore, useProductsStore, useCustomersStore, useAuthStore } from '../store';
import { Sale, SaleItem, PaymentMethod } from '../types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const saleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Selecciona un producto'),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    unitPrice: z.number().min(0, 'El precio debe ser mayor o igual a 0')
  })).min(1, 'Agrega al menos un producto'),
  discount: z.number().min(0).max(100, 'El descuento debe estar entre 0 y 100'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'credit']),
  notes: z.string().optional()
});

type SaleFormData = z.infer<typeof saleSchema>;

const paymentMethodOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit', label: 'Crédito' }
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'refunded', label: 'Reembolsada' }
];

export const Sales: React.FC = () => {
  const { sales, addSale, getTodaySales, fetchSales, loading: salesLoading, error: salesError } = useSalesStore();
  const { products, fetchProducts, loading: productsLoading, error: productsError } = useProductsStore();
  const { customers, fetchCustomers, loading: customersLoading, error: customersError } = useCustomersStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, [fetchSales, fetchProducts, fetchCustomers]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors }
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      paymentMethod: 'cash'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');

  const todaySales = getTodaySales();
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const calculateItemTotal = (item: any) => {
    return item.quantity * item.unitPrice;
  };

  const calculateSaleTotal = () => {
    const itemsTotal = watchedItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discountAmount = itemsTotal * (watchedDiscount / 100);
    return itemsTotal - discountAmount;
  };

  const handleOpenNewSaleModal = () => {
    reset({
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      paymentMethod: 'cash'
    });
    setIsNewSaleModalOpen(true);
  };

  const handleCloseNewSaleModal = () => {
    setIsNewSaleModalOpen(false);
    reset();
  };

  const onSubmit = (data: SaleFormData) => {
    if (!user) return;

    const saleItems: SaleItem[] = data.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      productId: item.productId,
      product: products.find(p => p.id === item.productId)!,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: calculateItemTotal(item)
    }));

    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (data.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.16; // 16% IVA
    const totalAmount = afterDiscount + tax;

    const newSale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
      customerId: data.customerId || undefined,
      customer: data.customerId ? customers.find(c => c.id === data.customerId) : undefined,
      userId: user.id,
      user,
      items: saleItems,
      totalAmount,
      discount: data.discount,
      tax,
      paymentMethod: data.paymentMethod,
      status: 'completed',
      notes: data.notes
    };

    addSale(newSale);
    handleCloseNewSaleModal();
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Reembolsada', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    return paymentMethodOptions.find(opt => opt.value === method)?.label || method;
  };

  // Mostrar estado de carga
  const isLoading = salesLoading || productsLoading || customersLoading;
  const hasError = salesError || productsError || customersError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de ventas...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ShoppingCart className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">
            Error al cargar datos: {salesError || productsError || customersError}
          </p>
          <Button onClick={() => {
            fetchSales();
            fetchProducts();
            fetchCustomers();
          }}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
          <p className="text-gray-600">Registra ventas, genera facturas y gestiona ingresos</p>
        </div>
        <Button onClick={handleOpenNewSaleModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todaySales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">${todayRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Promedio Venta</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length).toFixed(2) : '0.00'}
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
              <Input
                placeholder="Buscar por número de factura, cliente o vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => {
                const status = getStatusLabel(sale.status);
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{sale.customer?.name || 'Cliente General'}</TableCell>
                    <TableCell>{sale.user.name}</TableCell>
                    <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(sale.paymentMethod)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Sale Modal */}
      <Modal
        isOpen={isNewSaleModalOpen}
        onClose={handleCloseNewSaleModal}
        title="Nueva Venta"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Cliente (Opcional)"
              {...register('customerId')}
              options={[
                { value: '', label: 'Cliente General' },
                ...customers.map(customer => ({
                  value: customer.id,
                  label: customer.name
                }))
              ]}
            />
            <Select
              label="Método de Pago"
              {...register('paymentMethod')}
              options={paymentMethodOptions}
              error={errors.paymentMethod?.message}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Productos</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Select
                  label="Producto"
                  {...register(`items.${index}.productId`)}
                  onChange={(e) => {
                    setValue(`items.${index}.productId`, e.target.value);
                    handleProductChange(index, e.target.value);
                  }}
                  options={[
                    { value: '', label: 'Seleccionar producto' },
                    ...products.map(product => ({
                      value: product.id,
                      label: `${product.name} - $${product.price}`
                    }))
                  ]}
                  error={errors.items?.[index]?.productId?.message}
                />
                <Input
                  label="Cantidad"
                  type="number"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  error={errors.items?.[index]?.quantity?.message}
                />
                <Input
                  label="Precio Unitario"
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  error={errors.items?.[index]?.unitPrice?.message}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Descuento General (%)"
              type="number"
              {...register('discount', { valueAsNumber: true })}
              error={errors.discount?.message}
            />
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">${calculateSaleTotal().toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Notas (Opcional)"
            {...register('notes')}
            placeholder="Notas adicionales sobre la venta..."
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseNewSaleModal}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Venta
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <Modal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Detalle de Venta - #${selectedSale.id}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium">{selectedSale.customer?.name || 'Cliente General'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendedor</p>
                <p className="font-medium">{selectedSale.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-medium">{getPaymentMethodLabel(selectedSale.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusLabel(selectedSale.status).color}`}>
                  {getStatusLabel(selectedSale.status).label}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Productos</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Descuento:</span>
                <span>{selectedSale.discount}%</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>${selectedSale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${selectedSale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {selectedSale.notes && (
              <div>
                <p className="text-sm text-gray-600">Notas</p>
                <p className="font-medium">{selectedSale.notes}</p>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button onClick={() => setSelectedSale(null)}>
              Cerrar
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};