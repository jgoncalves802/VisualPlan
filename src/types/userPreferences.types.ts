export interface UserPreferences {
  id: string;
  user_id: string;
  empresa_id: string;
  tema_preferido: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  itens_por_pagina: number;
  visualizacao_gantt: string;
  mostrar_linha_hoje: boolean;
  mostrar_dependencias: boolean;
  mostrar_caminho_critico: boolean;
  notificar_email: boolean;
  notificar_app: boolean;
  resumo_diario: boolean;
  idioma: string;
  formato_data: string;
  formato_hora: string;
  preferencias_extras: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesDTO {
  user_id: string;
  empresa_id: string;
  tema_preferido?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  itens_por_pagina?: number;
  visualizacao_gantt?: string;
  mostrar_linha_hoje?: boolean;
  mostrar_dependencias?: boolean;
  mostrar_caminho_critico?: boolean;
  notificar_email?: boolean;
  notificar_app?: boolean;
  resumo_diario?: boolean;
  idioma?: string;
  formato_data?: string;
  formato_hora?: string;
  preferencias_extras?: Record<string, unknown>;
}

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'empresa_id' | 'created_at' | 'updated_at'> = {
  tema_preferido: 'light',
  cor_primaria: undefined,
  cor_secundaria: undefined,
  itens_por_pagina: 25,
  visualizacao_gantt: 'semana',
  mostrar_linha_hoje: true,
  mostrar_dependencias: true,
  mostrar_caminho_critico: true,
  notificar_email: true,
  notificar_app: true,
  resumo_diario: false,
  idioma: 'pt-BR',
  formato_data: 'dd/MM/yyyy',
  formato_hora: 'HH:mm',
  preferencias_extras: {},
};
