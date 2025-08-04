import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Truck,
  DollarSign,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Wine
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { cn } from '../../lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['admin', 'worker', 'distributor']
  },
  {
    name: 'Inventario',
    href: '/inventory',
    icon: Package,
    roles: ['admin', 'worker']
  },
  {
    name: 'Ventas',
    href: '/sales',
    icon: ShoppingCart,
    roles: ['admin', 'worker', 'distributor']
  },
  {
    name: 'Clientes',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'worker']
  },
  {
    name: 'Proveedores',
    href: '/suppliers',
    icon: Truck,
    roles: ['admin']
  },
  {
    name: 'Finanzas',
    href: '/finances',
    icon: DollarSign,
    roles: ['admin']
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin']
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'worker', 'distributor']
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    roles: ['admin']
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const filteredItems = sidebarItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-[#8B5A3C]">
            <div className="flex items-center space-x-2">
              <Wine className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Bodega POS</span>
            </div>
          </div>
          
          {/* User info */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#8B5A3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-[#8B5A3C] text-white'
                      : 'text-gray-700 hover:bg-[#F4F1E8] hover:text-[#8B5A3C]'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};