"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  name?: string; // So it can be used in forms
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  error,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex w-full flex-col gap-2" ref={dropdownRef}>
      {/* Hidden native input for formData extraction in forms */}
      {name && <input type="hidden" name={name} value={value} />}
      
      {label && (
        <label className={`text-sm font-semibold transition-colors duration-200 ${isFocused || isOpen ? 'text-blue-600' : 'text-slate-700'}`}>
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsFocused(true);
            if (!isOpen) setSearchTerm("");
          }}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-[15px] outline-none transition-all duration-300 ${
            isOpen || isFocused
              ? "bg-white border-blue-500 ring-4 ring-blue-500/10"
              : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          } ${error ? "border-red-500 ring-4 ring-red-500/10" : ""}`}
        >
          <div className="flex items-center gap-3">
            {selectedOption?.icon && <span className="text-blue-500 flex items-center justify-center">{selectedOption.icon}</span>}
            <span className={selectedOption ? "text-slate-900 font-medium" : "text-slate-400"}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          
          <motion.svg 
            animate={{ rotate: isOpen ? 180 : 0 }}
            className={`h-5 w-5 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </motion.svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 mt-2 w-full origin-top rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-blue-900/5 z-50 overflow-hidden"
            >
              {/* Search Bar */}
              <div className="px-2 py-2 border-b border-slate-50 mb-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex max-h-60 flex-col overflow-y-auto custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`flex items-center gap-3 w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${
                        value === option.value
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {option.icon && (
                        <span className={`flex items-center justify-center ${value === option.value ? "text-blue-600" : "text-slate-400"}`}>
                          {option.icon}
                        </span>
                      )}
                      {option.label}
                      {value === option.value && (
                        <svg className="ml-auto h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.span 
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-red-500"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
};
