import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Administrador', email: 'admin@bodega.com', password: 'admin123' },
    { role: 'Trabajador', email: 'worker@bodega.com', password: 'worker123' },
    { role: 'Distribuidor', email: 'distributor@bodega.com', password: 'dist123' }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B5A3C] to-[#2D5A27] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Wine className="h-8 w-8 text-[#8B5A3C]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bodega POS</h1>
          <p className="text-[#F4F1E8] opacity-90">Sistema de Gestión para Bodegas de Vino</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Iniciar Sesión
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Credenciales de Demo:</h3>
              <div className="space-y-2">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    onClick={() => fillCredentials(cred.email, cred.password)}
                    className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                  >
                    <div className="font-medium text-gray-900">{cred.role}</div>
                    <div className="text-gray-600">{cred.email} / {cred.password}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};