/**
 * Modal de Configuração de Impressão do Cronograma
 * Permite configurar cabeçalho com logos e informações do projeto
 */

import React, { useState } from 'react';
import { CabecalhoImpressao } from '../../../types/cronograma';

interface PrintConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (cabecalho: CabecalhoImpressao) => void;
  projetoNome?: string;
}

export const PrintConfigModal: React.FC<PrintConfigModalProps> = ({
  open,
  onClose,
  onConfirm,
  projetoNome = '',
}) => {
  const [config, setConfig] = useState<CabecalhoImpressao>({
    nome_projeto: projetoNome,
    logo_contratada: '',
    logo_contratante: '',
    logo_fiscalizacao: '',
    numero_contrato: '',
    data_impressao: new Date(),
    responsavel_impressao: '',
  });

  const [previewLogos, setPreviewLogos] = useState<{
    contratada?: string;
    contratante?: string;
    fiscalizacao?: string;
  }>({});

  // Handler para upload de logo (converte para base64)
  const handleLogoUpload = (tipo: 'contratada' | 'contratante' | 'fiscalizacao', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setConfig((prev) => ({
        ...prev,
        [`logo_${tipo}`]: base64,
      }));
      setPreviewLogos((prev) => ({
        ...prev,
        [tipo]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handler para remover logo
  const handleRemoveLogo = (tipo: 'contratada' | 'contratante' | 'fiscalizacao') => {
    setConfig((prev) => ({
      ...prev,
      [`logo_${tipo}`]: '',
    }));
    setPreviewLogos((prev) => ({
      ...prev,
      [tipo]: undefined,
    }));
  };

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configurar Impressão</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Informações do Projeto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informações do Projeto</h3>
            
            {/* Nome do Projeto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Projeto *
              </label>
              <input
                type="text"
                value={config.nome_projeto}
                onChange={(e) => setConfig({ ...config, nome_projeto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome do projeto"
                required
              />
            </div>

            {/* Número do Contrato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Contrato
              </label>
              <input
                type="text"
                value={config.numero_contrato}
                onChange={(e) => setConfig({ ...config, numero_contrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: CT-2024-001"
              />
            </div>

            {/* Responsável pela Impressão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pela Impressão
              </label>
              <input
                type="text"
                value={config.responsavel_impressao}
                onChange={(e) => setConfig({ ...config, responsavel_impressao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {/* Logos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Logos das Empresas</h3>
            <p className="text-sm text-gray-600">
              Adicione as logos que aparecerão no cabeçalho da impressão. Formatos aceitos: JPG, PNG (máx. 2MB)
            </p>

            {/* Logo Contratada */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo da Contratada
              </label>
              {previewLogos.contratada ? (
                <div className="flex items-center gap-4">
                  <img
                    src={previewLogos.contratada}
                    alt="Logo Contratada"
                    className="h-16 w-auto object-contain border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => handleRemoveLogo('contratada')}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 2 * 1024 * 1024) {
                      handleLogoUpload('contratada', file);
                    } else {
                      alert('Arquivo muito grande! Máximo 2MB.');
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>

            {/* Logo Contratante */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo da Contratante
              </label>
              {previewLogos.contratante ? (
                <div className="flex items-center gap-4">
                  <img
                    src={previewLogos.contratante}
                    alt="Logo Contratante"
                    className="h-16 w-auto object-contain border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => handleRemoveLogo('contratante')}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 2 * 1024 * 1024) {
                      handleLogoUpload('contratante', file);
                    } else {
                      alert('Arquivo muito grande! Máximo 2MB.');
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>

            {/* Logo Fiscalização */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo da Fiscalização
              </label>
              {previewLogos.fiscalizacao ? (
                <div className="flex items-center gap-4">
                  <img
                    src={previewLogos.fiscalizacao}
                    alt="Logo Fiscalização"
                    className="h-16 w-auto object-contain border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => handleRemoveLogo('fiscalizacao')}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 2 * 1024 * 1024) {
                      handleLogoUpload('fiscalizacao', file);
                    } else {
                      alert('Arquivo muito grande! Máximo 2MB.');
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>
          </div>

          {/* Preview do Cabeçalho */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Preview do Cabeçalho</h3>
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                {previewLogos.contratada && (
                  <img src={previewLogos.contratada} alt="Contratada" className="h-12 w-auto" />
                )}
                {previewLogos.contratante && (
                  <img src={previewLogos.contratante} alt="Contratante" className="h-12 w-auto" />
                )}
                {previewLogos.fiscalizacao && (
                  <img src={previewLogos.fiscalizacao} alt="Fiscalização" className="h-12 w-auto" />
                )}
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-900">{config.nome_projeto || 'Nome do Projeto'}</h4>
                {config.numero_contrato && (
                  <p className="text-sm text-gray-600 mt-1">Contrato: {config.numero_contrato}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Programação de Atividades - Cronograma Gantt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!config.nome_projeto}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar e Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

