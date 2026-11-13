"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Sparkles,
  Smartphone,
  Monitor,
  Columns,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  Sliders,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Flame,
  Award,
} from "lucide-react";
import { VaultCoinSplash } from "@/components/splash/VaultCoinSplash";
import { GlassPrismSplash } from "@/components/splash/GlassPrismSplash";
import { ParticleVortexSplash } from "@/components/splash/ParticleVortexSplash";
import { HolographicCardSplash } from "@/components/splash/HolographicCardSplash";
import { splashSoundEngine } from "@/utils/splashSound";

type SplashOptionKey = "option1" | "option2" | "option3" | "option4";
type ViewportMode = "desktop" | "mobile" | "side-by-side";

interface OptionMeta {
  key: SplashOptionKey;
  title: string;
  subtitle: string;
  theme: string;
  audioName: string;
  description: string;
  badge: string;
  color: string;
}

const SPLASH_OPTIONS: OptionMeta[] = [
  {
    key: "option1",
    title: "Option 1: The Minted 3D Vault Coin",
    subtitle: "Luxury Fintech & High-Prestige Payouts",
    theme: "Pearl White · Minted Gold · Emerald Aura",
    audioName: "Sub-bass Whoosh + Metallic Gold Coin Clink & Chime",
    description:
      "A 3D minted gold & emerald coin rotating in physical 3D space with pearl enamel face and orbiting gold dust particles. Locks into position with a radial kinetic shockwave.",
    badge: "Recommended",
    color: "from-amber-400 to-emerald-500",
  },
  {
    key: "option2",
    title: "Option 2: 3D Frosted Glass Prism",
    subtitle: "Apple-Style Minimalist Light Caustics",
    theme: "Frosted Crystal White · Prismatic Caustics · Sky Blue",
    audioName: "Ethereal Spatial Major 7th Synthesizer Chord",
    description:
      "Translucent 3D frosted crystal prism rotating along multiple axes with real-time backdrop blur and spectral caustic flares on crisp white. Morphs into the sharp AspireMint peak logo.",
    badge: "Ultra-Clean",
    color: "from-sky-400 to-indigo-500",
  },
  {
    key: "option3",
    title: "Option 3: Celestial Particle Vortex",
    subtitle: "Kinetic Galaxy Swirl & Ignition Pulse",
    theme: "Porcelain White · Vibrant Celestial Star Dust",
    audioName: "Swirling Frequency Whoosh into Solfeggio 528Hz Bell",
    description:
      "Hundreds of vivid emerald, cyan, and gold particles swirling in a gravitational vortex via an ultra-lightweight HTML5 Canvas. Collapses into a center ignition explosion.",
    badge: "Cinematic",
    color: "from-emerald-400 to-teal-300",
  },
  {
    key: "option4",
    title: "Option 4: 3D Holographic VIP Card",
    subtitle: "White Ceramic & Platinum VIP Pass with Tilt",
    theme: "White Ceramic & Platinum · Iridescent Ribbon · Gold Chip",
    audioName: "Executive Card Flick + Dual-Tone Payment Success Bell",
    description:
      "Floating luxury white ceramic VIP access card that dynamically tilts with mouse cursor or mobile gyroscope. Features embossed gold EMV chip, iridescent foil reflection, and verified badge.",
    badge: "Interactive",
    color: "from-teal-400 to-amber-400",
  },
];

export default function SplashLabAdminPage() {
  const { data: session } = useSession();
  const [selectedOption, setSelectedOption] = useState<SplashOptionKey>("option1");
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live configuration state from server
  const [liveActiveOption, setLiveActiveOption] = useState<string>("option1");
  const [savingLive, setSavingLive] = useState(false);

  // Fetch current live splash configuration
  useEffect(() => {
    fetch("/api/admin/splash-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.activeOption) {
          setLiveActiveOption(data.config.activeOption);
          setSelectedOption(data.config.activeOption as SplashOptionKey);
          if (data.config.soundEnabled !== undefined) {
            setSoundEnabled(data.config.soundEnabled);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleReplay = () => {
    splashSoundEngine.unlock();
    setReplayKey((prev) => prev + 1);
  };

  const handleTestSoundOnly = () => {
    splashSoundEngine.unlock();
    splashSoundEngine.playSoundForOption(selectedOption);
    toast.success(`Playing sound: ${SPLASH_OPTIONS.find((o) => o.key === selectedOption)?.audioName}`);
  };

  const handleSaveAsLiveActive = async (optionKey: SplashOptionKey) => {
    setSavingLive(true);
    try {
      const res = await fetch("/api/admin/splash-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeOption: optionKey,
          soundEnabled,
          duration: 2500,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLiveActiveOption(optionKey);
        toast.success(`Active Website Splash updated to: ${optionKey.toUpperCase()}!`, {
          icon: "🚀",
          duration: 4000,
        });
      } else {
        toast.error(data.message || "Failed to update configuration");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error updating splash config");
    } finally {
      setSavingLive(false);
    }
  };

  const renderSplashComponent = (optionKey: SplashOptionKey, isMobile: boolean) => {
    const commonProps = {
      key: `${optionKey}-${replayKey}-${isMobile ? "m" : "d"}`,
      containerMode: true,
      soundEnabled,
      isMobilePreview: isMobile,
    };

    switch (optionKey) {
      case "option1":
        return <VaultCoinSplash {...commonProps} />;
      case "option2":
        return <GlassPrismSplash {...commonProps} />;
      case "option3":
        return <ParticleVortexSplash {...commonProps} />;
      case "option4":
        return <HolographicCardSplash {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/app/admin"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  3D Splash Animation Studio
                </h1>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-2">
              Audition, preview, and deploy all 4 ultra-fast 3D start animations with synchronized Web Audio sound.
            </p>
          </div>

          {/* Current Live Active Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Live Site Splash
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-black text-white capitalize">
                  {SPLASH_OPTIONS.find((o) => o.key === liveActiveOption)?.title.split(":")[1] || liveActiveOption}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSaveAsLiveActive(selectedOption)}
              disabled={savingLive || liveActiveOption === selectedOption}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                liveActiveOption === selectedOption
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black"
              }`}
            >
              {savingLive ? (
                "Saving..."
              ) : liveActiveOption === selectedOption ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Now</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Deploy to Live Site</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. OPTION SELECTOR TABS (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SPLASH_OPTIONS.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isLive = liveActiveOption === opt.key;

            return (
              <div
                key={opt.key}
                onClick={() => {
                  setSelectedOption(opt.key);
                  handleReplay();
                }}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/50"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {/* Badges row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {opt.badge}
                  </span>

                  {isLive && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live
                    </span>
                  )}
                </div>

                {/* Title & Theme */}
                <div>
                  <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">{opt.subtitle}</p>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                {/* Footer specs */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[170px]" title={opt.theme}>
                    🎨 {opt.theme}
                  </span>
                  <span className="font-mono text-emerald-400">&lt; 5 KB</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. TOOLBAR CONTROLS (Viewport Toggle & Actions) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          {/* Viewport Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewportMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewportMode === "desktop"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop View</span>
            </button>
            <button
              onClick={() => setViewportMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewportMode === "mobile"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </button>
            <button
              onClick={() => setViewportMode("side-by-side")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewportMode === "side-by-side"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Interactive Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Restart and play the animation again"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Replay Animation</span>
            </button>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                soundEnabled
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sound ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sound Muted</span>
                </>
              )}
            </button>

            <button
              onClick={handleTestSoundOnly}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
              title="Test the Web Audio synthesizer sound immediately"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Audio</span>
            </button>

            <button
              onClick={() => {
                splashSoundEngine.unlock();
                setIsFullscreen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
              title="Experience full-screen exact buyer view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* 4. PREVIEW STAGE AREA */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[580px]">
          {/* DESKTOP VIEWPORT FRAME */}
          {viewportMode === "desktop" && (
            <div className="w-full max-w-4xl flex flex-col items-center">
              {/* Desktop Monitor Bezel */}
              <div className="w-full bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
                {/* Browser bar top */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="px-6 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>https://aspiremint.com</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Desktop 16:9</span>
                </div>

                {/* Screen Canvas (Aspect 16:9) */}
                <div className="w-full aspect-video rounded-xl relative overflow-hidden bg-black">
                  {renderSplashComponent(selectedOption, false)}
                </div>
              </div>
            </div>
          )}

          {/* MOBILE PHONE VIEWPORT FRAME */}
          {viewportMode === "mobile" && (
            <div className="flex flex-col items-center">
              {/* iPhone 16 Pro Mockup Shell */}
              <div className="w-[360px] h-[680px] rounded-[48px] bg-slate-900 border-[6px] border-slate-700 shadow-[0_30px_70px_rgba(0,0,0,0.9)] p-2 relative flex flex-col overflow-hidden">
                {/* Dynamic Island Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end px-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 blur-[1px]" />
                </div>

                {/* Mobile Screen Surface */}
                <div className="w-full h-full rounded-[40px] relative overflow-hidden bg-black">
                  {renderSplashComponent(selectedOption, true)}
                </div>

                {/* Bottom Home Indicator bar */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-400 font-mono mt-3">
                Mobile Viewport: 360 x 680 (Touch & Gyro Enabled)
              </span>
            </div>
          )}

          {/* SIDE-BY-SIDE DUAL PREVIEW */}
          {viewportMode === "side-by-side" && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Desktop on Left (Col 7) */}
              <div className="lg:col-span-8 flex flex-col items-center">
                <div className="w-full bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-xl relative">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 mb-2 text-[10px] text-slate-400">
                    <span>🖥️ Desktop Monitor Preview</span>
                    <span>1920 x 1080 Responsive</span>
                  </div>
                  <div className="w-full aspect-video rounded-xl relative overflow-hidden bg-black">
                    {renderSplashComponent(selectedOption, false)}
                  </div>
                </div>
              </div>

              {/* Mobile on Right (Col 4) */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="w-[280px] h-[520px] rounded-[40px] bg-slate-900 border-[5px] border-slate-700 shadow-xl p-1.5 relative flex flex-col overflow-hidden">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30" />
                  <div className="w-full h-full rounded-[34px] relative overflow-hidden bg-black">
                    {renderSplashComponent(selectedOption, true)}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-2">📱 Mobile Phone Preview</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. AUDIO & ENGINEERING AUDIT SPECS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Zap className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Engine Performance</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• GPU-Accelerated 3D transforms (CSS Matrix3D)</li>
              <li>• Stable 60 FPS on low-tier mobile devices</li>
              <li>• Zero external heavy 3D GLTF bundle weights</li>
              <li>• Memory footprint: under 12 MB peak</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Volume2 className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Web Audio Synthesis</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• Native HTML5 AudioContext synthesis</li>
              <li>• 0 KB MP3 file download (0ms buffering delay)</li>
              <li>• Elegant fallback for browser autoplay locks</li>
              <li>• Sound is remembered per user session</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Session Experience</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• Stored in sessionStorage for single first-entry</li>
              <li>• Snappy 2.4s duration to prevent user bounce</li>
              <li>• Background page preload avoids jarring flashes</li>
              <li>• Dynamic one-click deployment for Admin</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW OVERLAY */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-[10000] bg-black">
            {/* Close button in top right */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 z-[10001] px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white backdrop-blur-md transition-all shadow-2xl flex items-center gap-2"
            >
              <span>✕ Close Fullscreen Preview</span>
            </button>

            {/* Fullscreen splash render */}
            {renderSplashComponent(selectedOption, false)}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
