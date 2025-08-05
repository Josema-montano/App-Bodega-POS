import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Mail, Phone, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useSuppliersStore, useAuthStore } from '../store';
import { Supplier } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  contactPerson: z.string().min(1, 'La persona de contacto es requerida'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido'),
  address: z.string().optional()
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// Removed category options as category field doesn't exist in schema

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers, loading, error } = useSuppliersStore();

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  // Removed categoryFilter as category field doesn't exist in schema
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema)
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm);
    
    return matchesSearch;
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email || '',
        phone: supplier.phone,
        address: supplier.address || ''
      });
    } else {
      setSelectedSupplier(null);
      reset({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
    reset();
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  };

  const onSubmit = (data: SupplierFormData) => {
    const supplierData = {
      ...data,
      email: data.email || undefined,
      address: data.address || undefined,
      isActive: true
    };

    if (selectedSupplier) {
      updateSupplier(selectedSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }
    handleCloseModal();
  };

  // Removed getCategoryLabel function as category field doesn't exist in schema

  const canEdit = user?.role === 'admin' || user?.role === 'employee';
  const canDelete = user?.role === 'admin';

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proveedores...</p>
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
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-4">Error al cargar proveedores: {error}</p>
          <Button onClick={() => fetchSuppliers()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600">Administra la información de tus proveedores</p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
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
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{activeSuppliers}</p>
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
                <p className="text-sm font-medium text-gray-600">Con Email</p>
                <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => s.email).length}</p>
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
                <p className="text-sm font-medium text-gray-600">Con Dirección</p>
                <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => s.address).length}</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, contacto, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Removed category filter as category field doesn't exist in schema */}
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.address || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(supplier.createdAt), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSupplier(supplier)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(supplier)}
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
          
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron proveedores</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la Empresa *"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Persona de Contacto *"
              {...register('contactPerson')}
              error={errors.contactPerson?.message}
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

          {/* Removed fields that don't exist in schema: city, state, zipCode, country, taxId, category, paymentTerms, website, notes */}

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {selectedSupplier ? 'Actualizar' : 'Crear'} Proveedor
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Supplier Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Proveedor"
        size="lg"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <p className="text-gray-900">{selectedSupplier.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto
                </label>
                <p className="text-gray-900">{selectedSupplier.contactPerson}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{selectedSupplier.email || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <p className="text-gray-900">{selectedSupplier.phone}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedSupplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedSupplier.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {selectedSupplier.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <p className="text-gray-900">{selectedSupplier.address}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Registro
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedSupplier.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Actualización
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedSupplier.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
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
          ¿Estás seguro de que deseas eliminar al proveedor <strong>{supplierToDelete?.name}</strong>?
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