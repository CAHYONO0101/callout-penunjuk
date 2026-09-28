import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, X, ExternalLink, Volume2, Sparkles } from 'lucide-react';
import { Callout } from '../types';
import { getCalloutIcon } from './CalloutOverlay';
import { playSound } from '../utils/audio';

interface TourPresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  callouts: Callout[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  soundEnabled: boolean;
}

export const TourPresentationMode: React.FC<TourPresentationModeProps> = ({
  isOpen,
  onClose,
  callouts,
  currentIndex,
  onIndexChange,
  soundEnabled,
}) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (isAutoPlaying && isOpen && callouts.length > 0) {
      timer = setInterval(() => {
        onIndexChange((currentIndex + 1) % callouts.length);
        playSound('tourStep', soundEnabled);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, isOpen, currentIndex, callouts.length, onIndexChange, soundEnabled]);

  if (!isOpen || callouts.length === 0) return null;

  const current = callouts[currentIndex] || callouts[0];
  const color = current.accentColor || '#06b6d4';

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % callouts.length;
    onIndexChange(nextIdx);
    playSound('tourStep', soundEnabled);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + callouts.length) % callouts.length;
    onIndexChange(prevIdx);
    playSound('tourStep', soundEnabled);
  };

  return (
    <div className="absolute inset-x-0 bottom-6 z-40 flex justify-center pointer-events-none px-4">
      <div 
        className="w-full max-w-xl bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl pointer-events-auto text-white flex flex-col gap-3 animate-in slide-in-from-bottom-5"
        style={{
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${color}33`,
        }}
      >
        {/* Top bar in card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
              {getCalloutIcon(current.icon, 'w-4 h-4')}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color: color }}
            >
              {current.badgeText || `Sorotan ${currentIndex + 1}`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({currentIndex + 1} / {callouts.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                isAutoPlaying ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isAutoPlaying ? 'Jeda Tur Otomatis' : 'Putar Tur Otomatis'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">Auto Tur</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Headline & Description */}
        <div>
          <h3 className="text-base font-bold text-white mb-1 leading-snug">
            {current.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Footer controls & steps indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1">
            {callouts.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  onIndexChange(i);
                  playSound('tourStep', soundEnabled);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow"
              title="Selanjutnya"
            >
              <span>Lanjut</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
