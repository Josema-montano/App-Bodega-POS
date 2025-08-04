import React, { useState } from 'react';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useAppStore, useAuthStore } from '../store';
import { Notification, NotificationType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const typeFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'info', label: 'Información' },
  { value: 'warning', label: 'Advertencia' },
  { value: 'error', label: 'Error' },
  { value: 'success', label: 'Éxito' }
];

const statusFilterOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'unread', label: 'No leídas' },
  { value: 'read', label: 'Leídas' }
];

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } = useAppStore();
  const { user } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = !typeFilter || notification.type === typeFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'read' && notification.read) ||
      (statusFilter === 'unread' && !notification.read);
    
    return matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayNotifications = notifications.filter(n => {
    const today = new Date();
    const notificationDate = new Date(n.createdAt);
    return notificationDate.toDateString() === today.toDateString();
  }).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    const opacity = read ? '50' : '100';
    switch (type) {
      case 'info':
        return `bg-blue-${opacity} border-blue-200`;
      case 'warning':
        return `bg-yellow-${opacity} border-yellow-200`;
      case 'error':
        return `bg-red-${opacity} border-red-200`;
      case 'success':
        return `bg-green-${opacity} border-green-200`;
      default:
        return `bg-gray-${opacity} border-gray-200`;
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    const typeMap = {
      info: 'Información',
      warning: 'Advertencia',
      error: 'Error',
      success: 'Éxito'
    };
    return typeMap[type] || type;
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (notification: Notification) => {
    markNotificationAsRead(notification.id);
  };

  const handleDelete = (notification: Notification) => {
    deleteNotification(notification.id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setIsClearAllModalOpen(false);
  };

  const canManage = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">Gestiona y revisa todas las notificaciones del sistema</p>
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          {canManage && notifications.length > 0 && (
            <Button variant="danger" onClick={() => setIsClearAllModalOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar todas
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Notificaciones</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No Leídas</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayNotifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={typeFilterOptions}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusFilterOptions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificaciones ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay notificaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                  }`}
                  onClick={() => handleViewNotification(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            notification.type === 'success' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getTypeLabel(notification.type)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification);
                          }}
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification);
                          }}
                          title="Eliminar notificación"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Notification Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles de la Notificación"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(selectedNotification.type)}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedNotification.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedNotification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                  selectedNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  selectedNotification.type === 'error' ? 'bg-red-100 text-red-800' :
                  selectedNotification.type === 'success' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getTypeLabel(selectedNotification.type)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <p className="text-gray-900">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedNotification.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedNotification.read 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedNotification.read ? 'Leída' : 'No leída'}
                </span>
              </div>
            </div>

            {selectedNotification.data && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datos Adicionales
                </label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </pre>
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

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Confirmar Limpieza"
      >
        <p className="text-gray-600 mb-4">
          ¿Estás seguro de que deseas eliminar todas las notificaciones?
          Esta acción no se puede deshacer.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsClearAllModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleClearAll}
          >
            Eliminar Todas
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};