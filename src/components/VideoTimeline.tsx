import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward, Flag } from 'lucide-react';
import { Callout } from '../types';

interface VideoTimelineProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  callouts: Callout[];
  selectedCalloutId: string | null;
  onSelectCallout: (id: string) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  videoRef,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  callouts,
  selectedCalloutId,
  onSelectCallout,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [playbackRate, setPlaybackRate] = React.useState<number>(1);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleSpeedToggle = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md shadow-xl flex flex-col gap-2.5">
      {/* Visual Timeline Scrub Bar with Markers */}
      <div className="relative pt-2 pb-1">
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer group transition-all hover:h-4 overflow-visible"
        >
          {/* Filled Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Current playhead knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-cyan-500 -ml-2 pointer-events-none group-hover:scale-125 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Callout Marker Pins on Timeline */}
          {callouts.map((c) => {
            if (duration <= 0) return null;
            const markerPos = (c.timestamp / duration) * 100;
            if (markerPos < 0 || markerPos > 100) return null;
            const isSelected = selectedCalloutId === c.id;

            return (
              <div
                key={`timeline-marker-${c.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(c.timestamp);
                  onSelectCallout(c.id);
                }}
                className={`absolute top-0 -translate-x-1/2 h-full z-10 cursor-pointer transition-transform hover:scale-125 ${
                  isSelected ? 'z-20' : ''
                }`}
                style={{ left: `${markerPos}%` }}
                title={`${c.title} (${formatTime(c.timestamp)})`}
              >
                {/* Marker Flag */}
                <div
                  className={`w-2.5 h-full rounded-sm shadow-md ${
                    isSelected ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.accentColor || '#06b6d4' }}
                />
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-[10px] text-white px-1 rounded pointer-events-none whitespace-nowrap border border-slate-700"
                >
                  {c.badgeText || c.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold transition-transform active:scale-95 shadow"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Replay */}
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Mulai dari Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time display */}
          <div className="font-mono text-slate-200 text-xs px-2 py-1 rounded bg-slate-950/60 border border-slate-800">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Callout Marker quick stats */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Flag className="w-3.5 h-3.5 text-cyan-400" />
          <span>{callouts.length} Marker Callout di Video</span>
        </div>

        {/* Speed & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeedToggle}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-semibold transition-colors"
            title="Kecepatan Putar"
          >
            {playbackRate}x
          </button>

          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Batal Senyap' : 'Senyap'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
