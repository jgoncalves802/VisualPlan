import { supabase } from './supabase';

export interface EpsCreator {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    perfilAcesso: string;
  };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssignResponsible: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EpsCreatorDB {
  id: string;
  empresa_id: string;
  usuario_id: string;
  usuarios?: {
    id: string;
    nome: string;
    email: string;
    perfil_acesso: string;
  };
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_assign_responsible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const mapFromDB = (creator: EpsCreatorDB): EpsCreator => ({
  id: creator.id,
  empresaId: creator.empresa_id,
  usuarioId: creator.usuario_id,
  usuario: creator.usuarios ? {
    id: creator.usuarios.id,
    nome: creator.usuarios.nome,
    email: creator.usuarios.email,
    perfilAcesso: creator.usuarios.perfil_acesso,
  } : undefined,
  canCreate: creator.can_create,
  canEdit: creator.can_edit,
  canDelete: creator.can_delete,
  canAssignResponsible: creator.can_assign_responsible,
  createdBy: creator.created_by,
  createdAt: creator.created_at,
  updatedAt: creator.updated_at,
});

export const epsCreatorService = {
  async getByEmpresa(empresaId: string): Promise<EpsCreator[]> {
    const { data, error } = await supabase
      .from('eps_creators')
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching EPS creators:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async create(data: {
    empresaId: string;
    usuarioId: string;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canAssignResponsible?: boolean;
  }): Promise<EpsCreator> {
    const { data: userData } = await supabase.auth.getUser();

    const { data: creator, error } = await supabase
      .from('eps_creators')
      .insert({
        empresa_id: data.empresaId,
        usuario_id: data.usuarioId,
        can_create: data.canCreate ?? true,
        can_edit: data.canEdit ?? true,
        can_delete: data.canDelete ?? true,
        can_assign_responsible: data.canAssignResponsible ?? true,
        created_by: userData?.user?.id || null,
      })
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        )
      `)
      .single();

    if (error) {
      console.error('Error creating EPS creator:', error);
      throw error;
    }

    return mapFromDB(creator);
  },

  async update(id: string, data: Partial<{
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssignResponsible: boolean;
  }>): Promise<EpsCreator> {
    const updateData: Record<string, unknown> = {};
    if (data.canCreate !== undefined) updateData.can_create = data.canCreate;
    if (data.canEdit !== undefined) updateData.can_edit = data.canEdit;
    if (data.canDelete !== undefined) updateData.can_delete = data.canDelete;
    if (data.canAssignResponsible !== undefined) updateData.can_assign_responsible = data.canAssignResponsible;

    const { data: creator, error } = await supabase
      .from('eps_creators')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        )
      `)
      .single();

    if (error) {
      console.error('Error updating EPS creator:', error);
      throw error;
    }

    return mapFromDB(creator);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('eps_creators')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting EPS creator:', error);
      throw error;
    }
  },

  async isCreator(empresaId: string, usuarioId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('eps_creators')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  },

  async getCreatorPermissions(empresaId: string, usuarioId: string): Promise<{
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssignResponsible: boolean;
  } | null> {
    const { data, error } = await supabase
      .from('eps_creators')
      .select('can_create, can_edit, can_delete, can_assign_responsible')
      .eq('empresa_id', empresaId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      canCreate: data.can_create,
      canEdit: data.can_edit,
      canDelete: data.can_delete,
      canAssignResponsible: data.can_assign_responsible,
    };
  },
};
