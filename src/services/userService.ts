import { supabase } from './supabase';
import { Usuario, CamadaGovernanca, PerfilAcesso } from '../types';

export interface CreateUserDTO {
  nome: string;
  email: string;
  senha: string;
  empresaId: string;
  camadaGovernanca: CamadaGovernanca;
  perfilAcesso: PerfilAcesso;
  avatarUrl?: string;
}

export interface UpdateUserDTO {
  nome?: string;
  camadaGovernanca?: CamadaGovernanca;
  perfilAcesso?: PerfilAcesso;
  ativo?: boolean;
  avatarUrl?: string;
}

export interface UserFilter {
  empresaId?: string;
  camadaGovernanca?: CamadaGovernanca;
  perfilAcesso?: PerfilAcesso;
  ativo?: boolean;
  search?: string;
}

export const userService = {
  async getAll(filter?: UserFilter): Promise<{ data: Usuario[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (filter?.empresaId) {
        query = query.eq('empresa_id', filter.empresaId);
      }
      if (filter?.camadaGovernanca) {
        query = query.eq('camada_governanca', filter.camadaGovernanca);
      }
      if (filter?.perfilAcesso) {
        query = query.eq('perfil_acesso', filter.perfilAcesso);
      }
      if (filter?.ativo !== undefined) {
        query = query.eq('ativo', filter.ativo);
      }
      if (filter?.search) {
        query = query.or(`nome.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const usuarios: Usuario[] = (data || []).map(row => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        ativo: row.ativo,
        empresaId: row.empresa_id,
        camadaGovernanca: row.camada_governanca as CamadaGovernanca,
        perfilAcesso: row.perfil_acesso as PerfilAcesso,
        avatarUrl: row.avatar_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return { data: usuarios, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async getById(id: string): Promise<{ data: Usuario | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const usuario: Usuario = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        ativo: data.ativo,
        empresaId: data.empresa_id,
        camadaGovernanca: data.camada_governanca as CamadaGovernanca,
        perfilAcesso: data.perfil_acesso as PerfilAcesso,
        avatarUrl: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { data: usuario, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async create(userData: CreateUserDTO): Promise<{ data: Usuario | null; error: Error | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
        options: {
          data: {
            nome: userData.nome,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está registrado no sistema');
        }
        throw authError;
      }
      if (!authData.user) throw new Error('Erro ao criar usuário na autenticação');

      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome: userData.nome,
          email: userData.email,
          empresa_id: userData.empresaId,
          camada_governanca: userData.camadaGovernanca,
          perfil_acesso: userData.perfilAcesso,
          avatar_url: userData.avatarUrl,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      const usuario: Usuario = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        ativo: data.ativo,
        empresaId: data.empresa_id,
        camadaGovernanca: data.camada_governanca as CamadaGovernanca,
        perfilAcesso: data.perfil_acesso as PerfilAcesso,
        avatarUrl: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { data: usuario, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async update(id: string, updates: UpdateUserDTO): Promise<{ data: Usuario | null; error: Error | null }> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.camadaGovernanca !== undefined) updateData.camada_governanca = updates.camadaGovernanca;
      if (updates.perfilAcesso !== undefined) updateData.perfil_acesso = updates.perfilAcesso;
      if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const usuario: Usuario = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        ativo: data.ativo,
        empresaId: data.empresa_id,
        camadaGovernanca: data.camada_governanca as CamadaGovernanca,
        perfilAcesso: data.perfil_acesso as PerfilAcesso,
        avatarUrl: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return { data: usuario, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async toggleActive(id: string, ativo: boolean): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
};

export const CAMADA_GOVERNANCA_LABELS: Record<CamadaGovernanca, string> = {
  [CamadaGovernanca.PROPONENTE]: 'Proponente',
  [CamadaGovernanca.FISCALIZACAO]: 'Fiscalização',
  [CamadaGovernanca.CONTRATADA]: 'Contratada',
};

export const PERFIL_ACESSO_LABELS: Record<PerfilAcesso, string> = {
  [PerfilAcesso.ADMIN]: 'Administrador',
  [PerfilAcesso.DIRETOR]: 'Diretor',
  [PerfilAcesso.GERENTE_PROJETO]: 'Gerente de Projeto',
  [PerfilAcesso.ENGENHEIRO_PLANEJAMENTO]: 'Engenheiro de Planejamento',
  [PerfilAcesso.COORDENADOR_OBRA]: 'Coordenador de Obra',
  [PerfilAcesso.MESTRE_OBRAS]: 'Mestre de Obras',
  [PerfilAcesso.ENCARREGADO]: 'Encarregado',
  [PerfilAcesso.COLABORADOR]: 'Colaborador',
  [PerfilAcesso.FISCALIZACAO_LEAD]: 'Líder de Fiscalização',
  [PerfilAcesso.FISCALIZACAO_TECNICO]: 'Técnico de Fiscalização',
};

export const PERFIS_POR_CAMADA: Record<CamadaGovernanca, PerfilAcesso[]> = {
  [CamadaGovernanca.PROPONENTE]: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.DIRETOR,
    PerfilAcesso.GERENTE_PROJETO,
  ],
  [CamadaGovernanca.FISCALIZACAO]: [
    PerfilAcesso.FISCALIZACAO_LEAD,
    PerfilAcesso.FISCALIZACAO_TECNICO,
  ],
  [CamadaGovernanca.CONTRATADA]: [
    PerfilAcesso.ENGENHEIRO_PLANEJAMENTO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.MESTRE_OBRAS,
    PerfilAcesso.ENCARREGADO,
    PerfilAcesso.COLABORADOR,
  ],
};

export default userService;
