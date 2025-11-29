import { supabase } from './supabase';

export interface UserObsAssignment {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    perfilAcesso: string;
  };
  obsNodeId: string;
  obsNode?: {
    id: string;
    nome: string;
    codigo: string | null;
  };
  profileId: string | null;
  profile?: {
    id: string;
    nome: string;
  } | null;
  isPrimary: boolean;
  createdBy: string | null;
  createdAt: string;
}

interface UserObsAssignmentDB {
  id: string;
  empresa_id: string;
  usuario_id: string;
  usuarios?: {
    id: string;
    nome: string;
    email: string;
    perfil_acesso: string;
  };
  obs_node_id: string;
  obs_nodes?: {
    id: string;
    nome: string;
    codigo: string | null;
  };
  profile_id: string | null;
  access_profiles?: {
    id: string;
    nome: string;
  } | null;
  is_primary: boolean;
  created_by: string | null;
  created_at: string;
}

const mapFromDB = (assignment: UserObsAssignmentDB): UserObsAssignment => ({
  id: assignment.id,
  empresaId: assignment.empresa_id,
  usuarioId: assignment.usuario_id,
  usuario: assignment.usuarios ? {
    id: assignment.usuarios.id,
    nome: assignment.usuarios.nome,
    email: assignment.usuarios.email,
    perfilAcesso: assignment.usuarios.perfil_acesso,
  } : undefined,
  obsNodeId: assignment.obs_node_id,
  obsNode: assignment.obs_nodes ? {
    id: assignment.obs_nodes.id,
    nome: assignment.obs_nodes.nome,
    codigo: assignment.obs_nodes.codigo,
  } : undefined,
  profileId: assignment.profile_id,
  profile: assignment.access_profiles ? {
    id: assignment.access_profiles.id,
    nome: assignment.access_profiles.nome,
  } : null,
  isPrimary: assignment.is_primary,
  createdBy: assignment.created_by,
  createdAt: assignment.created_at,
});

export const userObsAssignmentService = {
  async getByEmpresa(empresaId: string): Promise<UserObsAssignment[]> {
    const { data, error } = await supabase
      .from('usuario_obs_assignments')
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        obs_nodes:obs_node_id (
          id,
          nome,
          codigo
        ),
        access_profiles:profile_id (
          id,
          nome
        )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user OBS assignments:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByUser(usuarioId: string): Promise<UserObsAssignment[]> {
    const { data, error } = await supabase
      .from('usuario_obs_assignments')
      .select(`
        *,
        obs_nodes:obs_node_id (
          id,
          nome,
          codigo
        ),
        access_profiles:profile_id (
          id,
          nome
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching assignments for user:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByObsNode(obsNodeId: string): Promise<UserObsAssignment[]> {
    const { data, error } = await supabase
      .from('usuario_obs_assignments')
      .select(`
        *,
        usuarios:usuario_id (
          id,
          nome,
          email,
          perfil_acesso
        ),
        access_profiles:profile_id (
          id,
          nome
        )
      `)
      .eq('obs_node_id', obsNodeId);

    if (error) {
      console.error('Error fetching assignments for OBS node:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async create(data: {
    empresaId: string;
    usuarioId: string;
    obsNodeId: string;
    profileId?: string | null;
    isPrimary?: boolean;
  }): Promise<UserObsAssignment> {
    const { data: userData } = await supabase.auth.getUser();

    if (data.isPrimary) {
      await supabase
        .from('usuario_obs_assignments')
        .update({ is_primary: false })
        .eq('empresa_id', data.empresaId)
        .eq('usuario_id', data.usuarioId);
    }

    const { data: assignment, error } = await supabase
      .from('usuario_obs_assignments')
      .insert({
        empresa_id: data.empresaId,
        usuario_id: data.usuarioId,
        obs_node_id: data.obsNodeId,
        profile_id: data.profileId || null,
        is_primary: data.isPrimary ?? false,
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
        obs_nodes:obs_node_id (
          id,
          nome,
          codigo
        ),
        access_profiles:profile_id (
          id,
          nome
        )
      `)
      .single();

    if (error) {
      console.error('Error creating user OBS assignment:', error);
      throw error;
    }

    return mapFromDB(assignment);
  },

  async update(id: string, data: Partial<{
    obsNodeId: string;
    profileId: string | null;
    isPrimary: boolean;
  }>): Promise<UserObsAssignment> {
    const updateData: Record<string, unknown> = {};
    if (data.obsNodeId !== undefined) updateData.obs_node_id = data.obsNodeId;
    if (data.profileId !== undefined) updateData.profile_id = data.profileId;
    if (data.isPrimary !== undefined) updateData.is_primary = data.isPrimary;

    if (data.isPrimary === true) {
      const { data: current } = await supabase
        .from('usuario_obs_assignments')
        .select('empresa_id, usuario_id')
        .eq('id', id)
        .single();

      if (current) {
        await supabase
          .from('usuario_obs_assignments')
          .update({ is_primary: false })
          .eq('empresa_id', current.empresa_id)
          .eq('usuario_id', current.usuario_id)
          .neq('id', id);
      }
    }

    const { data: assignment, error } = await supabase
      .from('usuario_obs_assignments')
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
        obs_nodes:obs_node_id (
          id,
          nome,
          codigo
        ),
        access_profiles:profile_id (
          id,
          nome
        )
      `)
      .single();

    if (error) {
      console.error('Error updating user OBS assignment:', error);
      throw error;
    }

    return mapFromDB(assignment);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('usuario_obs_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user OBS assignment:', error);
      throw error;
    }
  },

  async setPrimary(id: string): Promise<UserObsAssignment> {
    return this.update(id, { isPrimary: true });
  },

  async hasObsAssignment(usuarioId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('usuario_obs_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('Error checking user OBS assignment:', error);
      return false;
    }

    return (count || 0) > 0;
  },

  async getUsersWithoutObsAssignment(empresaId: string): Promise<{ id: string; nome: string; email: string }[]> {
    const { data: allUsers, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (usersError || !allUsers) {
      return [];
    }

    const { data: assignments } = await supabase
      .from('usuario_obs_assignments')
      .select('usuario_id')
      .eq('empresa_id', empresaId);

    const assignedUserIds = new Set((assignments || []).map(a => a.usuario_id));

    return allUsers.filter(u => !assignedUserIds.has(u.id));
  },
};
