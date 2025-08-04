import React, { useState } from 'react';
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
  contactName: z.string().min(1, 'El nombre de contacto es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'El teléfono es requerido'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  category: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional()
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const categoryOptions = [
  { value: '', label: 'Seleccionar categoría' },
  { value: 'wines', label: 'Vinos' },
  { value: 'spirits', label: 'Licores' },
  { value: 'accessories', label: 'Accesorios' },
  { value: 'packaging', label: 'Embalaje' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'services', label: 'Servicios' },
  { value: 'other', label: 'Otros' }
];

const categoryFilterOptions = [
  { value: '', label: 'Todas las categorías' },
  ...categoryOptions.slice(1)
];

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliersStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      category: ''
    }
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm);
    const matchesCategory = !categoryFilter || supplier.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalSuppliers = suppliers.length;
  const categoryCounts = suppliers.reduce((acc, supplier) => {
    const category = supplier.category || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      reset({
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email || '',
        phone: supplier.phone,
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zipCode: supplier.zipCode || '',
        country: supplier.country || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms?.toString() || '',
        category: supplier.category || '',
        website: supplier.website || '',
        notes: supplier.notes || ''
      });
    } else {
      setSelectedSupplier(null);
      reset({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        taxId: '',
        paymentTerms: '',
        category: '',
        website: '',
        notes: ''
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
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      country: data.country || undefined,
      taxId: data.taxId || undefined,
      paymentTerms: Number(data.paymentTerms) || 0,
      category: data.category || undefined,
      website: data.website || undefined,
      notes: data.notes || undefined,
      currentDebt: 0
    };

    if (selectedSupplier) {
      updateSupplier(selectedSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }
    handleCloseModal();
  };

  const getCategoryLabel = (category?: string) => {
    return categoryOptions.find(opt => opt.value === category)?.label || 'Sin categoría';
  };

  const canEdit = user?.role === 'admin' || user?.role === 'worker';
  const canDelete = user?.role === 'admin';

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
                <p className="text-sm font-medium text-gray-600">Vinos</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.wines || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Licores</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.spirits || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Accesorios</p>
                <p className="text-2xl font-bold text-gray-900">{categoryCounts.accessories || 0}</p>
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
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryFilterOptions}
              />
            </div>
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
                <TableHead>Categoría</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactName}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryLabel(supplier.category)}
                    </span>
                  </TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.city || '-'}</TableCell>
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
              label="Nombre de Contacto *"
              {...register('contactName')}
              error={errors.contactName?.message}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Input
              label="País"
              {...register('country')}
              error={errors.country?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RFC/Tax ID"
              {...register('taxId')}
              error={errors.taxId?.message}
            />
            <Select
              label="Categoría"
              {...register('category')}
              options={categoryOptions}
              error={errors.category?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Términos de Pago"
              {...register('paymentTerms')}
              error={errors.paymentTerms?.message}
              placeholder="ej: 30 días"
            />
            <Input
              label="Sitio Web"
              {...register('website')}
              error={errors.website?.message}
              placeholder="https://..."
            />
          </div>

          <Textarea
            label="Notas"
            {...register('notes')}
            error={errors.notes?.message}
            rows={3}
          />

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
                <p className="text-gray-900">{selectedSupplier.contactName}</p>
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
                Categoría
              </label>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getCategoryLabel(selectedSupplier.category)}
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <p className="text-gray-900">{selectedSupplier.city || 'No especificada'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <p className="text-gray-900">{selectedSupplier.state || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <p className="text-gray-900">{selectedSupplier.zipCode || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <p className="text-gray-900">{selectedSupplier.country || 'No especificado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC/Tax ID
                </label>
                <p className="text-gray-900">{selectedSupplier.taxId || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos de Pago
                </label>
                <p className="text-gray-900">{selectedSupplier.paymentTerms || 'No especificados'}</p>
              </div>
            </div>

            {selectedSupplier.website && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <a 
                  href={selectedSupplier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {selectedSupplier.website}
                </a>
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

            {selectedSupplier.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <p className="text-gray-900">{selectedSupplier.notes}</p>
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