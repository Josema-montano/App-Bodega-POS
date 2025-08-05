import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useCustomersStore, useAuthStore } from '../store';
import { Customer } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido'),
  address: z.string().optional(),
  currentDebt: z.number().min(0, 'La deuda actual debe ser mayor o igual a 0').optional(),
  creditLimit: z.number().min(0, 'El límite de crédito debe ser mayor o igual a 0').optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Removed type options as type field doesn't exist in schema

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, fetchCustomers, loading, error } = useCustomersStore();

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  // Removed typeFilter as type field doesn't exist in schema
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      creditLimit: 0,
      currentDebt: 0
    }
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    return matchesSearch;
  });

  const totalCustomers = customers.length;
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalDebt = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        address: customer.address || '',
        currentDebt: customer.currentDebt || 0,
        creditLimit: customer.creditLimit || 0
      });
    } else {
      setSelectedCustomer(null);
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        currentDebt: 0,
        creditLimit: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    reset();
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const onSubmit = (data: CustomerFormData) => {
    const customerData = {
      ...data,
      email: data.email || undefined,
      address: data.address || undefined,
      currentDebt: data.currentDebt ?? 0,
      creditLimit: data.creditLimit || 0,
      isActive: true
    };

    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, customerData);
    } else {
      addCustomer(customerData);
    }
    handleCloseModal();
  };

  // Removed getTypeLabel function as CustomerType doesn't exist in schema

  const canEdit = user?.role === 'admin' || user?.role === 'employee';
  const canDelete = user?.role === 'admin';

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
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
            <Eye className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">Error al cargar clientes: {error}</p>
          <Button onClick={() => fetchCustomers()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deuda Total</p>
                <p className="text-2xl font-bold text-gray-900">${totalDebt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Límite Crédito Total</p>
                <p className="text-2xl font-bold text-gray-900">${totalCreditLimit.toLocaleString()}</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Removed type filter as type field doesn't exist in schema */}
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Deuda Actual</TableHead>
                <TableHead>Límite Crédito</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address || '-'}</TableCell>
                  <TableCell>${(customer.currentDebt || 0).toLocaleString()}</TableCell>
                  <TableCell>${(customer.creditLimit || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron clientes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre *"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Teléfono *"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Dirección"
            {...register('address')}
            error={errors.address?.message}
          />

          {/* Removed city, state, zipCode fields as they don't exist in schema */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Deuda Actual"
              type="number"
              step="0.01"
              {...register('currentDebt', { valueAsNumber: true })}
              error={errors.currentDebt?.message}
            />
            <Input
              label="Límite de Crédito"
              type="number"
              step="0.01"
              {...register('creditLimit', { valueAsNumber: true })}
              error={errors.creditLimit?.message}
            />
          </div>

          {/* Removed notes field as it doesn't exist in schema */}

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedCustomer ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Cliente"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <p className="text-gray-900">{selectedCustomer.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{selectedCustomer.email || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <p className="text-gray-900">{selectedCustomer.phone}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <p className="text-gray-900">{selectedCustomer.address}</p>
              </div>
            )}

            {/* Removed city, state, zipCode fields as they don't exist in schema */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deuda Actual
                </label>
                <p className="text-gray-900">${(selectedCustomer.currentDebt || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito
                </label>
                <p className="text-gray-900">${(selectedCustomer.creditLimit || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Registro
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedCustomer.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Actualización
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedCustomer.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            {/* Removed notes field as it doesn't exist in schema */}
          </div>
        )}
        <ModalFooter>
          <Button onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-gray-600 mb-4">
          ¿Estás seguro de que deseas eliminar al cliente <strong>{customerToDelete?.name}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
          >
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};