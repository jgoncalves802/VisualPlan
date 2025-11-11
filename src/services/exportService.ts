/**
 * Serviço de Exportação para PDF e Excel
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { AtividadeMock, DependenciaAtividade, CaminhoCritico, CabecalhoImpressao } from '../types/cronograma';

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

