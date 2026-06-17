import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

const ConfirmModal = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  title = 'Confirm',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title}>
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="p-3 rounded-full bg-red-500/10">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <p className="text-center text-ink text-sm">{message}</p>
      <div className="flex gap-3 w-full mt-1">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-line text-ink-2 hover:bg-accent-soft transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <Trash2 size={14} /> {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmModal;
