"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "success" | "info";
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}) => {
  const colors = {
    danger: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
      button: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      button: "bg-slate-900 hover:bg-slate-800 shadow-slate-200",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
          >
            <div className="p-8 text-center">
              <div className={`mx-auto h-16 w-16 ${style.bg} ${style.text} rounded-2xl flex items-center justify-center mb-6 shadow-inner border ${style.border}`}>
                {style.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-3">
                {title}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed px-4">
                {message}
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              >
                {cancelText}
              </button>
              <Button
                onClick={onConfirm}
                isLoading={isLoading}
                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${style.button}`}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
