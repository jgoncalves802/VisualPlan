import React from 'react';
import { useModalContext } from '../contexts/ModalContext';
import { RestricaoModal } from './features/restricoes/RestricaoModal';
import { RestricaoLPS } from '../types/lps';

export const GlobalModals: React.FC = () => {
  const { restricaoModal, closeRestricaoModal } = useModalContext();

  const handleSave = async (data: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS>) => {
    if (restricaoModal.onSave) {
      await restricaoModal.onSave(data);
    }
    closeRestricaoModal();
  };

  const handleClose = () => {
    closeRestricaoModal();
  };

  return (
    <>
      <RestricaoModal
        restricao={restricaoModal.restricao}
        isOpen={restricaoModal.isOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={restricaoModal.initialData}
      />
    </>
  );
};
