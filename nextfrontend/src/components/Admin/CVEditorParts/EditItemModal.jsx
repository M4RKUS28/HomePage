import React from 'react';
import Modal from '../../UI/Modal';
import { Save } from 'lucide-react';

const EditItemModal = ({ show, title, onClose, onSave, children }) => {
  if (!show) return null;

  return (
    <Modal title={title} onClose={onClose}>
      {children}
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onClose} className="cv-btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={onSave} className="btn btn-primary flex items-center">
          <Save size={16} className="mr-1" /> Save
        </button>
      </div>
    </Modal>
  );
};

export default EditItemModal;
