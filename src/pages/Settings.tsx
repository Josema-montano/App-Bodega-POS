import React, { useState } from 'react';
import { Save, User, Lock, Bell, Globe, Database, Shield, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuthStore, useAppStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  position: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

const systemSchema = z.object({
  companyName: z.string().min(1, 'El nombre de la empresa es requerido'),
  currency: z.string().min(1, 'La moneda es requerida'),
  timezone: z.string().min(1, 'La zona horaria es requerida'),
  language: z.string().min(1, 'El idioma es requerido'),
  taxRate: z.number().min(0).max(100, 'La tasa de impuesto debe estar entre 0 y 100'),
  lowStockThreshold: z.number().min(1, 'El umbral de stock bajo debe ser mayor a 0')
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SystemFormData = z.infer<typeof systemSchema>;

const currencyOptions = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' }
];

const timezoneOptions = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
];

const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' }
];

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || ''
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const systemForm = useForm<SystemFormData>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      companyName: settings.companyName,
      currency: settings.currency,
      timezone: settings.timezone,
      language: settings.language,
      taxRate: settings.taxRate,
      lowStockThreshold: settings.lowStockThreshold
    }
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    if (!user) return;
    
    updateProfile({
      ...data,
      phone: data.phone || undefined,
      position: data.position || undefined
    });
    
    toast.success('Perfil actualizado correctamente');
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    // En una aplicación real, aquí se validaría la contraseña actual
    // y se actualizaría en el backend
    console.log('Cambio de contraseña:', data);
    
    passwordForm.reset();
    toast.success('Contraseña actualizada correctamente');
  };

  const onSystemSubmit = (data: SystemFormData) => {
    updateSettings(data);
    toast.success('Configuración del sistema actualizada');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'system', label: 'Sistema', icon: Database }
  ];

  const canManageSystem = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Gestiona tu perfil y configuraciones del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo *"
                  {...profileForm.register('name')}
                  error={profileForm.formState.errors.name?.message}
                />
                <Input
                  label="Email *"
                  type="email"
                  {...profileForm.register('email')}
                  error={profileForm.formState.errors.email?.message}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  {...profileForm.register('phone')}
                  error={profileForm.formState.errors.phone?.message}
                />
                <Input
                  label="Cargo/Posición"
                  {...profileForm.register('position')}
                  error={profileForm.formState.errors.position?.message}
                />
              </div>

              <div className="pt-4">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Cambiar Contraseña
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <Input
                  label="Contraseña Actual *"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  error={passwordForm.formState.errors.currentPassword?.message}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nueva Contraseña *"
                    type="password"
                    {...passwordForm.register('newPassword')}
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                  <Input
                    label="Confirmar Nueva Contraseña *"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit">
                    <Shield className="h-4 w-4 mr-2" />
                    Actualizar Contraseña
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Rol de Usuario</h4>
                    <p className="text-sm text-gray-600">Tu nivel de acceso en el sistema</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user?.role === 'worker' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user?.role === 'admin' ? 'Administrador' :
                     user?.role === 'worker' ? 'Trabajador' : 'Distribuidor'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Último Acceso</h4>
                    <p className="text-sm text-gray-600">Fecha de tu última sesión</p>
                  </div>
                  <span className="text-sm text-gray-900">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Primera vez'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Preferencias de Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Notificaciones del Sistema</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Stock bajo en inventario</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nuevas ventas realizadas</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Productos próximos a vencer</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Reportes financieros semanales</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Resumen diario de ventas</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Alertas críticas del sistema</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Preferencias
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {canManageSystem ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Configuración del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre de la Empresa *"
                        {...systemForm.register('companyName')}
                        error={systemForm.formState.errors.companyName?.message}
                      />
                      <Select
                        label="Moneda *"
                        {...systemForm.register('currency')}
                        options={currencyOptions}
                        error={systemForm.formState.errors.currency?.message}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Zona Horaria *"
                        {...systemForm.register('timezone')}
                        options={timezoneOptions}
                        error={systemForm.formState.errors.timezone?.message}
                      />
                      <Select
                        label="Idioma *"
                        {...systemForm.register('language')}
                        options={languageOptions}
                        error={systemForm.formState.errors.language?.message}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Tasa de Impuesto (%) *"
                        type="number"
                        step="0.01"
                        {...systemForm.register('taxRate', { valueAsNumber: true })}
                        error={systemForm.formState.errors.taxRate?.message}
                      />
                      <Input
                        label="Umbral de Stock Bajo *"
                        type="number"
                        {...systemForm.register('lowStockThreshold', { valueAsNumber: true })}
                        error={systemForm.formState.errors.lowStockThreshold?.message}
                      />
                    </div>

                    <div className="pt-4">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Configuración
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Personalización
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema de Color
                      </label>
                      <div className="flex space-x-3">
                        <button className="w-8 h-8 rounded-full bg-blue-500 border-2 border-blue-600"></button>
                        <button className="w-8 h-8 rounded-full bg-green-500 border-2 border-transparent hover:border-green-600"></button>
                        <button className="w-8 h-8 rounded-full bg-purple-500 border-2 border-transparent hover:border-purple-600"></button>
                        <button className="w-8 h-8 rounded-full bg-red-500 border-2 border-transparent hover:border-red-600"></button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Modo oscuro</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Animaciones de interfaz</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-gray-600">
                  Solo los administradores pueden acceder a la configuración del sistema.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};