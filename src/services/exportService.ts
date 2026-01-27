/**
 * Serviço de Exportação para PDF e Excel
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { AtividadeMock, DependenciaAtividade, CaminhoCritico, CabecalhoImpressao } from '../types/cronograma';
import { VISIONPLAN_TASK_COLUMNS } from '../types/p6Import.types';

// ============================================================================
// EXPORTAÇÃO PDF
// ============================================================================

/**
 * Exporta cronograma para PDF
 */
export const exportarPDF = async (
  projetoNome: string,
  atividades: AtividadeMock[],
  dependencias: DependenciaAtividade[],
  caminhoCritico?: CaminhoCritico | null,
  incluirGantt: boolean = true,
  cabecalho?: CabecalhoImpressao
): Promise<void> => {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // ========================================================================
  // CABEÇALHO PERSONALIZADO (se fornecido)
  // ========================================================================

  if (cabecalho) {
    const logoHeight = 12;
    const logoY = currentY;
    let logoX = margin;
    const logoSpacing = usableWidth / 4;

    // Logo Contratada
    if (cabecalho.logo_contratada) {
      try {
        pdf.addImage(cabecalho.logo_contratada, 'PNG', logoX, logoY, logoHeight * 2, logoHeight);
      } catch (e) {
        console.warn('Erro ao adicionar logo contratada:', e);
      }
    }

    // Logo Contratante (centro-esquerda)
    if (cabecalho.logo_contratante) {
      try {
        logoX = margin + logoSpacing;
        pdf.addImage(cabecalho.logo_contratante, 'PNG', logoX, logoY, logoHeight * 2, logoHeight);
      } catch (e) {
        console.warn('Erro ao adicionar logo contratante:', e);
      }
    }

    // Logo Fiscalização (centro-direita)
    if (cabecalho.logo_fiscalizacao) {
      try {
        logoX = margin + logoSpacing * 2;
        pdf.addImage(cabecalho.logo_fiscalizacao, 'PNG', logoX, logoY, logoHeight * 2, logoHeight);
      } catch (e) {
        console.warn('Erro ao adicionar logo fiscalização:', e);
      }
    }

    currentY += logoHeight + 8;

    // Nome do Projeto (centralizado)
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55); // gray-800
    const textoProjetoWidth = pdf.getTextWidth(cabecalho.nome_projeto);
    pdf.text(cabecalho.nome_projeto, (pageWidth - textoProjetoWidth) / 2, currentY);
    currentY += 7;

    // Número do Contrato
    if (cabecalho.numero_contrato) {
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // gray-500
      const textoContratoWidth = pdf.getTextWidth(`Contrato: ${cabecalho.numero_contrato}`);
      pdf.text(`Contrato: ${cabecalho.numero_contrato}`, (pageWidth - textoContratoWidth) / 2, currentY);
      currentY += 5;
    }

    // Título "Programação de Atividades"
    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246); // blue-600
    const textoProgramacao = 'Programação de Atividades - Cronograma Gantt';
    const textoProgramacaoWidth = pdf.getTextWidth(textoProgramacao);
    pdf.text(textoProgramacao, (pageWidth - textoProgramacaoWidth) / 2, currentY);
    currentY += 8;

    // Data e Responsável
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // gray-500
    const dataFormatada = new Date(cabecalho.data_impressao || new Date()).toLocaleDateString('pt-BR');
    let infoRodape = `Data: ${dataFormatada}`;
    if (cabecalho.responsavel_impressao) {
      infoRodape += ` | Responsável: ${cabecalho.responsavel_impressao}`;
    }
    const infoRodapeWidth = pdf.getTextWidth(infoRodape);
    pdf.text(infoRodape, (pageWidth - infoRodapeWidth) / 2, currentY);
    currentY += 10;

    // Linha separadora
    pdf.setDrawColor(229, 231, 235); // gray-200
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
  } else {
    // Cabeçalho simples (legado)
    // Título
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55); // gray-800
    pdf.text('Cronograma do Projeto', margin, currentY);
    currentY += 10;

    // Nome do Projeto
    pdf.setFontSize(14);
    pdf.setTextColor(59, 130, 246); // blue-600
    pdf.text(projetoNome, margin, currentY);
    currentY += 8;
  }

  // Data da exportação (se não houver cabeçalho personalizado)
  if (!cabecalho) {
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // gray-500
    const dataExportacao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    pdf.text(`Exportado em: ${dataExportacao}`, margin, currentY);
    currentY += 10;

    // Linha divisória
    pdf.setDrawColor(229, 231, 235); // gray-200
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  // ========================================================================
  // ESTATÍSTICAS
  // ========================================================================

  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.progresso === 100).length;
  const emAndamento = atividades.filter((a) => a.progresso > 0 && a.progresso < 100).length;
  const naoIniciadas = atividades.filter((a) => a.progresso === 0).length;
  const criticas = atividades.filter((a) => a.e_critica).length;

  pdf.setFontSize(11);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Resumo Executivo:', margin, currentY);
  currentY += 6;

  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99); // gray-600
  const stats = [
    `Total de Atividades: ${total}`,
    `Concluídas: ${concluidas} (${Math.round((concluidas / total) * 100)}%)`,
    `Em Andamento: ${emAndamento}`,
    `Não Iniciadas: ${naoIniciadas}`,
    `Críticas: ${criticas}`,
  ];

  stats.forEach((stat, index) => {
    const xPos = margin + (index % 3) * (usableWidth / 3);
    const yPos = currentY + Math.floor(index / 3) * 6;
    pdf.text(stat, xPos, yPos);
  });

  currentY += 12;

  // ========================================================================
  // TABELA DE ATIVIDADES
  // ========================================================================

  pdf.setFontSize(11);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Lista de Atividades:', margin, currentY);
  currentY += 8;

  // Cabeçalho da tabela
  const colunas = [
    { header: 'Código', width: 25 },
    { header: 'Nome', width: 80 },
    { header: 'Início', width: 28 },
    { header: 'Fim', width: 28 },
    { header: 'Duração', width: 22 },
    { header: 'Progresso', width: 25 },
    { header: 'Status', width: 32 },
  ];

  let xPos = margin;
  pdf.setFillColor(243, 244, 246); // gray-100
  pdf.rect(margin, currentY - 5, usableWidth, 8, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(55, 65, 81); // gray-700
  pdf.setFont('helvetica', 'bold');

  colunas.forEach((col) => {
    pdf.text(col.header, xPos + 2, currentY);
    xPos += col.width;
  });

  currentY += 6;
  pdf.setFont('helvetica', 'normal');

  // Linhas da tabela
  atividades.forEach((atividade, index) => {
    // Verifica se precisa de nova página
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    // Zebra stripes
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251); // gray-50
      pdf.rect(margin, currentY - 4, usableWidth, 6, 'F');
    }

    xPos = margin;
    pdf.setFontSize(7);
    pdf.setTextColor(31, 41, 55);

    // Código
    pdf.text(atividade.codigo || '-', xPos + 2, currentY);
    xPos += colunas[0].width;

    // Nome (truncado)
    const nomeText = atividade.nome.length > 45 ? atividade.nome.substring(0, 42) + '...' : atividade.nome;
    if (atividade.e_critica) {
      pdf.setTextColor(220, 38, 38); // red-600
      pdf.setFont('helvetica', 'bold');
    }
    pdf.text(nomeText, xPos + 2, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    xPos += colunas[1].width;

    // Data Início
    pdf.text(new Date(atividade.data_inicio).toLocaleDateString('pt-BR'), xPos + 2, currentY);
    xPos += colunas[2].width;

    // Data Fim
    pdf.text(new Date(atividade.data_fim).toLocaleDateString('pt-BR'), xPos + 2, currentY);
    xPos += colunas[3].width;

    // Duração
    pdf.text(`${atividade.duracao_dias}d`, xPos + 2, currentY);
    xPos += colunas[4].width;

    // Progresso
    pdf.text(`${atividade.progresso}%`, xPos + 2, currentY);
    xPos += colunas[5].width;

    // Status
    pdf.text(atividade.status, xPos + 2, currentY);

    currentY += 6;
  });

  // ========================================================================
  // CAMINHO CRÍTICO (se disponível)
  // ========================================================================

  if (caminhoCritico && caminhoCritico.atividades_criticas.length > 0) {
    currentY += 10;

    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(11);
    pdf.setTextColor(220, 38, 38); // red-600
    pdf.text('Caminho Crítico:', margin, currentY);
    currentY += 6;

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Duração Total do Projeto: ${caminhoCritico.duracao_total_projeto} dias`, margin, currentY);
    currentY += 5;
    pdf.text(`Atividades no Caminho Crítico: ${caminhoCritico.atividades_criticas.length}`, margin, currentY);
    currentY += 8;

    const atividadesCriticas = atividades.filter((a) => caminhoCritico.atividades_criticas.includes(a.id));
    atividadesCriticas.forEach((ativ) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.setFontSize(8);
      pdf.setTextColor(185, 28, 28); // red-700
      pdf.text(`• ${ativ.codigo ? ativ.codigo + ' - ' : ''}${ativ.nome}`, margin + 5, currentY);
      currentY += 5;
    });
  }

  // ========================================================================
  // RODAPÉ
  // ========================================================================

  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // gray-400
    pdf.text(
      `Página ${i} de ${totalPages} | VisionPlan`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Salvar
  const fileName = `cronograma-${projetoNome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// ============================================================================
// EXPORTAÇÃO EXCEL
// ============================================================================

/**
 * Exporta cronograma para Excel
 */
export const exportarExcel = (
  projetoNome: string,
  atividades: AtividadeMock[],
  dependencias: DependenciaAtividade[],
  caminhoCritico?: CaminhoCritico | null
): void => {
  const wb = XLSX.utils.book_new();

  // ========================================================================
  // ABA 1: ATIVIDADES
  // ========================================================================

  const atividadesData = atividades.map((ativ) => ({
    Código: ativ.codigo || '-',
    Nome: ativ.nome,
    Descrição: ativ.descricao || '-',
    Tipo: ativ.tipo,
    'Data Início': new Date(ativ.data_inicio).toLocaleDateString('pt-BR'),
    'Data Fim': new Date(ativ.data_fim).toLocaleDateString('pt-BR'),
    'Duração (dias)': ativ.duracao_dias,
    'Progresso (%)': ativ.progresso,
    Status: ativ.status,
    Responsável: ativ.responsavel_nome || '-',
    Prioridade: ativ.prioridade || '-',
    Crítica: ativ.e_critica ? 'Sim' : 'Não',
    'Folga (dias)': ativ.folga_total !== undefined ? ativ.folga_total.toFixed(1) : '-',
  }));

  const wsAtividades = XLSX.utils.json_to_sheet(atividadesData);

  // Define larguras das colunas
  wsAtividades['!cols'] = [
    { wch: 10 }, // Código
    { wch: 40 }, // Nome
    { wch: 50 }, // Descrição
    { wch: 10 }, // Tipo
    { wch: 12 }, // Data Início
    { wch: 12 }, // Data Fim
    { wch: 12 }, // Duração
    { wch: 12 }, // Progresso
    { wch: 15 }, // Status
    { wch: 25 }, // Responsável
    { wch: 12 }, // Prioridade
    { wch: 10 }, // Crítica
    { wch: 12 }, // Folga
  ];

  XLSX.utils.book_append_sheet(wb, wsAtividades, 'Atividades');

  // ========================================================================
  // ABA 2: DEPENDÊNCIAS
  // ========================================================================

  const dependenciasData = dependencias.map((dep) => {
    const origem = atividades.find((a) => a.id === dep.atividade_origem_id);
    const destino = atividades.find((a) => a.id === dep.atividade_destino_id);

    return {
      'Atividade Origem': origem ? `${origem.codigo || ''} - ${origem.nome}` : dep.atividade_origem_id,
      'Atividade Destino': destino ? `${destino.codigo || ''} - ${destino.nome}` : dep.atividade_destino_id,
      Tipo: dep.tipo,
      'Lag (dias)': dep.lag_dias || 0,
    };
  });

  const wsDependencias = XLSX.utils.json_to_sheet(dependenciasData);
  wsDependencias['!cols'] = [
    { wch: 50 }, // Origem
    { wch: 50 }, // Destino
    { wch: 10 }, // Tipo
    { wch: 12 }, // Lag
  ];

  XLSX.utils.book_append_sheet(wb, wsDependencias, 'Dependências');

  // ========================================================================
  // ABA 3: CAMINHO CRÍTICO
  // ========================================================================

  if (caminhoCritico && caminhoCritico.atividades_criticas.length > 0) {
    const criticasData = caminhoCritico.atividades_criticas.map((id) => {
      const ativ = atividades.find((a) => a.id === id);
      const folga = caminhoCritico.folgas[id];

      return {
        Código: ativ?.codigo || '-',
        Nome: ativ?.nome || id,
        'Early Start': folga
          ? new Date(folga.early_start).toLocaleDateString('pt-BR')
          : '-',
        'Early Finish': folga
          ? new Date(folga.early_finish).toLocaleDateString('pt-BR')
          : '-',
        'Late Start': folga
          ? new Date(folga.late_start).toLocaleDateString('pt-BR')
          : '-',
        'Late Finish': folga
          ? new Date(folga.late_finish).toLocaleDateString('pt-BR')
          : '-',
        'Folga Total (dias)': folga?.folga_total.toFixed(1) || '0',
      };
    });

    const wsCriticas = XLSX.utils.json_to_sheet(criticasData);
    wsCriticas['!cols'] = [
      { wch: 10 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, wsCriticas, 'Caminho Crítico');
  }

  // ========================================================================
  // ABA 4: RESUMO
  // ========================================================================

  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.progresso === 100).length;
  const emAndamento = atividades.filter((a) => a.progresso > 0 && a.progresso < 100).length;
  const naoIniciadas = atividades.filter((a) => a.progresso === 0).length;
  const criticas = atividades.filter((a) => a.e_critica).length;

  const resumoData = [
    { Métrica: 'Projeto', Valor: projetoNome },
    { Métrica: 'Data da Exportação', Valor: new Date().toLocaleString('pt-BR') },
    { Métrica: '', Valor: '' },
    { Métrica: 'Total de Atividades', Valor: total },
    { Métrica: 'Concluídas', Valor: concluidas },
    { Métrica: 'Em Andamento', Valor: emAndamento },
    { Métrica: 'Não Iniciadas', Valor: naoIniciadas },
    { Métrica: 'Atividades Críticas', Valor: criticas },
    { Métrica: 'Total de Dependências', Valor: dependencias.length },
    {
      Métrica: '% Conclusão',
      Valor: total > 0 ? `${Math.round((concluidas / total) * 100)}%` : '0%',
    },
  ];

  if (caminhoCritico) {
    resumoData.push({
      Métrica: 'Duração Total do Projeto',
      Valor: `${caminhoCritico.duracao_total_projeto} dias`,
    });
  }

  const wsResumo = XLSX.utils.json_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 30 }, { wch: 50 }];

  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // Salvar
  const fileName = `cronograma-${projetoNome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Captura screenshot do Gantt e adiciona ao PDF
 */
export const capturarGanttParaPDF = async (elementId: string): Promise<string> => {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    throw new Error('Elemento Gantt não encontrado');
  }

  const canvas = await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
};

// ============================================================================
// EXPORTAÇÃO TEMPLATE P6
// ============================================================================

/**
 * Exporta template Excel para importação P6
 * Gera uma planilha com as colunas esperadas e instruções de preenchimento
 */
export const exportarTemplateP6 = (): void => {
  const wb = XLSX.utils.book_new();

  // ========================================================================
  // ABA 1: ATIVIDADES (TASK)
  // ========================================================================
  
  // Colunas principais para importação
  const mainColumns = VISIONPLAN_TASK_COLUMNS.filter(col => 
    ['IDENTIFICACAO', 'DATAS_PLANEJADAS', 'DURACAO', 'PROGRESSO', 'STATUS', 'WBS'].includes(col.category)
  );

  // Linha de cabeçalhos
  const headers = mainColumns.map(col => col.label);
  
  // Linha de descrições
  const descriptions = mainColumns.map(col => col.description || '');
  
  // Linha de tipos de dados
  const dataTypes = mainColumns.map(col => {
    switch (col.dataType) {
      case 'date': return 'Data (DD/MM/AAAA)';
      case 'number': return 'Número';
      case 'boolean': return 'Sim/Não';
      default: return 'Texto';
    }
  });
  
  // Linha de obrigatoriedade
  const required = mainColumns.map(col => col.required ? 'Obrigatório' : 'Opcional');
  
  // Linha de exemplo
  const exampleData = mainColumns.map(col => {
    switch (col.key) {
      case 'codigo': return 'A1010';
      case 'nome': return 'Fundação Bloco A';
      case 'descricao': return 'Execução de fundação do bloco A';
      case 'data_inicio': return '01/02/2025';
      case 'data_fim': return '15/02/2025';
      case 'duracao_dias': return '10';
      case 'progresso': return '25';
      case 'status': return 'not_started';
      case 'wbs_caminho': return 'Projeto > Estrutura > Bloco A';
      case 'wbs_nome': return 'Bloco A';
      case 'wbs_codigo': return 'EST.A';
      default: return '';
    }
  });

  // Criar dados da planilha
  const wsData = [
    headers,
    descriptions,
    dataTypes,
    required,
    [], // Linha vazia
    exampleData,
  ];

  const wsTask = XLSX.utils.aoa_to_sheet(wsData);
  
  // Configurar larguras das colunas
  wsTask['!cols'] = mainColumns.map(() => ({ wch: 25 }));

  XLSX.utils.book_append_sheet(wb, wsTask, 'TASK');

  // ========================================================================
  // ABA 2: PREDECESSORAS (TASKPRED)
  // ========================================================================
  
  const predHeaders = ['Atividade Origem', 'Atividade Destino', 'Tipo', 'Lag (dias)'];
  const predDescriptions = [
    'Código da atividade predecessora',
    'Código da atividade sucessora',
    'FS (Finish-Start), SS (Start-Start), FF (Finish-Finish), SF (Start-Finish)',
    'Atraso em dias (pode ser negativo)',
  ];
  const predExample = ['A1010', 'A1020', 'FS', '0'];
  
  const wsPredData = [
    predHeaders,
    predDescriptions,
    [],
    predExample,
  ];

  const wsPred = XLSX.utils.aoa_to_sheet(wsPredData);
  wsPred['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 12 }];
  
  XLSX.utils.book_append_sheet(wb, wsPred, 'TASKPRED');

  // ========================================================================
  // ABA 3: INSTRUÇÕES
  // ========================================================================
  
  const instructions = [
    ['INSTRUÇÕES DE PREENCHIMENTO - VisionPlan P6 Import'],
    [],
    ['VISÃO GERAL'],
    ['Este template foi gerado pelo VisionPlan para facilitar a importação de dados do Primavera P6.'],
    ['Preencha as colunas conforme as instruções e importe o arquivo na tela de cronograma.'],
    [],
    ['ABAS DO ARQUIVO'],
    ['TASK - Contém as atividades do cronograma'],
    ['TASKPRED - Contém as dependências entre atividades (predecessoras)'],
    [],
    ['REGRAS DE PREENCHIMENTO'],
    ['1. As duas primeiras linhas de cada aba são cabeçalhos e descrições - NÃO ALTERE'],
    ['2. A linha 3 mostra o tipo de dado esperado'],
    ['3. A linha 4 indica se o campo é obrigatório ou opcional'],
    ['4. Comece a preencher a partir da linha 6'],
    [],
    ['FORMATO DE DATAS'],
    ['Use o formato DD/MM/AAAA (ex: 15/03/2025)'],
    ['Ou formato ISO: AAAA-MM-DD (ex: 2025-03-15)'],
    [],
    ['TIPOS DE DEPENDÊNCIA'],
    ['FS - Finish-Start (Término-Início): A atividade B só pode iniciar após A terminar'],
    ['SS - Start-Start (Início-Início): A atividade B inicia junto com A'],
    ['FF - Finish-Finish (Término-Término): A atividade B termina junto com A'],
    ['SF - Start-Finish (Início-Término): A atividade B termina quando A inicia'],
    [],
    ['VALORES DE STATUS'],
    ['not_started - Não iniciado'],
    ['in_progress - Em andamento'],
    ['completed - Concluído'],
    ['on_hold - Suspenso'],
    ['cancelled - Cancelado'],
    [],
    ['WBS (ESTRUTURA DE DECOMPOSIÇÃO DO TRABALHO)'],
    ['Use o campo "WBS Caminho" para definir a hierarquia: "Projeto > Fase > Subprojeto"'],
    ['Ou preencha "WBS Nome" e "WBS Código" separadamente'],
    [],
    ['DICAS'],
    ['- Mantenha os códigos das atividades únicos'],
    ['- Use nomes descritivos para facilitar identificação'],
    ['- O progresso deve ser um valor entre 0 e 100'],
    ['- Verifique as datas de início e fim para evitar inconsistências'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 100 }];
  
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

  // ========================================================================
  // ABA 4: TODAS AS COLUNAS DISPONÍVEIS
  // ========================================================================
  
  const allColsData = [
    ['Campo', 'Categoria', 'Tipo de Dado', 'Obrigatório', 'Descrição'],
    ...VISIONPLAN_TASK_COLUMNS.map(col => [
      col.label,
      col.category,
      col.dataType,
      col.required ? 'Sim' : 'Não',
      col.description || '',
    ])
  ];

  const wsAllCols = XLSX.utils.aoa_to_sheet(allColsData);
  wsAllCols['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 50 },
  ];
  
  XLSX.utils.book_append_sheet(wb, wsAllCols, 'Todas as Colunas');

  // Salvar arquivo
  const fileName = `template-importacao-p6-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// ============================================================================
// EXPORTAÇÃO TEMPLATE TAKE-OFF (QUANTITATIVOS)
// ============================================================================

interface TakeoffColunaExport {
  nome: string;
  codigo: string;
  tipo: 'text' | 'number' | 'decimal' | 'select' | 'date' | 'calculated' | 'reference' | 'percentage';
  unidade?: string;
  casasDecimais?: number;
  opcoes?: string[];
  obrigatoria: boolean;
}

/**
 * Exporta template Excel para importação de dados de Take-off baseado nas colunas configuradas
 */
export const exportarTemplateTakeoff = (
  disciplinaNome: string,
  colunas: TakeoffColunaExport[]
): void => {
  const wb = XLSX.utils.book_new();

  // ========================================================================
  // ABA 1: DADOS (Template para preenchimento)
  // ========================================================================
  
  const headerRow = colunas.filter(c => c.tipo !== 'calculated').map(c => {
    let header = c.nome;
    if (c.unidade) header += ` (${c.unidade})`;
    if (c.obrigatoria) header += ' *';
    return header;
  });
  
  const dadosSheet: (string | number)[][] = [headerRow];
  
  // Adicionar 5 linhas vazias para exemplo
  for (let i = 0; i < 5; i++) {
    dadosSheet.push(colunas.filter(c => c.tipo !== 'calculated').map(() => ''));
  }
  
  const wsDados = XLSX.utils.aoa_to_sheet(dadosSheet);
  
  // Configurar largura das colunas
  wsDados['!cols'] = colunas.filter(c => c.tipo !== 'calculated').map(col => {
    const baseWidth = Math.max(col.nome.length, 12);
    return { wch: Math.min(baseWidth + 5, 40) };
  });
  
  XLSX.utils.book_append_sheet(wb, wsDados, 'Dados');

  // ========================================================================
  // ABA 2: LISTAS (para colunas do tipo select - validações)
  // ========================================================================
  
  const selectColunas = colunas.filter(c => c.tipo === 'select' && c.opcoes && c.opcoes.length > 0);
  
  if (selectColunas.length > 0) {
    const maxOpcoes = Math.max(...selectColunas.map(c => c.opcoes?.length || 0));
    const listasData: string[][] = [selectColunas.map(c => c.nome)];
    
    for (let i = 0; i < maxOpcoes; i++) {
      listasData.push(selectColunas.map(c => c.opcoes?.[i] || ''));
    }
    
    const wsListas = XLSX.utils.aoa_to_sheet(listasData);
    wsListas['!cols'] = selectColunas.map(c => ({ wch: Math.max(c.nome.length, 20) }));
    
    XLSX.utils.book_append_sheet(wb, wsListas, 'Listas');
  }

  // ========================================================================
  // ABA 3: INSTRUÇÕES
  // ========================================================================
  
  const tipoDescricao: Record<string, string> = {
    'text': 'Texto livre',
    'number': 'Número inteiro (sem casas decimais)',
    'decimal': 'Número decimal',
    'select': 'Selecione uma opção da lista na aba "Listas"',
    'date': 'Data no formato DD/MM/AAAA',
    'percentage': 'Valor percentual (0 a 100)',
    'reference': 'Referência a outro item',
    'calculated': 'Calculado automaticamente (não preencher)',
  };
  
  const instructions: (string | number)[][] = [
    ['INSTRUÇÕES DE PREENCHIMENTO DO TEMPLATE'],
    [],
    [`Disciplina: ${disciplinaNome}`],
    [`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    ['CAMPOS OBRIGATÓRIOS'],
    ['Campos marcados com * (asterisco) são obrigatórios e devem ser preenchidos.'],
    [],
    ['DESCRIÇÃO DOS CAMPOS'],
    ['Coluna', 'Código', 'Tipo', 'Unidade', 'Obrigatória', 'Descrição'],
    ...colunas.map(c => [
      c.nome,
      c.codigo,
      tipoDescricao[c.tipo] || c.tipo,
      c.unidade || '-',
      c.obrigatoria ? 'Sim' : 'Não',
      c.tipo === 'select' ? `Opções: ${c.opcoes?.join(', ') || '-'}` : 
        c.tipo === 'decimal' ? `${c.casasDecimais || 2} casas decimais` : '-',
    ]),
    [],
    ['DICAS DE PREENCHIMENTO'],
    ['1. Mantenha os cabeçalhos na primeira linha (não modifique)'],
    ['2. Para campos de seleção, utilize as opções disponíveis na aba "Listas"'],
    ['3. Valores numéricos devem usar ponto (.) como separador decimal'],
    ['4. Datas devem estar no formato DD/MM/AAAA'],
    ['5. Campos calculados serão preenchidos automaticamente após a importação'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 35 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 },
  ];
  
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

  // Salvar arquivo
  const nomeArquivo = disciplinaNome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const fileName = `template-takeoff-${nomeArquivo}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

