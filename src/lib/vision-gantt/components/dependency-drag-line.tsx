


import React from 'react';
import type { Task } from '../types';
import { DependencyDragState } from '../hooks/use-dependency-drag';

interface DependencyDragLineProps {
  dragState: DependencyDragState;
  getTaskPosition: (taskId: string) => { x: number; y: number; width: number; height: number } | null;
}

export function DependencyDragLine({ dragState, getTaskPosition }: DependencyDragLineProps) {
  if (!dragState.isDragging || !dragState.sourceTask) {
    return null;
  }

  const sourcePos = getTaskPosition(dragState.sourceTask.id);
  if (!sourcePos) return null;

  const HANDLE_OFFSET = 8; // Offset dos handles para fora da barra (mesmo valor usado no task-bar.tsx)

  // Calcula a posição inicial baseada no handle de origem (com offset)
  const startX = dragState.sourceHandle === 'start' 
    ? sourcePos.x - HANDLE_OFFSET
    : sourcePos.x + sourcePos.width + HANDLE_OFFSET;
  const startY = sourcePos.y + sourcePos.height / 2;

  // Posição final é o mouse ou a tarefa alvo
  let endX = dragState.mousePosition.x;
  let endY = dragState.mousePosition.y;

  if (dragState.targetTask) {
    const targetPos = getTaskPosition(dragState.targetTask.id);
    if (targetPos) {
      // Adiciona offset também na posição do target
      endX = dragState.targetHandle === 'start' 
        ? targetPos.x - HANDLE_OFFSET
        : targetPos.x + targetPos.width + HANDLE_OFFSET;
      endY = targetPos.y + targetPos.height / 2;
    }
  }

  // Determina a cor baseada se há um alvo válido
  const strokeColor = dragState.targetTask 
    ? 'var(--gantt-link-hover)' 
    : 'var(--gantt-primary)';

  // Cria um path ortogonal (linhas retas com cantos) - estilo Bryntum
  const dx = endX - startX;
  const dy = endY - startY;
  const midX = startX + dx / 2;
  
  // Path SVG ortogonal (linhas retas)
  let path: string;
  if (Math.abs(dy) < 5) {
    // Mesma linha - linha reta
    path = `M ${startX},${startY} L ${endX},${endY}`;
  } else {
    // Linhas diferentes - roteamento ortogonal
    path = `M ${startX},${startY} L ${midX},${startY} L ${midX},${endY} L ${endX},${endY}`;
  }

  return (
    <g className="dependency-drag-line" style={{ pointerEvents: 'none' }}>
      {/* Linha de fundo (shadow) */}
      <path
        d={path}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={4.5}
        fill="none"
        strokeDasharray="8,4"
        className="transition-all"
      />
      
      {/* Linha principal */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={3}
        fill="none"
        strokeDasharray="8,4"
        className="transition-all"
        style={{
          animation: 'dash 1s linear infinite',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
        }}
      />
      
      {/* Círculo na ponta (cursor) */}
      <circle
        cx={endX}
        cy={endY}
        r={5}
        fill={strokeColor}
        stroke="white"
        strokeWidth={2.5}
      />

      {/* Badge indicando o tipo de dependência que será criado */}
      {dragState.targetTask && (
        <g>
          <rect
            x={midX - 20}
            y={Math.min(startY, endY) + Math.abs(endY - startY) / 2 - 12}
            width={40}
            height={24}
            rx={4}
            fill={strokeColor}
            opacity={0.9}
          />
          <text
            x={midX}
            y={Math.min(startY, endY) + Math.abs(endY - startY) / 2 + 3}
            fontSize={11}
            fontWeight="600"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {getDependencyTypeLabel(dragState.sourceHandle, dragState.targetHandle)}
          </text>
        </g>
      )}

      {/* Adiciona CSS para animação */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </g>
  );
}

function getDependencyTypeLabel(
  sourceHandle: 'start' | 'end' | null, 
  targetHandle: 'start' | 'end' | null
): string {
  if (sourceHandle === 'end' && targetHandle === 'start') return 'FS';
  if (sourceHandle === 'start' && targetHandle === 'start') return 'SS';
  if (sourceHandle === 'end' && targetHandle === 'end') return 'FF';
  if (sourceHandle === 'start' && targetHandle === 'end') return 'SF';
  return 'FS';
}
