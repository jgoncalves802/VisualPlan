/**
 * Utilitário para formatação de datas
 * Baseado nos formatos do MS Project
 */

import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormatoData } from '../types/cronograma';

/**
 * Formata uma data de acordo com o formato especificado
 */
export const formatarData = (data: string | Date, formato: FormatoData): string => {
  try {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    
    // Verifica se a data é válida
    if (isNaN(dataObj.getTime())) {
      return 'Data inválida';
    }

    // Mapeia FormatoData para formato do date-fns
    const formatoDateFns = getFormatoDateFns(formato);
    
    return format(dataObj, formatoDateFns, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro';
  }
};

/**
 * Converte FormatoData para formato do date-fns
 */
const getFormatoDateFns = (formato: FormatoData): string => {
  switch (formato) {
    // Formatos Completos
    case FormatoData.DIA_MES_ANO_HORA:
      return 'dd/MM/yyyy HH:mm';
    case FormatoData.DIA_MES_ANO:
      return 'dd/MM/yyyy';
    case FormatoData.DIA_MES_ANO_CURTO:
      return 'dd/MM/yy';
    
    // Formatos com Nome do Mês
    case FormatoData.DIA_MES_EXTENSO_ANO:
      return 'dd MMMM yyyy';
    case FormatoData.DIA_MES_EXTENSO_ANO_HORA:
      return 'dd MMMM yyyy HH:mm';
    case FormatoData.DIA_MES_ABREV_ANO:
      return 'dd/MMM/yy';
    case FormatoData.DIA_MES_ABREV_HORA:
      return 'dd/MMM HH:mm';
    
    // Formatos com Dia da Semana
    case FormatoData.SEMANA_DIA_MES_ANO_HORA:
      return 'EEE dd/MM/yy HH:mm';
    case FormatoData.SEMANA_DIA_MES_ANO:
      return 'EEE dd/MM/yy';
    case FormatoData.SEMANA_HORA:
      return 'EEE HH:mm';
    case FormatoData.SEMANA_DIA_MES:
      return 'EEE dd/MM';
    case FormatoData.SEMANA_DIA:
      return 'EEE/dd';
    
    // Formatos Compactos
    case FormatoData.DIA_MES:
      return 'dd/MM';
    case FormatoData.DIA:
      return 'dd';
    case FormatoData.HORA:
      return 'HH:mm';
    
    // Formatos Personalizados Brasil
    case FormatoData.SEMANA_DIA_MES_EXTENSO:
      return "EEE, dd 'de' MMMM";
    case FormatoData.DIA_MES_EXTENSO:
      return "dd 'de' MMMM 'de' yyyy";
    case FormatoData.SEMANA_COMPLETA_DATA:
      return "EEEE, dd 'de' MMMM 'de' yyyy";
    
    default:
      return 'dd/MM/yyyy';
  }
};

/**
 * Retorna o nome amigável do formato de data
 */
export const getNomeFormatoData = (formato: FormatoData): string => {
  const exemplos: Record<FormatoData, string> = {
    [FormatoData.DIA_MES_ANO_HORA]: '28/01/2009 12:33',
    [FormatoData.DIA_MES_ANO]: '28/01/2009',
    [FormatoData.DIA_MES_ANO_CURTO]: '28/01/09',
    [FormatoData.DIA_MES_EXTENSO_ANO]: '28 janeiro 2009',
    [FormatoData.DIA_MES_EXTENSO_ANO_HORA]: '28 janeiro 2009 12:33',
    [FormatoData.DIA_MES_ABREV_ANO]: '28/jan/09',
    [FormatoData.DIA_MES_ABREV_HORA]: '28/jan 12:33',
    [FormatoData.SEMANA_DIA_MES_ANO_HORA]: 'qua 28/01/09 12:33',
    [FormatoData.SEMANA_DIA_MES_ANO]: 'qua 28/01/09',
    [FormatoData.SEMANA_HORA]: 'qua 12:33',
    [FormatoData.SEMANA_DIA_MES]: 'qua 28/01',
    [FormatoData.SEMANA_DIA]: 'qua/28',
    [FormatoData.DIA_MES]: '28/01',
    [FormatoData.DIA]: '28',
    [FormatoData.HORA]: '12:33',
    [FormatoData.SEMANA_DIA_MES_EXTENSO]: 'qua, 28 de janeiro',
    [FormatoData.DIA_MES_EXTENSO]: '28 de janeiro de 2009',
    [FormatoData.SEMANA_COMPLETA_DATA]: 'quarta-feira, 28 de janeiro de 2009',
  };
  
  return exemplos[formato] || formato;
};

/**
 * Retorna todos os formatos disponíveis com exemplos
 */
export const getFormatosDisponiveis = (): Array<{
  value: FormatoData;
  label: string;
  exemplo: string;
  categoria: string;
}> => {
  return [
    // Formatos Completos
    {
      value: FormatoData.DIA_MES_ANO_HORA,
      label: 'Data e hora completa',
      exemplo: '28/01/2009 12:33',
      categoria: 'Completos',
    },
    {
      value: FormatoData.DIA_MES_ANO,
      label: 'Data completa',
      exemplo: '28/01/2009',
      categoria: 'Completos',
    },
    {
      value: FormatoData.DIA_MES_ANO_CURTO,
      label: 'Data curta',
      exemplo: '28/01/09',
      categoria: 'Completos',
    },
    
    // Formatos com Nome do Mês
    {
      value: FormatoData.DIA_MES_EXTENSO_ANO,
      label: 'Mês por extenso',
      exemplo: '28 janeiro 2009',
      categoria: 'Com Mês Extenso',
    },
    {
      value: FormatoData.DIA_MES_EXTENSO_ANO_HORA,
      label: 'Mês extenso com hora',
      exemplo: '28 janeiro 2009 12:33',
      categoria: 'Com Mês Extenso',
    },
    {
      value: FormatoData.DIA_MES_ABREV_ANO,
      label: 'Mês abreviado',
      exemplo: '28/jan/09',
      categoria: 'Com Mês Abreviado',
    },
    {
      value: FormatoData.DIA_MES_ABREV_HORA,
      label: 'Mês abreviado com hora',
      exemplo: '28/jan 12:33',
      categoria: 'Com Mês Abreviado',
    },
    
    // Formatos com Dia da Semana
    {
      value: FormatoData.SEMANA_DIA_MES_ANO_HORA,
      label: 'Dia da semana completo',
      exemplo: 'qua 28/01/09 12:33',
      categoria: 'Com Dia da Semana',
    },
    {
      value: FormatoData.SEMANA_DIA_MES_ANO,
      label: 'Dia da semana curto',
      exemplo: 'qua 28/01/09',
      categoria: 'Com Dia da Semana',
    },
    {
      value: FormatoData.SEMANA_HORA,
      label: 'Dia da semana e hora',
      exemplo: 'qua 12:33',
      categoria: 'Com Dia da Semana',
    },
    {
      value: FormatoData.SEMANA_DIA_MES,
      label: 'Dia da semana e dia/mês',
      exemplo: 'qua 28/01',
      categoria: 'Com Dia da Semana',
    },
    {
      value: FormatoData.SEMANA_DIA,
      label: 'Dia da semana/dia',
      exemplo: 'qua/28',
      categoria: 'Com Dia da Semana',
    },
    
    // Formatos Compactos
    {
      value: FormatoData.DIA_MES,
      label: 'Dia e mês',
      exemplo: '28/01',
      categoria: 'Compactos',
    },
    {
      value: FormatoData.DIA,
      label: 'Apenas dia',
      exemplo: '28',
      categoria: 'Compactos',
    },
    {
      value: FormatoData.HORA,
      label: 'Apenas hora',
      exemplo: '12:33',
      categoria: 'Compactos',
    },
    
    // Personalizados Brasil
    {
      value: FormatoData.SEMANA_DIA_MES_EXTENSO,
      label: 'Dia da semana e mês extenso',
      exemplo: 'qua, 28 de janeiro',
      categoria: 'Personalizados',
    },
    {
      value: FormatoData.DIA_MES_EXTENSO,
      label: 'Data por extenso',
      exemplo: '28 de janeiro de 2009',
      categoria: 'Personalizados',
    },
    {
      value: FormatoData.SEMANA_COMPLETA_DATA,
      label: 'Data completa por extenso',
      exemplo: 'quarta-feira, 28 de janeiro de 2009',
      categoria: 'Personalizados',
    },
  ];
};

