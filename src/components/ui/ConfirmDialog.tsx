import React from 'react';
import { AlertTriangle, Trash2, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  loading?: boolean;
  icon?: React.ReactNode;
}

const typeStyles: Record<ConfirmType, { iconBg: string; iconColor: string; buttonVariant: 'danger' | 'warning' | 'primary' }> = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'danger',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'warning',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary',
  },
};

const DefaultIcon = ({ type }: { type: ConfirmType }) => {
  const styles = typeStyles[type];
  const iconClass = 'w-6 h-6';
  
  switch (type) {
    case 'danger':
      return (
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <Trash2 className={`${iconClass} ${styles.iconColor}`} />
        </div>
      );
    case 'warning':
      return (
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <AlertTriangle className={`${iconClass} ${styles.iconColor}`} />
        </div>
      );
    case 'info':
      return (
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <HelpCircle className={`${iconClass} ${styles.iconColor}`} />
        </div>
      );
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false,
  icon,
}) => {
  const styles = typeStyles[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {icon || <DefaultIcon type={type} />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-600 mb-6">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles.buttonVariant}
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Aguarde...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
