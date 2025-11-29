import { supabase } from './supabase';

export interface WbsEditor {
  id: string;
  empresaId: string;
  epsNodeId: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    perfilAcesso: string;
  };
  epsNode?: {
    id: string;
    nome: string;
    codigo: string;
  };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WbsEditorDB {
  id: string;
  empresa_id: string;
  eps_node_id: string;
  usuario_id: string;
  usuarios?: {
    id: string;
    nome: string;
    email: string;
    perfil_acesso: string;
  };
  eps_nodes?: {
    id: string;
    nome: string;
    codigo: string;
  };
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const mapFromDB = (editor: WbsEditorDB): WbsEditor => ({
  id: editor.id,
  empresaId: editor.empresa_id,
  epsNodeId: editor.eps_node_id,
  usuarioId: editor.usuario_id,
  usuario: editor.usuarios ? {
    id: editor.usuarios.id,
    nome: editor.usuarios.nome,
    email: editor.usuarios.email,
    perfilAcesso: editor.usuarios.perfil_acesso,
  } : undefined,
  epsNode: editor.eps_nodes ? {
    id: editor.eps_nodes.id,
    nome: editor.eps_nodes.nome,
    codigo: editor.eps_nodes.codigo,
  } : undefined,
  canCreate: editor.can_create,
  canEdit: editor.can_edit,
  canDelete: editor.can_delete,
  createdBy: editor.created_by,
  createdAt: editor.created_at,
  updatedAt: editor.updated_at,
});

export const wbsEditorService = {
  async getByEmpresa(empresaId: string): Promise<WbsEditor[]> {
    const { data, error } = await supabase
      .from('wbs_editors')
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        eps_nodes:eps_node_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching WBS editors:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByProject(epsNodeId: string): Promise<WbsEditor[]> {
    const { data, error } = await supabase
      .from('wbs_editors')
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        eps_nodes:eps_node_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('eps_node_id', epsNodeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching WBS editors for project:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async create(data: {
    empresaId: string;
    epsNodeId: string;
    usuarioId: string;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  }): Promise<WbsEditor> {
    const { data: userData } = await supabase.auth.getUser();

    const { data: editor, error } = await supabase
      .from('wbs_editors')
      .insert({
        empresa_id: data.empresaId,
        eps_node_id: data.epsNodeId,
        usuario_id: data.usuarioId,
        can_create: data.canCreate ?? true,
        can_edit: data.canEdit ?? true,
        can_delete: data.canDelete ?? true,
        created_by: userData?.user?.id || null,
      })
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        eps_nodes:eps_node_id (
          id,
          nome,
          codigo
        )
      `)
      .single();

    if (error) {
      console.error('Error creating WBS editor:', error);
      throw error;
    }

    return mapFromDB(editor);
  },

  async update(id: string, data: Partial<{
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>): Promise<WbsEditor> {
    const updateData: Record<string, unknown> = {};
    if (data.canCreate !== undefined) updateData.can_create = data.canCreate;
    if (data.canEdit !== undefined) updateData.can_edit = data.canEdit;
    if (data.canDelete !== undefined) updateData.can_delete = data.canDelete;

    const { data: editor, error } = await supabase
      .from('wbs_editors')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        eps_nodes:eps_node_id (
          id,
          nome,
          codigo
        )
      `)
      .single();

    if (error) {
      console.error('Error updating WBS editor:', error);
      throw error;
    }

    return mapFromDB(editor);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('wbs_editors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting WBS editor:', error);
      throw error;
    }
  },

  async isEditor(epsNodeId: string, usuarioId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wbs_editors')
      .select('id')
      .eq('eps_node_id', epsNodeId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  },

  async getEditorPermissions(epsNodeId: string, usuarioId: string): Promise<{
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  } | null> {
    const { data, error } = await supabase
      .from('wbs_editors')
      .select('can_create, can_edit, can_delete')
      .eq('eps_node_id', epsNodeId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      canCreate: data.can_create,
      canEdit: data.can_edit,
      canDelete: data.can_delete,
    };
  },

  async getVisibleProjects(empresaId: string): Promise<{
    epsId: string;
    visibilityReason: string;
  }[]> {
    const { data, error } = await supabase
      .rpc('get_visible_eps_projects', { p_empresa_id: empresaId });

    if (error) {
      console.error('Error fetching visible projects:', error);
      throw error;
    }

    return (data || []).map((row: { eps_id: string; visibility_reason: string }) => ({
      epsId: row.eps_id,
      visibilityReason: row.visibility_reason,
    }));
  },

  async canEditWbs(epsNodeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_edit_wbs', { p_eps_node_id: epsNodeId });

    if (error) {
      console.error('Error checking WBS edit permission:', error);
      return false;
    }

    return data === true;
  },

  async canCreateWbs(epsNodeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_create_wbs', { p_eps_node_id: epsNodeId });

    if (error) {
      console.error('Error checking WBS create permission:', error);
      return false;
    }

    return data === true;
  },

  async canDeleteWbs(epsNodeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_delete_wbs', { p_eps_node_id: epsNodeId });

    if (error) {
      console.error('Error checking WBS delete permission:', error);
      return false;
    }

    return data === true;
  },
};
