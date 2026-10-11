"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "blue" | "white" | "dark";
}

export const Logo = ({ className = "", size = 40, variant = "blue" }: LogoProps) => {
  const colors = {
    blue: {
      main: "#0ea5e9",
      accent: "#075985"
    },
    white: {
      main: "#ffffff",
      accent: "#f0f9ff"
    },
    dark: {
      main: "#38bdf8",
      accent: "#e0f2fe"
    }
  };

  const color = colors[variant];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Structural Peaks of 'A' and 'M' */}
      <path 
        d="M10 85L35 15L55 65L75 15L95 85" 
        stroke={color.accent} 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Horizontal Dash for 'A' */}
      <path 
        d="M20 60H35" 
        stroke={color.main} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
    </svg>
  );
};
