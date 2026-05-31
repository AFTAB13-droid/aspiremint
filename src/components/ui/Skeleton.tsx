import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text";
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = "rectangle" }) => {
  const baseClasses = "animate-pulse bg-slate-200/60 dark:bg-slate-800/40";
  
  const variantClasses = {
    rectangle: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};
