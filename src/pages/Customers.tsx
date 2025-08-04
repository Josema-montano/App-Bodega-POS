import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useCustomersStore, useAuthStore } from '../store';
import { Customer, CustomerType } from '../types';
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
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(['individual', 'business']),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0, 'El límite de crédito debe ser mayor o igual a 0').optional(),
  notes: z.string().optional(),
  currentDebt: z.number().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

const customerTypeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Empresa' }
];

const typeFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Empresa' }
];

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomersStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
      type: 'individual',
      creditLimit: 0,
      currentDebt: 0
    }
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesType = !typeFilter || customer.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalCustomers = customers.length;
  const individualCustomers = customers.filter(c => c.type === 'individual').length;
  const businessCustomers = customers.filter(c => c.type === 'business').length;
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        type: customer.type,
        taxId: customer.taxId || '',
        creditLimit: customer.creditLimit || 0,
        notes: customer.notes || ''
      });
    } else {
      setSelectedCustomer(null);
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        type: 'individual',
        taxId: '',
        creditLimit: 0,
        notes: '',
        currentDebt: 0
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
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      taxId: data.taxId || undefined,
      creditLimit: data.creditLimit || 0,
      notes: data.notes || undefined,
      currentDebt: data.currentDebt ?? 0
    };

    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, customerData);
    } else {
      addCustomer(customerData);
    }
    handleCloseModal();
  };

  const getTypeLabel = (type: CustomerType) => {
    return customerTypeOptions.find(opt => opt.value === type)?.label || type;
  };

  const canEdit = user?.role === 'admin' || user?.role === 'worker';
  const canDelete = user?.role === 'admin';

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
                <p className="text-sm font-medium text-gray-600">Individuales</p>
                <p className="text-2xl font-bold text-gray-900">{individualCustomers}</p>
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
                <p className="text-sm font-medium text-gray-600">Empresas</p>
                <p className="text-2xl font-bold text-gray-900">{businessCustomers}</p>
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
            <div className="w-full sm:w-48">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={typeFilterOptions}
              />
            </div>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Límite Crédito</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.type === 'business' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getTypeLabel(customer.type)}
                    </span>
                  </TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.city || '-'}</TableCell>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              {...register('name')}
              error={errors.name?.message}
            />
            <Select
              label="Tipo *"
              {...register('type')}
              options={customerTypeOptions}
              error={errors.type?.message}
            />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Ciudad"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              label="Estado"
              {...register('state')}
              error={errors.state?.message}
            />
            <Input
              label="Código Postal"
              {...register('zipCode')}
              error={errors.zipCode?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RFC/Tax ID"
              {...register('taxId')}
              error={errors.taxId?.message}
            />
            <Input
              label="Límite de Crédito"
              type="number"
              step="0.01"
              {...register('creditLimit', { valueAsNumber: true })}
              error={errors.creditLimit?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <p className="text-gray-900">{selectedCustomer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedCustomer.type === 'business' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {getTypeLabel(selectedCustomer.type)}
                </span>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <p className="text-gray-900">{selectedCustomer.city || 'No especificada'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <p className="text-gray-900">{selectedCustomer.state || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <p className="text-gray-900">{selectedCustomer.zipCode || 'No especificado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC/Tax ID
                </label>
                <p className="text-gray-900">{selectedCustomer.taxId || 'No especificado'}</p>
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

            {selectedCustomer.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <p className="text-gray-900">{selectedCustomer.notes}</p>
              </div>
            )}
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