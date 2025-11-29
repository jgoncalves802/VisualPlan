import { create } from 'zustand';
import { 
  AccessProfile, 
  Permission, 
  ProfilePermission, 
  UserProfile,
  profileService 
} from '../services/profileService';

interface ProfileState {
  profiles: AccessProfile[];
  selectedProfile: AccessProfile | null;
  permissions: Permission[];
  permissionsByModule: Record<string, Permission[]>;
  profilePermissions: ProfilePermission[];
  userProfiles: UserProfile[];
  isLoading: boolean;
  error: string | null;

  loadProfiles: (empresaId: string) => Promise<void>;
  loadPermissions: () => Promise<void>;
  loadProfileWithPermissions: (profileId: string) => Promise<AccessProfile | null>;
  loadUserProfiles: (usuarioId: string) => Promise<void>;
  
  createProfile: (data: {
    empresaId: string;
    nome: string;
    codigo: string;
    descricao?: string;
    camadaGovernanca?: string;
    cor?: string;
    icone?: string;
  }) => Promise<AccessProfile>;
  
  updateProfile: (id: string, data: Partial<{
    nome: string;
    codigo: string;
    descricao: string;
    camadaGovernanca: string;
    cor: string;
    icone: string;
  }>) => Promise<void>;
  
  deleteProfile: (id: string) => Promise<void>;
  
  setProfilePermissions: (
    profileId: string, 
    permissions: { permissionCode: string; nivel: string }[]
  ) => Promise<void>;
  
  assignProfileToUser: (data: {
    usuarioId: string;
    profileId: string;
    obsNodeId?: string;
    isPrimary?: boolean;
  }) => Promise<void>;
  
  removeProfileFromUser: (usuarioId: string, profileId: string) => Promise<void>;
  
  selectProfile: (profile: AccessProfile | null) => void;
  createDefaultProfiles: (empresaId: string) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  selectedProfile: null,
  permissions: [],
  permissionsByModule: {},
  profilePermissions: [],
  userProfiles: [],
  isLoading: false,
  error: null,

  loadProfiles: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await profileService.getProfilesByEmpresa(empresaId);
      set({ profiles, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await profileService.getAllPermissions();
      const permissionsByModule = await profileService.getPermissionsByModule();
      set({ permissions, permissionsByModule, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadProfileWithPermissions: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileService.getProfileWithPermissions(profileId);
      if (profile) {
        set({ 
          selectedProfile: profile, 
          profilePermissions: profile.permissions || [],
          isLoading: false 
        });
      }
      return profile;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  loadUserProfiles: async (usuarioId: string) => {
    set({ isLoading: true, error: null });
    try {
      const userProfiles = await profileService.getUserProfiles(usuarioId);
      set({ userProfiles, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileService.createProfile(data);
      const { profiles } = get();
      set({ 
        profiles: [...profiles, profile],
        isLoading: false 
      });
      return profile;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await profileService.updateProfile(id, data);
      const { profiles, selectedProfile } = get();
      set({
        profiles: profiles.map(p => p.id === id ? updatedProfile : p),
        selectedProfile: selectedProfile?.id === id ? updatedProfile : selectedProfile,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteProfile: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await profileService.deleteProfile(id);
      const { profiles, selectedProfile } = get();
      set({
        profiles: profiles.filter(p => p.id !== id),
        selectedProfile: selectedProfile?.id === id ? null : selectedProfile,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setProfilePermissions: async (profileId, permissions) => {
    set({ isLoading: true, error: null });
    try {
      await profileService.setProfilePermissions(profileId, permissions);
      const profilePerms = await profileService.getProfilePermissions(profileId);
      set({ profilePermissions: profilePerms, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  assignProfileToUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await profileService.assignProfileToUser(data);
      await get().loadUserProfiles(data.usuarioId);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  removeProfileFromUser: async (usuarioId, profileId) => {
    set({ isLoading: true, error: null });
    try {
      await profileService.removeProfileFromUser(usuarioId, profileId);
      const { userProfiles } = get();
      set({
        userProfiles: userProfiles.filter(up => !(up.usuarioId === usuarioId && up.profileId === profileId)),
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  selectProfile: (profile) => {
    set({ selectedProfile: profile, profilePermissions: profile?.permissions || [] });
  },

  createDefaultProfiles: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      await profileService.createDefaultProfiles(empresaId);
      await get().loadProfiles(empresaId);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
