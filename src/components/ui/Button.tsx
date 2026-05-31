"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-300 focus:outline-none focus:ring-4 overflow-hidden";
  
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 focus:ring-blue-500/30",
    secondary:
      "bg-slate-800 text-white shadow-lg hover:bg-slate-700 focus:ring-slate-800/30",
    outline:
      "border-2 border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-500/20",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${
        disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Animated Shine Effect for Primary Button */}
      {variant === "primary" && !isLoading && !disabled && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
      )}

      {isLoading ? (
        <svg
          className="mr-2 h-5 w-5 animate-spin text-white/80"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
