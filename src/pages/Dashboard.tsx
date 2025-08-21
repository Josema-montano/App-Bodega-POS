import React, { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore, useProductsStore, useCustomersStore, useSalesStore, useAppStore, useTransactionsStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';



export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { products, getLowStockProducts, fetchProducts, loading: productsLoading } = useProductsStore();
  const { customers, fetchCustomers, loading: customersLoading } = useCustomersStore();
  const { sales, getTodaySales, fetchSales, loading: salesLoading } = useSalesStore();
  const { notifications } = useAppStore();
  const { transactions } = useTransactionsStore();

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchCustomers(),
          fetchSales()
        ]);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };

    loadInitialData();
  }, []); // Remover las dependencias que causan el loop infinito

  const lowStockProducts = getLowStockProducts();
  const todaySales = getTodaySales();
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const unreadNotifications = notifications.filter(n => !n.read);

  // Calcular datos de hoy
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  const todayTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    return transactionDate >= startOfDay && transactionDate <= endOfDay;
  });

  // Datos reales para gráficos de hoy
  const todayData = [{
    name: 'Hoy',
    ventas: todaySales.length,
    ingresos: todayRevenue
  }];

  // Calcular productos más vendidos de hoy
  const productSales = todaySales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const productName = products.find(p => p.id === item.productId)?.name || 'Producto desconocido';
      if (!acc[item.productId]) {
        acc[item.productId] = {
          name: productName,
          sales: 0,
          revenue: 0
        };
      }
      acc[item.productId].sales += item.quantity;
      acc[item.productId].revenue += item.quantity * item.unitPrice;
    });
    return acc;
  }, {} as Record<string, { name: string; sales: number; revenue: number }>);

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  const stats = [
    {
      title: 'Ventas Hoy',
      value: todaySales.length.toString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Ingresos Hoy',
      value: `$${todayRevenue.toLocaleString()}`,
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Productos',
      value: products.length.toString(),
      change: `${lowStockProducts.length} bajo stock`,
      changeType: lowStockProducts.length > 0 ? 'negative' : 'neutral' as const,
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      title: 'Clientes',
      value: customers.length.toString(),
      change: '+3 este mes',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#8B5A3C] to-[#2D5A27] rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user?.name}!
        </h1>
        <p className="opacity-90">
          Aquí tienes un resumen de tu bodega para hoy, {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={`stat-${stat.title}-${stat.value}-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.changeType === 'positive' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                    {stat.changeType === 'negative' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                    <span className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#8B5A3C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Ingresos']} />
                <Line type="monotone" dataKey="ingresos" stroke="#2D5A27" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-600">No hay ventas registradas hoy</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={`top-product-${product.name}-${product.sales}-${index}`} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-600">¡Todos los productos tienen stock suficiente!</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-red-600">Stock: N/A</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Reabastecer
                    </Button>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-sm text-gray-600">
                    +{lowStockProducts.length - 5} productos más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              Notificaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unreadNotifications.length === 0 ? (
              <p className="text-gray-600">No hay notificaciones nuevas</p>
            ) : (
              <div className="space-y-3">
                {unreadNotifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.createdAt.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Nueva Venta</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Package className="h-6 w-6" />
              <span>Agregar Producto</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Nuevo Cliente</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <DollarSign className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};