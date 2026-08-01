"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  searchable?: boolean;
  renderOption?: (option: string) => React.ReactNode;
  renderValue?: (value: string) => React.ReactNode;
  mobileModal?: boolean;
  isLoading?: boolean;
}

export function CustomDropdown({ options, value, onChange, placeholder, icon, className, searchable = false, renderOption, renderValue, mobileModal = false, isLoading = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    
    // Always keep "All Brands" (or the first option if it's special) visible or just search everything
    // The user specifically wanted "All Brands" to be visible/functional
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[48px] bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest outline-none hover:bg-white hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
           {icon && <span className="text-slate-400 group-hover:text-indigo-500 transition-colors uppercase flex-shrink-0">{icon}</span>}
           <span className={`truncate flex-1 text-left ${value ? "text-slate-900" : "text-slate-400"}`}>
              {value && renderValue ? renderValue(value) : (value || placeholder)}
           </span>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-300 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {mobileModal && (
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] md:hidden"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
               />
            )}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`${
                 mobileModal 
                 ? "fixed top-1/2 left-6 right-6 -translate-y-1/2 max-h-[80vh] z-[101] md:absolute md:top-[calc(100%+8px)] md:bottom-auto md:left-0 md:right-0 md:translate-y-0 md:z-50 rounded-[28px] md:rounded-2xl shadow-2xl md:shadow-xl py-2 flex flex-col" 
                 : "absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 max-h-[60vh] flex flex-col"
              } bg-white border border-slate-100`}
            >
            {searchable && (
              <div className="px-3 pb-2 pt-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 text-[10px] font-bold tracking-widest outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-black uppercase"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {/* Extra Check for "All Brands" to be always selectable if provided at start of list */}
              {isLoading ? (
                <div className="px-5 py-3 text-[9px] font-black text-indigo-500 uppercase tracking-widest text-center animate-pulse flex items-center justify-center gap-2">
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                   Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">No match found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest transition-colors ${
                      value === option ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {renderOption ? renderOption(option) : option}
                  </button>
                ))
              )}
            </div>
          </motion.div>
         </>
        )}
      </AnimatePresence>
    </div>
  );
}
