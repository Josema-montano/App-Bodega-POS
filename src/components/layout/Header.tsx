import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAppStore } from '../../store';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu size={20} />
          </Button>
          
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema POS - Bodega de Vinos
            </h1>
          </div>
        </div>
        
        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos, clientes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A3C] focus:border-[#8B5A3C]"
            />
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="outline" size="sm">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
          
          {/* Current time */}
          <div className="hidden sm:block text-sm text-gray-600">
            {new Date().toLocaleString('es-ES', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </header>
  );
};