import { supabase } from './supabase';

export interface Permission {
  permissionCode: string;
  module: string;
  action: string;
  description: string | null;
  defaultLevel: string;
}

export interface AccessProfile {
  id: string;
  empresaId: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  camadaGovernanca: string | null;
  cor: string;
  icone: string;
  isDefault: boolean;
  isSystem: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: ProfilePermission[];
}

export interface ProfilePermission {
  id: string;
  profileId: string;
  permissionCode: string;
  nivel: 'none' | 'read' | 'write' | 'admin';
  scope: Record<string, unknown>;
  permission?: Permission;
}

export interface UserProfile {
  id: string;
  usuarioId: string;
  profileId: string;
  obsNodeId: string | null;
  isPrimary: boolean;
  assignedBy: string | null;
  assignedAt: string;
  validFrom: string;
  validUntil: string | null;
  ativo: boolean;
  profile?: AccessProfile;
}

interface AccessProfileDB {
  id: string;
  empresa_id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  camada_governanca: string | null;
  cor: string;
  icone: string;
  is_default: boolean;
  is_system: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfilePermissionDB {
  id: string;
  profile_id: string;
  permission_code: string;
  nivel: string;
  scope: Record<string, unknown>;
  created_at: string;
}

interface UserProfileDB {
  id: string;
  usuario_id: string;
  profile_id: string;
  obs_node_id: string | null;
  is_primary: boolean;
  assigned_by: string | null;
  assigned_at: string;
  valid_from: string;
  valid_until: string | null;
  ativo: boolean;
  created_at: string;
}

const mapProfileFromDB = (profile: AccessProfileDB): AccessProfile => ({
  id: profile.id,
  empresaId: profile.empresa_id,
  nome: profile.nome,
  codigo: profile.codigo,
  descricao: profile.descricao,
  camadaGovernanca: profile.camada_governanca,
  cor: profile.cor,
  icone: profile.icone,
  isDefault: profile.is_default,
  isSystem: profile.is_system,
  ativo: profile.ativo,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const mapPermissionFromDB = (perm: ProfilePermissionDB): ProfilePermission => ({
  id: perm.id,
  profileId: perm.profile_id,
  permissionCode: perm.permission_code,
  nivel: perm.nivel as 'none' | 'read' | 'write' | 'admin',
  scope: perm.scope || {},
});

const mapUserProfileFromDB = (up: UserProfileDB): UserProfile => ({
  id: up.id,
  usuarioId: up.usuario_id,
  profileId: up.profile_id,
  obsNodeId: up.obs_node_id,
  isPrimary: up.is_primary,
  assignedBy: up.assigned_by,
  assignedAt: up.assigned_at,
  validFrom: up.valid_from,
  validUntil: up.valid_until,
  ativo: up.ativo,
});

export const profileService = {
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permission_catalog')
      .select('*')
      .order('module', { ascending: true })
      .order('action', { ascending: true });

    if (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }

    return (data || []).map(p => ({
      permissionCode: p.permission_code,
      module: p.module,
      action: p.action,
      description: p.description,
      defaultLevel: p.default_level,
    }));
  },

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  },

  async getProfilesByEmpresa(empresaId: string): Promise<AccessProfile[]> {
    const { data, error } = await supabase
      .from('access_profiles')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

    return (data || []).map(mapProfileFromDB);
  },

  async getProfileById(id: string): Promise<AccessProfile | null> {
    const { data, error } = await supabase
      .from('access_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return mapProfileFromDB(data);
  },

  async getProfileWithPermissions(id: string): Promise<AccessProfile | null> {
    const profile = await this.getProfileById(id);
    if (!profile) return null;

    const { data: permissions } = await supabase
      .from('profile_permissions')
      .select('*, permission_catalog(*)')
      .eq('profile_id', id);

    profile.permissions = (permissions || []).map(p => ({
      ...mapPermissionFromDB(p),
      permission: p.permission_catalog ? {
        permissionCode: p.permission_catalog.permission_code,
        module: p.permission_catalog.module,
        action: p.permission_catalog.action,
        description: p.permission_catalog.description,
        defaultLevel: p.permission_catalog.default_level,
      } : undefined,
    }));

    return profile;
  },

  async createProfile(data: {
    empresaId: string;
    nome: string;
    codigo: string;
    descricao?: string;
    camadaGovernanca?: string;
    cor?: string;
    icone?: string;
    isDefault?: boolean;
  }): Promise<AccessProfile> {
    const { data: profile, error } = await supabase
      .from('access_profiles')
      .insert({
        empresa_id: data.empresaId,
        nome: data.nome,
        codigo: data.codigo,
        descricao: data.descricao || null,
        camada_governanca: data.camadaGovernanca || null,
        cor: data.cor || '#3B82F6',
        icone: data.icone || 'shield',
        is_default: data.isDefault || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    return mapProfileFromDB(profile);
  },

  async updateProfile(id: string, data: Partial<{
    nome: string;
    codigo: string;
    descricao: string;
    camadaGovernanca: string;
    cor: string;
    icone: string;
    isDefault: boolean;
    ativo: boolean;
  }>): Promise<AccessProfile> {
    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.camadaGovernanca !== undefined) updateData.camada_governanca = data.camadaGovernanca;
    if (data.cor !== undefined) updateData.cor = data.cor;
    if (data.icone !== undefined) updateData.icone = data.icone;
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    updateData.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('access_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return mapProfileFromDB(profile);
  },

  async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('access_profiles')
      .update({ ativo: false })
      .eq('id', id)
      .eq('is_system', false);

    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },

  async setProfilePermissions(
    profileId: string,
    permissions: { permissionCode: string; nivel: string }[]
  ): Promise<void> {
    await supabase
      .from('profile_permissions')
      .delete()
      .eq('profile_id', profileId);

    if (permissions.length > 0) {
      const { error } = await supabase
        .from('profile_permissions')
        .insert(
          permissions.map(p => ({
            profile_id: profileId,
            permission_code: p.permissionCode,
            nivel: p.nivel,
          }))
        );

      if (error) {
        console.error('Error setting profile permissions:', error);
        throw error;
      }
    }
  },

  async getProfilePermissions(profileId: string): Promise<ProfilePermission[]> {
    const { data, error } = await supabase
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching profile permissions:', error);
      throw error;
    }

    return (data || []).map(mapPermissionFromDB);
  },

  async getUserProfiles(usuarioId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('usuario_perfis')
      .select('*, access_profiles(*)')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true);

    if (error) {
      console.error('Error fetching user profiles:', error);
      throw error;
    }

    return (data || []).map(up => ({
      ...mapUserProfileFromDB(up),
      profile: up.access_profiles ? mapProfileFromDB(up.access_profiles) : undefined,
    }));
  },

  async assignProfileToUser(data: {
    usuarioId: string;
    profileId: string;
    obsNodeId?: string;
    isPrimary?: boolean;
    assignedBy?: string;
    validUntil?: string;
  }): Promise<UserProfile> {
    const { data: existing } = await supabase
      .from('usuario_perfis')
      .select('id')
      .eq('usuario_id', data.usuarioId)
      .eq('profile_id', data.profileId)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('usuario_perfis')
        .update({
          ativo: true,
          obs_node_id: data.obsNodeId || null,
          is_primary: data.isPrimary || false,
          assigned_by: data.assignedBy || null,
          valid_until: data.validUntil || null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return mapUserProfileFromDB(updated);
    }

    const { data: userProfile, error } = await supabase
      .from('usuario_perfis')
      .insert({
        usuario_id: data.usuarioId,
        profile_id: data.profileId,
        obs_node_id: data.obsNodeId || null,
        is_primary: data.isPrimary || false,
        assigned_by: data.assignedBy || null,
        valid_until: data.validUntil || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning profile to user:', error);
      throw error;
    }

    return mapUserProfileFromDB(userProfile);
  },

  async removeProfileFromUser(usuarioId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('usuario_perfis')
      .update({ ativo: false })
      .eq('usuario_id', usuarioId)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error removing profile from user:', error);
      throw error;
    }
  },

  async setPrimaryProfile(usuarioId: string, profileId: string): Promise<void> {
    await supabase
      .from('usuario_perfis')
      .update({ is_primary: false })
      .eq('usuario_id', usuarioId);

    const { error } = await supabase
      .from('usuario_perfis')
      .update({ is_primary: true })
      .eq('usuario_id', usuarioId)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error setting primary profile:', error);
      throw error;
    }
  },

  async getUsersByProfile(profileId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('usuario_perfis')
      .select('*, usuarios(*)')
      .eq('profile_id', profileId)
      .eq('ativo', true);

    if (error) {
      console.error('Error fetching users by profile:', error);
      throw error;
    }

    return (data || []).map(mapUserProfileFromDB);
  },

  async createDefaultProfiles(empresaId: string): Promise<void> {
    const defaultProfiles = [
      { codigo: 'ADMIN', nome: 'Administrador', cor: '#DC2626', icone: 'shield-check', camada: 'PROPONENTE' },
      { codigo: 'DIRETOR', nome: 'Diretor', cor: '#7C3AED', icone: 'briefcase', camada: 'PROPONENTE' },
      { codigo: 'GERENTE', nome: 'Gerente de Projeto', cor: '#2563EB', icone: 'users', camada: 'PROPONENTE' },
      { codigo: 'ENGENHEIRO', nome: 'Engenheiro de Planejamento', cor: '#0891B2', icone: 'hard-hat', camada: 'CONTRATADA' },
      { codigo: 'COORDENADOR', nome: 'Coordenador de Obra', cor: '#059669', icone: 'clipboard-list', camada: 'CONTRATADA' },
      { codigo: 'MESTRE', nome: 'Mestre de Obras', cor: '#D97706', icone: 'hammer', camada: 'CONTRATADA' },
      { codigo: 'FISCAL_LEAD', nome: 'Fiscalização Líder', cor: '#DB2777', icone: 'search', camada: 'FISCALIZACAO' },
      { codigo: 'FISCAL_TEC', nome: 'Fiscalização Técnico', cor: '#9333EA', icone: 'clipboard-check', camada: 'FISCALIZACAO' },
    ];

    for (const profile of defaultProfiles) {
      try {
        await supabase
          .from('access_profiles')
          .insert({
            empresa_id: empresaId,
            codigo: profile.codigo,
            nome: profile.nome,
            cor: profile.cor,
            icone: profile.icone,
            camada_governanca: profile.camada,
            is_system: true,
            is_default: profile.codigo === 'ADMIN',
          });
      } catch {
        console.log(`Profile ${profile.codigo} already exists for empresa ${empresaId}`);
      }
    }
  },
};
