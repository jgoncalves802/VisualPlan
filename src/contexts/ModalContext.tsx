import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RestricaoLPS } from '../types/lps';
import { RestricaoModalInitialData } from '../components/features/restricoes/RestricaoModal';

interface RestricaoModalState {
  isOpen: boolean;
  restricao: RestricaoLPS | null;
  initialData?: RestricaoModalInitialData;
  onSave?: (data: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS>) => void | Promise<void>;
  onClose?: () => void;
}

interface ModalContextValue {
  restricaoModal: RestricaoModalState;
  openRestricaoModal: (options: {
    restricao?: RestricaoLPS | null;
    initialData?: RestricaoModalInitialData;
    onSave?: (data: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS>) => void | Promise<void>;
    onClose?: () => void;
  }) => void;
  closeRestricaoModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [restricaoModal, setRestricaoModal] = useState<RestricaoModalState>({
    isOpen: false,
    restricao: null,
    initialData: undefined,
    onSave: undefined,
    onClose: undefined,
  });

  const openRestricaoModal = useCallback((options: {
    restricao?: RestricaoLPS | null;
    initialData?: RestricaoModalInitialData;
    onSave?: (data: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS>) => void | Promise<void>;
    onClose?: () => void;
  }) => {
    setRestricaoModal({
      isOpen: true,
      restricao: options.restricao || null,
      initialData: options.initialData,
      onSave: options.onSave,
      onClose: options.onClose,
    });
  }, []);

  const closeRestricaoModal = useCallback(() => {
    const onCloseCallback = restricaoModal.onClose;
    setRestricaoModal({
      isOpen: false,
      restricao: null,
      initialData: undefined,
      onSave: undefined,
      onClose: undefined,
    });
    if (onCloseCallback) {
      onCloseCallback();
    }
  }, [restricaoModal.onClose]);

  return (
    <ModalContext.Provider value={{ restricaoModal, openRestricaoModal, closeRestricaoModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

export const useRestricaoModal = () => {
  const { restricaoModal, openRestricaoModal, closeRestricaoModal } = useModalContext();
  return {
    isOpen: restricaoModal.isOpen,
    restricao: restricaoModal.restricao,
    initialData: restricaoModal.initialData,
    onSave: restricaoModal.onSave,
    open: openRestricaoModal,
    close: closeRestricaoModal,
  };
};
