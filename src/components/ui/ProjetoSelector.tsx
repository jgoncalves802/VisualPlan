import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building2, FolderKanban, Layers, Check } from 'lucide-react';
import { useProjetoStore } from '../../stores/projetoStore';
import { useAuthStore } from '../../stores/authStore';
import { useTemaStore } from '../../stores/temaStore';
import { epsService, EpsNode } from '../../services/epsService';

interface ProjetoSelectorProps {
  showWbsFilter?: boolean;
  className?: string;
  compact?: boolean;
}

export default function ProjetoSelector({ 
  showWbsFilter = false, 
  className = '',
  compact = false 
}: ProjetoSelectorProps) {
  const { usuario } = useAuthStore();
  const { tema } = useTemaStore();
  const { projetoSelecionado, wbsSelecionado, setProjeto, setWbs } = useProjetoStore();
  
  const [projetos, setProjetos] = useState<EpsNode[]>([]);
  const [wbsNodes, setWbsNodes] = useState<EpsNode[]>([]);
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);
  const [showWbsDropdown, setShowWbsDropdown] = useState(false);
  
  const projetoRef = useRef<HTMLDivElement>(null);
  const wbsRef = useRef<HTMLDivElement>(null);

  const empresaId = usuario?.empresaId;

  useEffect(() => {
    if (empresaId) {
      loadProjetos();
    }
  }, [empresaId]);

  useEffect(() => {
    if (projetoSelecionado.id && empresaId) {
      loadWbsNodes(projetoSelecionado.id);
    } else {
      setWbsNodes([]);
    }
  }, [projetoSelecionado.id, empresaId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projetoRef.current && !projetoRef.current.contains(event.target as Node)) {
        setShowProjetoDropdown(false);
      }
      if (wbsRef.current && !wbsRef.current.contains(event.target as Node)) {
        setShowWbsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjetos = async () => {
    if (!empresaId) return;
    try {
      const nodes = await epsService.getByEmpresa(empresaId);
      const rootProjects = nodes.filter(n => n.parentId === null);
      setProjetos(rootProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const loadWbsNodes = async (projetoId: string) => {
    if (!empresaId) return;
    try {
      const nodes = await epsService.getByEmpresa(empresaId);
      const children = nodes.filter(n => n.parentId === projetoId);
      setWbsNodes(children);
    } catch (error) {
      console.error('Erro ao carregar WBS:', error);
    }
  };

  const handleSelectProjeto = (projeto: { id: string | undefined; nome: string; codigo?: string; cor?: string }) => {
    setProjeto(projeto);
    setShowProjetoDropdown(false);
  };

  const handleSelectWbs = (wbs: { id: string | undefined; nome: string; codigo?: string; cor?: string }) => {
    setWbs(wbs);
    setShowWbsDropdown(false);
  };

  const buttonPadding = compact ? 'px-3 py-1.5' : 'px-4 py-2';
  const fontSize = compact ? 'text-sm' : '';
  const maxWidth = compact ? 'max-w-[120px]' : 'max-w-[200px]';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative" ref={projetoRef}>
        <button
          onClick={() => setShowProjetoDropdown(!showProjetoDropdown)}
          className={`flex items-center space-x-2 ${buttonPadding} rounded-lg border transition-all ${fontSize}`}
          style={{ 
            borderColor: tema.primary,
            backgroundColor: tema.surface,
            color: tema.text
          }}
        >
          {projetoSelecionado.id ? (
            <FolderKanban size={compact ? 16 : 18} style={{ color: tema.primary }} />
          ) : (
            <Building2 size={compact ? 16 : 18} style={{ color: tema.primary }} />
          )}
          <span className={`font-medium ${maxWidth} truncate`}>{projetoSelecionado.nome}</span>
          <ChevronDown size={16} className={`transition-transform ${showProjetoDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showProjetoDropdown && (
          <div 
            className="absolute left-0 mt-2 w-72 rounded-lg shadow-xl z-50 border overflow-hidden"
            style={{ backgroundColor: tema.surface, borderColor: tema.border }}
          >
            <div className="py-1 max-h-80 overflow-y-auto">
              <button
                onClick={() => handleSelectProjeto({ id: undefined, nome: 'Todos os Projetos' })}
                className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${!projetoSelecionado.id ? 'bg-gray-50' : ''}`}
              >
                <Building2 size={18} style={{ color: tema.primary }} />
                <div className="flex-1">
                  <p className="font-medium" style={{ color: tema.text }}>Todos os Projetos</p>
                  <p className="text-xs" style={{ color: tema.textSecondary }}>Visão consolidada</p>
                </div>
                {!projetoSelecionado.id && <Check size={16} style={{ color: tema.primary }} />}
              </button>
              
              {projetos.length > 0 && (
                <div className="border-t" style={{ borderColor: tema.border }}>
                  <p className="px-4 py-2 text-xs font-semibold uppercase" style={{ color: tema.textSecondary }}>
                    Projetos Ativos
                  </p>
                  {projetos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProjeto({ id: p.id, nome: p.nome, codigo: p.codigo, cor: p.cor })}
                      className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${projetoSelecionado.id === p.id ? 'bg-gray-50' : ''}`}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.cor || tema.primary }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: tema.text }}>{p.nome}</p>
                        <p className="text-xs truncate" style={{ color: tema.textSecondary }}>{p.codigo}</p>
                      </div>
                      {projetoSelecionado.id === p.id && <Check size={16} style={{ color: tema.primary }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showWbsFilter && projetoSelecionado.id && wbsNodes.length > 0 && (
        <div className="relative" ref={wbsRef}>
          <button
            onClick={() => setShowWbsDropdown(!showWbsDropdown)}
            className={`flex items-center space-x-2 ${buttonPadding} rounded-lg border transition-all ${fontSize}`}
            style={{ 
              borderColor: tema.secondary,
              backgroundColor: tema.surface,
              color: tema.text
            }}
          >
            <Layers size={compact ? 16 : 18} style={{ color: tema.secondary }} />
            <span className={`font-medium ${maxWidth} truncate`}>{wbsSelecionado.nome}</span>
            <ChevronDown size={16} className={`transition-transform ${showWbsDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showWbsDropdown && (
            <div 
              className="absolute left-0 mt-2 w-64 rounded-lg shadow-xl z-50 border overflow-hidden"
              style={{ backgroundColor: tema.surface, borderColor: tema.border }}
            >
              <div className="py-1 max-h-80 overflow-y-auto">
                <button
                  onClick={() => handleSelectWbs({ id: undefined, nome: 'Toda WBS' })}
                  className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${!wbsSelecionado.id ? 'bg-gray-50' : ''}`}
                >
                  <Layers size={16} style={{ color: tema.secondary }} />
                  <span className="font-medium flex-1" style={{ color: tema.text }}>Toda WBS</span>
                  {!wbsSelecionado.id && <Check size={16} style={{ color: tema.secondary }} />}
                </button>
                
                <div className="border-t" style={{ borderColor: tema.border }}>
                  <p className="px-4 py-2 text-xs font-semibold uppercase" style={{ color: tema.textSecondary }}>
                    Estrutura do Projeto
                  </p>
                  {wbsNodes.map(w => (
                    <button
                      key={w.id}
                      onClick={() => handleSelectWbs({ id: w.id, nome: w.nome, codigo: w.codigo, cor: w.cor })}
                      className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${wbsSelecionado.id === w.id ? 'bg-gray-50' : ''}`}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.cor || tema.secondary }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm" style={{ color: tema.text }}>{w.nome}</p>
                        <p className="text-xs truncate" style={{ color: tema.textSecondary }}>{w.codigo}</p>
                      </div>
                      {wbsSelecionado.id === w.id && <Check size={16} style={{ color: tema.secondary }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
