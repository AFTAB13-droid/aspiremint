"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100"
            >
              <div className="p-10 flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                  {isDanger ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px]">
                  {message}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-10">
                  <button
                    onClick={onClose}
                    className="w-full sm:flex-1 h-12 rounded-2xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`w-full sm:flex-1 h-12 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'}`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
