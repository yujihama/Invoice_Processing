
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 h-full w-full z-50 flex items-center justify-center p-4" id="my-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="relative mx-auto w-full max-w-4xl shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]">
        <div className="flex-shrink-0 flex justify-between items-center p-5 border-b">
          <h3 id="modal-title" className="text-2xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-5">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
