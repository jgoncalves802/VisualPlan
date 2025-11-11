import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuthStore } from '../store';
import supabase from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUsuario } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Autenticação com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      if (data.user) {
        // Buscar dados completos do usuário
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*, empresa:empresas(*)')
          .eq('email', email)
          .single();

        if (userError) throw userError;

        setUsuario(userData);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            VisionPlan
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Plataforma Integrada de Gestão de Obras 4D/LPS
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Bem-vindo
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Faça login para continuar
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-danger bg-opacity-10 border border-danger">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Lembrar-me
                </span>
              </label>
              <button
                type="button"
                className="text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Entrar
            </Button>

            <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/cadastro')}
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8" style={{ color: 'var(--color-text-secondary)' }}>
          © 2024 VisionPlan. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
