import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string; // Kept for backward compatibility
  itemName?: string; // New generic prop
  title?: string;
  message?: string;
}

export const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  itemName,
  title = "Delete Item?",
  message 
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  const displayTitle = title || "Delete User?";
  const name = itemName || userName || 'this item';
  const displayMessage = message || (
    <>
      Are you sure you want to delete <span className="font-bold text-gray-700">{name}</span>? This action cannot be undone.
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} className="text-[#c53336]" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">{displayTitle}</h3>
          <p className="text-gray-500 text-sm mb-6">
            {displayMessage}
          </p>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors w-full"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-[#c53336] text-white rounded-lg font-medium text-sm hover:bg-[#a02224] transition-colors shadow-lg shadow-red-200 w-full"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
