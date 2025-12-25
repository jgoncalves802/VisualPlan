import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTemaStore } from '../stores/temaStore';
import { CamadaGovernanca, PerfilAcesso } from '../types';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';
import { supabase } from '../services/supabase';

const isDevelopment = import.meta.env.DEV;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { tema } = useTemaStore();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevLogin = () => {
    const devUsuario = {
      id: '577dc497-7e83-46df-ba35-e082ee5ee7ca',
      nome: 'Administrador',
      email: 'admin@visionplan.com',
      ativo: true,
      empresaId: 'a0000001-0000-0000-0000-000000000001',
      camadaGovernanca: CamadaGovernanca.PROPONENTE,
      perfilAcesso: PerfilAcesso.ADMIN,
      avatarUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    login(devUsuario, 'dev-token');
    navigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isDevelopment && email === 'admin@visionplan.com' && senha === 'admin123') {
      handleDevLogin();
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao autenticar usuário');
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        setError('Usuário não encontrado no sistema');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!userData.ativo) {
        setError('Usuário desativado. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const usuario = {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        ativo: userData.ativo,
        empresaId: userData.empresa_id,
        camadaGovernanca: userData.camada_governanca as CamadaGovernanca,
        perfilAcesso: userData.perfil_acesso as PerfilAcesso,
        avatarUrl: userData.avatar_url,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      };

      login(usuario, authData.session?.access_token || '');
      navigate('/dashboard');
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-in-up">
          <div 
            className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: tema.primary }}
          >
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold theme-text">VisionPlan</h1>
          <p className="theme-text-secondary text-sm mt-2">
            Plataforma Integrada de Gestão de Obras
          </p>
        </div>

        {/* Login Form */}
        <div className="card animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold theme-text mb-6">Entrar</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="theme-text-secondary" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="theme-text-secondary" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border theme-border-primary rounded-lg focus:outline-none focus:ring-2"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded" />
                <span className="ml-2 text-sm theme-text-secondary">
                  Lembrar-me
                </span>
              </label>
              <a 
                href="#" 
                className="text-sm font-medium"
                style={{ color: tema.primary }}
              >
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center space-x-2 py-3"
              style={{ backgroundColor: tema.primary }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm theme-text-secondary">
              Não tem uma conta?{' '}
              <a href="#" className="font-medium" style={{ color: tema.primary }}>
                Fale com o administrador
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs theme-text-secondary mt-8">
          VisionPlan v2.2 - © 2024 Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
