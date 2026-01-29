import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface TakeoffConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'neutral';
  progress?: {
    step: string;
    current: number;
    total: number;
  };
}

const TakeoffConfirmDialog: React.FC<TakeoffConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'danger',
  progress,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-md rounded-lg shadow-xl theme-surface"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: variant === 'danger' ? '#FEE2E2' : variant === 'warning' ? '#FEF3C7' : 'var(--color-surface-secondary)'
              }}
            >
              <AlertTriangle 
                className="w-5 h-5" 
                style={{ 
                  color: variant === 'danger' ? '#DC2626' : variant === 'warning' ? '#D97706' : 'var(--color-text-secondary)' 
                }} 
              />
            </div>
            <h3 className="text-lg font-semibold theme-text">{title}</h3>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--color-surface-secondary)' }}
            >
              <X className="w-4 h-4 theme-text-secondary" />
            </button>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm theme-text-secondary">{message}</p>
          
          {isLoading && progress && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="theme-text-secondary">{progress.step}</span>
                <span className="theme-text-secondary font-medium">{progress.current}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${progress.current}%`,
                    backgroundColor: variant === 'danger' ? '#DC2626' : variant === 'warning' ? '#D97706' : '#3B82F6'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {!isLoading && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg theme-text hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ 
              backgroundColor: variant === 'danger' ? '#DC2626' : variant === 'warning' ? '#D97706' : '#374151'
            }}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeoffConfirmDialog;
