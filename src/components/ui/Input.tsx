"use client";

import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", type = "text", ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label className={`text-sm font-semibold transition-colors duration-200 ${isFocused ? 'text-blue-600' : 'text-slate-700'}`}>
            {label}
          </label>
        )}
        <div className="relative group flex items-center">
          {/* Leading Icon with Micro-Animation */}
          {icon && (
            <motion.div 
              animate={{ scale: isFocused ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`absolute left-4 z-10 transition-colors duration-200 ${isFocused ? 'text-blue-500' : 'text-slate-400'}`}
            >
              {icon}
            </motion.div>
          )}
          
          <input
            ref={ref}
            type={currentType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full rounded-2xl border bg-slate-50/50 py-3.5 text-[15px] text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
              icon ? "pl-12" : "px-4"
            } ${isPassword ? "pr-12" : "pr-4"} ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200"
            } ${className}`}
            {...props}
          />

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
            >
              {showPassword ? (
                // Eye Off
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                // Eye On
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.span 
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-xs font-medium text-red-500 overflow-hidden"
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";
