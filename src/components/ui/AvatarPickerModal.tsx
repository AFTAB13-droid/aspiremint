"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { AVAILABLE_AVATARS, AVATAR_CATEGORIES, AvatarCategory, AvatarItem, getUserAvatar } from "@/data/avatars";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSelect: (avatarPath: string) => Promise<void> | void;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onSelect
}: AvatarPickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("ALL");
  const [selectedPath, setSelectedPath] = useState<string>(currentAvatar || AVAILABLE_AVATARS[0].path);
  const [saving, setSaving] = useState(false);

  // Sync selected with current avatar on open
  React.useEffect(() => {
    if (currentAvatar) {
      setSelectedPath(getUserAvatar(currentAvatar));
    }
  }, [currentAvatar, isOpen]);

  const filteredAvatars = React.useMemo(() => {
    if (activeCategory === "ALL") return AVAILABLE_AVATARS;
    return AVAILABLE_AVATARS.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  const selectedAvatarObj = React.useMemo(() => {
    return AVAILABLE_AVATARS.find(a => a.path === selectedPath) || AVAILABLE_AVATARS[0];
  }, [selectedPath]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onSelect(selectedPath);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white dark:from-[#0E1526] dark:to-[#0B101D]">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    Select Avatar Persona
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Choose from 20 exclusive curated avatars for your profile
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demographic Category Filter Tabs */}
            <div className="px-8 py-4 bg-slate-50/70 dark:bg-[#0B101D] border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              {AVATAR_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-md shadow-slate-900/10"
                        : "bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200/60 dark:border-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Avatar Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {filteredAvatars.map((avatar) => {
                  const isSelected = selectedPath === avatar.path;
                  return (
                    <motion.button
                      key={avatar.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPath(avatar.path)}
                      className={`relative flex flex-col items-center p-3.5 rounded-3xl transition-all border text-center ${
                        isSelected
                          ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-4 ring-indigo-500/20"
                          : "bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                      }`}
                    >
                      {/* Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Avatar Graphic */}
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-md mb-2 bg-slate-100 dark:bg-slate-800">
                        <img 
                          src={avatar.path} 
                          alt={avatar.name} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Title */}
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">
                        {avatar.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Summary Footer & Action */}
            <div className="p-6 md:px-8 bg-slate-50 dark:bg-[#0B101D] border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                  <img 
                    src={selectedAvatarObj.path} 
                    alt={selectedAvatarObj.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {selectedAvatarObj.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 line-clamp-1">
                    {selectedAvatarObj.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-7 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Apply Avatar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
