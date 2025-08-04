import React, { useState } from 'react';
import { Plus, Search, Eye, DollarSign, TrendingUp, TrendingDown, Calendar, FileText, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useSalesStore, useAuthStore, useAppStore } from '../store';
import { Transaction, TransactionType } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  category: z.string().min(1, 'La categoría es requerida'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check']),
  reference: z.string().optional(),
  notes: z.string().optional()
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const transactionTypeOptions = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Gasto' }
];

const incomeCategories = [
  { value: 'sales', label: 'Ventas' },
  { value: 'services', label: 'Servicios' },
  { value: 'other_income', label: 'Otros Ingresos' }
];

const expenseCategories = [
  { value: 'inventory', label: 'Inventario' },
  { value: 'rent', label: 'Renta' },
  { value: 'utilities', label: 'Servicios Públicos' },
  { value: 'salaries', label: 'Salarios' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'taxes', label: 'Impuestos' },
  { value: 'other_expenses', label: 'Otros Gastos' }
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'check', label: 'Cheque' }
];

const typeFilterOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Finances: React.FC = () => {
  const { sales } = useSalesStore();
  const { user } = useAuthStore();
  const { transactions, addTransaction } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      paymentMethod: 'cash'
    }
  });

  const watchedType = watch('type');

  // Calculate financial metrics
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  const previousMonthStart = startOfMonth(previousMonth);
  const previousMonthEnd = endOfMonth(previousMonth);

  // Sales revenue
  const currentMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
  });
  
  const previousMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= previousMonthStart && saleDate <= previousMonthEnd;
  });

  const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
  const previousMonthRevenue = previousMonthSales.reduce((sum, sale) => sum + sale.total, 0);
  const revenueGrowth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  // Transactions
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) + currentMonthRevenue;

  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = currentMonthIncome - currentMonthExpenses;
  const profitMargin = currentMonthIncome > 0 ? (netProfit / currentMonthIncome) * 100 : 0;

  // Chart data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(currentMonth, 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= monthStart && saleDate <= monthEnd;
    });
    
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
    
    const revenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) + revenue;
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      month: format(date, 'MMM', { locale: es }),
      income,
      expenses,
      profit: income - expenses
    };
  });

  // Expense categories data
  const expensesByCategory = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const expensePieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: expenseCategories.find(cat => cat.value === category)?.label || category,
    value: amount
  }));

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !typeFilter || transaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleOpenModal = () => {
    reset({
      type: 'expense',
      amount: 0,
      description: '',
      category: '',
      paymentMethod: 'cash',
      reference: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const onSubmit = (data: TransactionFormData) => {
    if (!user) return;

    const transactionData = {
      ...data,
      reference: data.reference || undefined,
      notes: data.notes || undefined,
      userId: user.id,
      user
    };

    addTransaction(transactionData);
    handleCloseModal();
  };

  const getTypeLabel = (type: TransactionType) => {
    return transactionTypeOptions.find(opt => opt.value === type)?.label || type;
  };

  const getCategoryLabel = (category: string, type: TransactionType) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    return paymentMethodOptions.find(opt => opt.value === method)?.label || method;
  };

  const canManage = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Financiero</h1>
          <p className="text-gray-600">Gestiona ingresos, gastos y análisis financiero</p>
        </div>
        {canManage && (
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        )}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">${currentMonthIncome.toLocaleString()}</p>
                <p className={`text-sm ${
                  revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs mes anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gastos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">${currentMonthExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ganancia Neta</p>
                <p className={`text-2xl font-bold ${
                  netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Margen de Ganancia</p>
                <p className={`text-2xl font-bold ${
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos y Gastos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Ingresos"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Gastos"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Ganancia"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría (Mes Actual)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
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
                  placeholder="Buscar por descripción, categoría o referencia..."
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getTypeLabel(transaction.type)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{getCategoryLabel(transaction.category, transaction.type)}</TableCell>
                  <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
                  <TableCell className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{transaction.user.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron transacciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Nueva Transacción"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo *"
              {...register('type')}
              options={transactionTypeOptions}
              error={errors.type?.message}
            />
            <Input
              label="Monto *"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
          </div>

          <Input
            label="Descripción *"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Categoría *"
              {...register('category')}
              options={watchedType === 'income' ? incomeCategories : expenseCategories}
              error={errors.category?.message}
            />
            <Select
              label="Método de Pago *"
              {...register('paymentMethod')}
              options={paymentMethodOptions}
              error={errors.paymentMethod?.message}
            />
          </div>

          <Input
            label="Referencia"
            {...register('reference')}
            error={errors.reference?.message}
            placeholder="Número de factura, cheque, etc."
          />

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
              Crear Transacción
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles de la Transacción"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTransaction.type === 'income' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {getTypeLabel(selectedTransaction.type)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <p className={`text-lg font-bold ${
                  selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <p className="text-gray-900">{selectedTransaction.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <p className="text-gray-900">
                  {getCategoryLabel(selectedTransaction.category, selectedTransaction.type)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <p className="text-gray-900">
                  {getPaymentMethodLabel(selectedTransaction.paymentMethod)}
                </p>
              </div>
            </div>

            {selectedTransaction.reference && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <p className="text-gray-900">{selectedTransaction.reference}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <p className="text-gray-900">{selectedTransaction.user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <p className="text-gray-900">
                  {format(new Date(selectedTransaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            {selectedTransaction.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <p className="text-gray-900">{selectedTransaction.notes}</p>
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
    </div>
  );
};

export default Finances;