import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store';
import { useSupabaseInit, useSupabaseAuth } from './hooks/useSupabaseInit';
import { useNotifications } from './hooks/useNotifications';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Finances } from './pages/Finances';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  // Inicializar autenticación con Supabase
  useSupabaseAuth();
  // Inicializar datos cuando esté autenticado
  useSupabaseInit();
  // Inicializar notificaciones
  useNotifications();
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/suppliers" 
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/finances" 
            element={
              <ProtectedRoute>
                <Finances />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #E5E7EB'
            }
          }}
        />
      </div>
    </Router>
  );
}
