import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Cpu, Tag, Shield, Battery, Zap, Eye, Info, Heart, 
  Layers, Compass, Award, Activity, CheckCircle, Maximize2, Clock, 
  Sliders, ExternalLink, Move, Trash2, Edit3, Volume2,
  Store, Bus, Building2, GraduationCap, Trophy, Trees, Train, MapPin, Briefcase, Navigation
} from 'lucide-react';
import { Callout, CardPosition, CalloutTheme } from '../types';
import { playSound } from '../utils/audio';

// Helper icon resolver including public facilities (pasar, halte bus, terminal, sekolah, kantor, lapangan)
export function getCalloutIcon(iconName: string, className = "w-4 h-4") {
  const map: Record<string, React.ReactNode> = {
    // Fasilitas Publik & Peta
    store: <Store className={className} />,
    pasar: <Store className={className} />,
    bus: <Bus className={className} />,
    'halte-bus': <Bus className={className} />,
    halte: <Bus className={className} />,
    terminal: <Train className={className} />,
    stasiun: <Train className={className} />,
    school: <GraduationCap className={className} />,
    sekolah: <GraduationCap className={className} />,
    building: <Building2 className={className} />,
    kantor: <Building2 className={className} />,
    lapangan: <Trophy className={className} />,
    trophy: <Trophy className={className} />,
    trees: <Trees className={className} />,
    'map-pin': <MapPin className={className} />,
    briefcase: <Briefcase className={className} />,
    navigation: <Navigation className={className} />,

    // Fitur & Produk Umum
    sparkles: <Sparkles className={className} />,
    camera: <Camera className={className} />,
    cpu: <Cpu className={className} />,
    tag: <Tag className={className} />,
    shield: <Shield className={className} />,
    battery: <Battery className={className} />,
    zap: <Zap className={className} />,
    eye: <Eye className={className} />,
    info: <Info className={className} />,
    heart: <Heart className={className} />,
    layers: <Layers className={className} />,
    compass: <Compass className={className} />,
    award: <Award className={className} />,
    activity: <Activity className={className} />,
    'check-circle': <CheckCircle className={className} />,
    'maximize-2': <Maximize2 className={className} />,
    clock: <Clock className={className} />,
    sliders: <Sliders className={className} />,
  };
  return map[iconName] || <Sparkles className={className} />;
}

interface CalloutOverlayProps {
  callouts: Callout[];
  selectedId: string | null;
  onSelectCallout: (id: string) => void;
  onUpdateCallout: (callout: Callout) => void;
  onDeleteCallout?: (id: string) => void;
  soundEnabled: boolean;
  displayMode: 'hover' | 'click' | 'always';
  isEditing: boolean;
  tourActiveId?: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  animationKey?: number;
}

export const CalloutOverlay: React.FC<CalloutOverlayProps> = ({
  callouts,
  selectedId,
  onSelectCallout,
  onUpdateCallout,
  onDeleteCallout,
  soundEnabled,
  displayMode,
  isEditing,
  tourActiveId,
  containerRef,
  animationKey = 0,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);

  // Handle Dragging Pin
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setDraggingPinId(id);
    onSelectCallout(id);
    playSound('click', soundEnabled);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingPinId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(3, Math.min(97, Math.round(x * 10) / 10));
      const clampedY = Math.max(3, Math.min(97, Math.round(y * 10) / 10));

      const targetCallout = callouts.find(c => c.id === draggingPinId);
      if (targetCallout) {
        onUpdateCallout({
          ...targetCallout,
          targetX: clampedX,
          targetY: clampedY,
        });
      }
    };

    const handlePointerUp = () => {
      if (draggingPinId) {
        setDraggingPinId(null);
      }
    };

    if (draggingPinId) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingPinId, callouts, onUpdateCallout, containerRef]);

  // Determine if a card / text is open
  const isContentVisible = (c: Callout) => {
    if (c.boxType === 'none') return true;
    if (tourActiveId) return tourActiveId === c.id;
    if (displayMode === 'always') return true;
    if (selectedId === c.id) return true;
    if (displayMode === 'hover' && hoveredId === c.id) return true;
    return false;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* SVG Connector Lines with Entrance Drawing Animation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Dynamic Arrowhead Markers per color */}
          {callouts.map(c => (
            <marker
              key={`arrow-marker-${c.id}-${animationKey}`}
              id={`arrowhead-${c.id}`}
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={c.accentColor || '#06b6d4'} />
            </marker>
          ))}
        </defs>

        {callouts.filter(c => c.visible && isContentVisible(c)).map((c, index) => {
          const color = c.accentColor || '#06b6d4';
          const isSelected = selectedId === c.id || tourActiveId === c.id;
          const strokeWidth = c.lineWidth || (isSelected ? 2.5 : 1.8);

          // Compute connector line coordinates based on cardPosition or lineLength
          const offsetDist = c.lineLength || 18;
          const isRight = c.cardPosition.includes('right') || c.targetX < 50;
          const isBottom = c.cardPosition.includes('bottom') || c.targetY < 30;

          const offsetX = isRight ? offsetDist : -offsetDist;
          const offsetY = isBottom ? (offsetDist * 0.75) : -(offsetDist * 0.75);

          const startX = `${c.targetX}%`;
          const startY = `${c.targetY}%`;
          const endX = `${Math.max(2, Math.min(98, c.targetX + offsetX))}%`;
          const endY = `${Math.max(2, Math.min(98, c.targetY + offsetY))}%`;

          if (c.connectorType === 'none') return null;

          const delaySec = index * 0.12;

          return (
            <g key={`line-group-${c.id}-${animationKey}`} opacity={isSelected ? 1 : 0.9}>
              {/* Glowing accent stroke with dynamic draw animation */}
              <line
                key={`line-${c.id}-${animationKey}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth={strokeWidth}
                pathLength={100}
                strokeDasharray={c.connectorType === 'dashed' ? '4,4' : '100'}
                filter="url(#glow)"
                markerStart={c.showArrowHead ? `url(#arrowhead-${c.id})` : undefined}
                className={c.connectorType !== 'dashed' ? 'animate-draw-line' : ''}
                style={{
                  animationDelay: `${delaySec}s`,
                }}
              />
              {/* Line endpoint marker dot */}
              <circle 
                cx={endX} 
                cy={endY} 
                r="3.5" 
                fill={color} 
                className="animate-scale-in"
                style={{
                  animationDelay: `${delaySec + 0.35}s`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Render Callout Pins, Lines, & Title/Cards */}
      {callouts.filter(c => c.visible).map((c, index) => {
        const isSelected = selectedId === c.id;
        const isTourStep = tourActiveId === c.id;
        const isVisible = isContentVisible(c);
        const color = c.accentColor || '#06b6d4';
        const boxType = c.boxType || 'card';
        const titleAtLineEnd = c.titleAtLineEnd !== false; // Default true when line-only or requested

        // Custom box width calculation
        let widthPx = c.boxWidth || 280;
        if (c.boxSize === 'sm') widthPx = 180;
        else if (c.boxSize === 'lg') widthPx = 360;

        // Custom opacity calculation (0 to 100)
        const opacityPercent = c.boxOpacity !== undefined ? c.boxOpacity : 90;
        const bgAlpha = opacityPercent / 100;

        // Line Endpoint Exact Coordinates for "Judul tepat di ujung titik garis"
        const offsetDist = c.lineLength || 18;
        const isRight = c.cardPosition.includes('right') || c.targetX < 50;
        const isBottom = c.cardPosition.includes('bottom') || c.targetY < 35;

        const offsetX = isRight ? offsetDist : -offsetDist;
        const offsetY = isBottom ? (offsetDist * 0.75) : -(offsetDist * 0.75);

        const endX = Math.max(2, Math.min(98, c.targetX + offsetX));
        const endY = Math.max(2, Math.min(98, c.targetY + offsetY));

        const delaySec = index * 0.12;

        return (
          <React.Fragment key={`callout-group-${c.id}-${animationKey}`}>
            {/* 1. THE PIN ANCHOR AT TARGET OBJECT (Animated scale-in) */}
            <div
              className="absolute transition-transform duration-200 animate-scale-in"
              style={{
                left: `${c.targetX}%`,
                top: `${c.targetY}%`,
                zIndex: isSelected || isTourStep ? 40 : 25,
                animationDelay: `${delaySec}s`,
              }}
            >
              <div
                className={`relative -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group touch-none`}
                onPointerDown={(e) => handlePointerDown(e, c.id)}
                onMouseEnter={() => {
                  setHoveredId(c.id);
                  playSound('hover', soundEnabled);
                }}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCallout(c.id);
                  playSound('click', soundEnabled);
                }}
              >
                {/* Outer pulsing wave */}
                {c.animation === 'pulse' && (
                  <div
                    className="absolute -inset-3 rounded-full animate-ping opacity-60"
                    style={{ backgroundColor: color }}
                  />
                )}

                {/* Radar sweep ring */}
                {c.animation === 'radar' && (
                  <div
                    className="absolute -inset-4 rounded-full border border-dashed animate-radar opacity-80"
                    style={{ borderColor: color }}
                  />
                )}

                {/* Center Pin Button */}
                <div
                  className={`relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
                    isSelected || isTourStep ? 'w-10 h-10 ring-4' : 'w-8 h-8 group-hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: '#0f172a',
                    border: `2.5px solid ${color}`,
                    color: color,
                    boxShadow: `0 0 15px ${color}66`,
                  }}
                >
                  {getCalloutIcon(c.icon, isSelected ? 'w-5 h-5' : 'w-4 h-4')}

                  {/* Drag handle indicator when in editing mode */}
                  {isEditing && isSelected && (
                    <div className="absolute -top-6 -right-2 bg-slate-900 border border-cyan-400 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-mono">
                      <Move className="w-2.5 h-2.5" />
                      <span>Geser</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. JUDUL TEPAT DI UJUNG TITIK GARIS (ANIMATED REVEAL) */}
            {(boxType === 'none' || boxType === 'text-only' || titleAtLineEnd) && boxType !== 'card' && isVisible && (
              <div
                className={`absolute pointer-events-auto z-30 transition-all duration-200 cursor-pointer ${
                  isRight ? 'animate-reveal-right' : 'animate-reveal-left'
                }`}
                style={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  transform: isRight 
                    ? 'translate(10px, -50%)' 
                    : 'translate(calc(-100% - 10px), -50%)',
                  animationDelay: `${delaySec + 0.35}s`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCallout(c.id);
                  playSound('click', soundEnabled);
                }}
              >
                <div 
                  className={`flex flex-col ${isRight ? 'items-start text-left' : 'items-end text-right'} group`}
                >
                  {/* Badge above title */}
                  {c.badgeText && (
                    <span 
                      className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded mb-0.5 whitespace-nowrap shadow-sm"
                      style={{ 
                        backgroundColor: `${color}25`, 
                        color: color,
                        border: `1px solid ${color}66`
                      }}
                    >
                      {c.badgeText}
                    </span>
                  )}

                  {/* Title directly at endpoint with high-impact readable styling */}
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="font-extrabold text-white text-xs sm:text-sm tracking-wide whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] px-1.5 py-0.5 rounded"
                      style={{ 
                        textShadow: `0 0 10px ${color}88, 0 2px 6px rgba(0,0,0,0.95)`,
                        backgroundColor: 'rgba(2, 6, 23, 0.5)',
                        borderBottom: `2px solid ${color}`
                      }}
                    >
                      {c.title}
                    </span>
                  </div>

                  {/* Description if in text-only mode */}
                  {boxType === 'text-only' && c.description && (
                    <p 
                      className="text-[11px] text-slate-200 font-medium max-w-[220px] mt-1 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {c.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3. LENCANA MINI (boxType === 'badge-only') */}
            {boxType === 'badge-only' && isVisible && (
              <div
                className={`absolute pointer-events-auto z-30 transition-all duration-300 ${
                  isRight ? 'animate-reveal-right' : 'animate-reveal-left'
                }`}
                style={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  transform: isRight ? 'translate(10px, -50%)' : 'translate(calc(-100% - 10px), -50%)',
                  animationDelay: `${delaySec + 0.35}s`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCallout(c.id);
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-full border shadow-xl flex items-center gap-1.5 whitespace-nowrap font-bold text-xs"
                  style={{
                    backgroundColor: `rgba(15, 23, 42, ${bgAlpha})`,
                    borderColor: color,
                    color: '#ffffff',
                    backdropFilter: opacityPercent < 90 ? 'blur(8px)' : undefined,
                    boxShadow: `0 4px 15px ${color}33`,
                  }}
                >
                  <span style={{ color: color }}>●</span>
                  <span>{c.badgeText || c.title}</span>
                </div>
              </div>
            )}

            {/* 4. KOTAK LENGKAP (boxType === 'card' with animated reveal) */}
            {boxType === 'card' && isVisible && (
              <div
                className="absolute pointer-events-auto z-30 transition-all duration-300 animate-reveal-card"
                style={{
                  left: `${endX}%`,
                  top: `${endY}%`,
                  transform: isRight ? 'translate(10px, -30%)' : 'translate(calc(-100% - 10px), -30%)',
                  width: `min(${widthPx}px, 75vw)`,
                  animationDelay: `${delaySec + 0.35}s`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Theme Variant: CYBER HUD */}
                {c.theme === 'cyber' && (
                  <div
                    className="relative border p-3.5 rounded-lg shadow-2xl overflow-hidden font-sans transition-all"
                    style={{
                      backgroundColor: `rgba(2, 6, 23, ${bgAlpha})`,
                      borderColor: color,
                      backdropFilter: opacityPercent < 90 ? 'blur(12px)' : undefined,
                      boxShadow: `0 8px 32px ${color}33, inset 0 0 16px ${color}11`,
                    }}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: color }} />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: color }} />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: color }} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: color }} />

                    <div className="flex items-center justify-between gap-2 mb-1.5 text-[10px] font-mono">
                      <span
                        className="px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold"
                        style={{ backgroundColor: `${color}22`, color: color }}
                      >
                        {c.badgeText || c.category}
                      </span>
                      <span className="text-slate-400 text-[9px]">
                        X:{Math.round(c.targetX)}% Y:{Math.round(c.targetY)}%
                      </span>
                    </div>

                    <h4 
                      className="font-bold text-white tracking-wide mb-1 leading-snug"
                      style={{ fontSize: widthPx < 220 ? '12px' : '14px' }}
                    >
                      {c.title}
                    </h4>

                    {c.description && (
                      <p 
                        className="text-slate-300 leading-relaxed mb-2.5"
                        style={{ fontSize: widthPx < 220 ? '11px' : '12px' }}
                      >
                        {c.description}
                      </p>
                    )}

                    {c.actionUrl && (
                      <a
                        href={c.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                        style={{
                          backgroundColor: color,
                          color: '#020617',
                        }}
                      >
                        <span>{c.actionLabel || 'Kunjungi Tautan'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Theme Variant: MODERN GLASS */}
                {c.theme === 'glass' && (
                  <div
                    className="relative border p-3.5 rounded-2xl shadow-2xl text-slate-100 transition-all"
                    style={{
                      backgroundColor: `rgba(15, 23, 42, ${bgAlpha})`,
                      borderColor: opacityPercent === 0 ? color : 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: opacityPercent < 90 ? 'blur(16px)' : undefined,
                      boxShadow: `0 16px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px ${color}44`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-medium tracking-wide uppercase text-slate-300">
                        {c.badgeText || 'Detail'}
                      </span>
                    </div>

                    <h4 
                      className="font-bold text-white mb-1"
                      style={{ fontSize: widthPx < 220 ? '12px' : '14px' }}
                    >
                      {c.title}
                    </h4>

                    {c.description && (
                      <p 
                        className="text-slate-300 leading-relaxed mb-2"
                        style={{ fontSize: widthPx < 220 ? '11px' : '12px' }}
                      >
                        {c.description}
                      </p>
                    )}

                    {c.actionUrl && (
                      <a
                        href={c.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        <span>{c.actionLabel || 'Pelajari Lebih Lanjut'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Theme Variant: PRODUCT / PRICE TAG */}
                {c.theme === 'badge' && (
                  <div 
                    className="relative border p-3.5 rounded-xl shadow-xl transition-all"
                    style={{
                      backgroundColor: `rgba(15, 23, 42, ${bgAlpha})`,
                      borderColor: color,
                      backdropFilter: opacityPercent < 90 ? 'blur(12px)' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span 
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: `${color}22`, borderColor: color, color: color }}
                      >
                        <Tag className="w-3 h-3" />
                        {c.badgeText || 'Produk'}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                        {c.category}
                      </span>
                    </div>

                    <h4 
                      className="font-bold text-white mb-1"
                      style={{ fontSize: widthPx < 220 ? '12px' : '14px' }}
                    >
                      {c.title}
                    </h4>

                    {c.description && (
                      <p 
                        className="text-slate-300 leading-relaxed mb-2.5"
                        style={{ fontSize: widthPx < 220 ? '11px' : '12px' }}
                      >
                        {c.description}
                      </p>
                    )}

                    {c.actionUrl && (
                      <a
                        href={c.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg text-slate-950 transition-colors shadow"
                        style={{ backgroundColor: color }}
                      >
                        <span>{c.actionLabel || 'Beli Sekarang'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Theme Variant: NEON VIBRANT */}
                {c.theme === 'neon' && (
                  <div
                    className="relative p-3.5 rounded-xl border-2 shadow-2xl transition-all"
                    style={{
                      backgroundColor: `rgba(0, 0, 0, ${bgAlpha})`,
                      borderColor: color,
                      backdropFilter: opacityPercent < 90 ? 'blur(10px)' : undefined,
                      boxShadow: `0 0 20px ${color}88, inset 0 0 10px ${color}44`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-widest"
                        style={{ color: color }}
                      >
                        {c.badgeText || 'Highlight'}
                      </span>
                    </div>

                    <h4 
                      className="font-black text-white mb-1"
                      style={{ fontSize: widthPx < 220 ? '12px' : '14px' }}
                    >
                      {c.title}
                    </h4>

                    {c.description && (
                      <p 
                        className="text-slate-200 leading-relaxed mb-2 font-medium"
                        style={{ fontSize: widthPx < 220 ? '11px' : '12px' }}
                      >
                        {c.description}
                      </p>
                    )}

                    {c.actionUrl && (
                      <a
                        href={c.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold underline"
                        style={{ color: color }}
                      >
                        <span>{c.actionLabel || 'Lihat Info'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Theme Variant: POP / COMIC BUBBLE */}
                {c.theme === 'pop' && (
                  <div 
                    className="relative text-slate-900 p-3.5 rounded-2xl shadow-2xl border-2 border-slate-900 transition-all"
                    style={{
                      backgroundColor: `rgba(255, 255, 255, ${bgAlpha})`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-extrabold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-md">
                        {c.badgeText || 'Wow!'}
                      </span>
                    </div>

                    <h4 
                      className="font-extrabold text-slate-900 mb-1"
                      style={{ fontSize: widthPx < 220 ? '12px' : '14px' }}
                    >
                      {c.title}
                    </h4>

                    {c.description && (
                      <p 
                        className="text-slate-700 leading-relaxed font-medium"
                        style={{ fontSize: widthPx < 220 ? '11px' : '12px' }}
                      >
                        {c.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
