import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userName?: string;
  itemName?: string;
  title?: string;
  message?: string;
  itemType?: string; // e.g., "User", "Visitor", "Facility Log"
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  itemName,
  title = "Delete Item?",
  message,
  itemType = "Item"
}: DeleteConfirmationModalProps) => {
  // Internal states for delete logic
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // If the modal isn't open and no status modals are showing, render nothing
  if (!isOpen && !errorMsg && !showSuccessModal) return null;

  const displayTitle = title || "Delete User?";
  const name = itemName || userName || 'this item';
  const displayMessage = message || (
    <>
      Are you sure you want to delete <span className="font-bold text-gray-700">{name}</span>? This action cannot be undone.
    </>
  );

  // --- Handlers ---
  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirm(); // Await the API call passed from the parent
      setShowSuccessModal(true); // Trigger success if no errors are thrown
    } catch (error: any) {
      // Catch backend errors and trigger the error modal
      const backendError = error.response?.data?.message || error.message || "Failed to delete item. Please try again.";
      setErrorMsg(backendError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose(); // Close the entire modal flow
  };

  const handleCloseErrorModal = () => {
    setErrorMsg(null);
    // Keeps the main confirmation modal open so they can try again
  };

  return (
    <>
      {/* MAIN DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isOpen && !showSuccessModal && !errorMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
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
                    disabled={isDeleting}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors w-full disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#c53336] text-white rounded-lg font-medium text-sm hover:bg-[#a02224] transition-colors shadow-lg shadow-red-200 w-full disabled:opacity-70"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMsg && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseErrorModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Wait a moment</h3>
              <p className="text-gray-500 mb-8">{errorMsg}</p>

              <button
                onClick={handleCloseErrorModal}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Go Back & Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseSuccessModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#2f4fa8] mb-2">Success!</h3>
              <p className="text-gray-500 mb-8">
                <span className="font-bold text-gray-700 capitalize">{itemType}</span> has been successfully deleted.
              </p>
              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};