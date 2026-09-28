import React, { useState } from 'react';
import { 
  Plus, Trash2, Copy, Eye, EyeOff, Wand2, Settings2, Palette, 
  Layers, Volume2, VolumeX, Sparkles, Clock, ExternalLink, 
  ChevronRight, Check, Move, ArrowRight, Sliders, Minus, Maximize,
  ArrowUpRight, Square, Type, Tag as TagIcon, Layout
} from 'lucide-react';
import { Callout, CalloutCategory, CalloutTheme, CalloutAnimation, ConnectorType, CalloutBoxType } from '../types';
import { getCalloutIcon } from './CalloutOverlay';
import { playSound } from '../utils/audio';

interface CalloutEditorSidebarProps {
  callouts: Callout[];
  selectedId: string | null;
  onSelectCallout: (id: string | null) => void;
  onUpdateCallout: (callout: Callout) => void;
  onDeleteCallout: (id: string) => void;
  onAddCallout: () => void;
  onDuplicateCallout: (id: string) => void;
  mediaType: 'image' | 'video';
  currentVideoTime: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  displayMode: 'hover' | 'click' | 'always';
  onChangeDisplayMode: (mode: 'hover' | 'click' | 'always') => void;
  onOpenAiModal: () => void;
  onReplayAnimation?: () => void;
}

const FACILITY_ICONS = [
  { id: 'store', label: 'Pasar' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'bus', label: 'Halte Bus' },
  { id: 'school', label: 'Sekolah' },
  { id: 'building', label: 'Kantor' },
  { id: 'lapangan', label: 'Lapangan' },
  { id: 'trees', label: 'Taman' },
  { id: 'map-pin', label: 'Pin Peta' },
];

const GENERAL_ICONS = [
  { id: 'sparkles', label: 'Sorotan' },
  { id: 'camera', label: 'Kamera' },
  { id: 'cpu', label: 'Prosesor' },
  { id: 'tag', label: 'Harga' },
  { id: 'shield', label: 'Proteksi' },
  { id: 'battery', label: 'Baterai' },
  { id: 'zap', label: 'Kilat' },
  { id: 'eye', label: 'Tampilan' },
  { id: 'info', label: 'Info' },
  { id: 'heart', label: 'Favorit' },
  { id: 'compass', label: 'Kompas' },
  { id: 'award', label: 'Prestasi' },
];

const ACCENT_COLORS = [
  { name: 'Cyan Tech', hex: '#06b6d4' },
  { name: 'Emerald Eco', hex: '#10b981' },
  { name: 'Violet Future', hex: '#8b5cf6' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Rose Danger', hex: '#f43f5e' },
  { name: 'Blue Electric', hex: '#3b82f6' },
  { name: 'Neon Lime', hex: '#84cc16' },
];

export const CalloutEditorSidebar: React.FC<CalloutEditorSidebarProps> = ({
  callouts,
  selectedId,
  onSelectCallout,
  onUpdateCallout,
  onDeleteCallout,
  onAddCallout,
  onDuplicateCallout,
  mediaType,
  currentVideoTime,
  soundEnabled,
  onToggleSound,
  displayMode,
  onChangeDisplayMode,
  onOpenAiModal,
  onReplayAnimation,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'settings'>('list');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineVariations, setRefineVariations] = useState<any[]>([]);

  const selectedCallout = callouts.find(c => c.id === selectedId) || null;

  // Auto switch to edit tab when selecting a callout
  const handleSelectAndEdit = (id: string) => {
    onSelectCallout(id);
    setActiveTab('edit');
    playSound('click', soundEnabled);
  };

  const handleRefineText = async () => {
    if (!selectedCallout) return;
    setIsRefining(true);
    playSound('scan', soundEnabled);
    try {
      const res = await fetch('/api/refine-callout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedCallout.title,
          description: selectedCallout.description,
          context: selectedCallout.badgeText || '',
        }),
      });
      const data = await res.json();
      if (data.variations) {
        setRefineVariations(data.variations);
        playSound('success', soundEnabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const applyVariation = (v: any) => {
    if (!selectedCallout) return;
    onUpdateCallout({
      ...selectedCallout,
      title: v.title || selectedCallout.title,
      description: v.description || selectedCallout.description,
      badgeText: v.badge || selectedCallout.badgeText,
    });
    setRefineVariations([]);
    playSound('click', soundEnabled);
  };

  const currentBoxType = selectedCallout?.boxType || 'card';
  const currentOpacity = selectedCallout?.boxOpacity !== undefined ? selectedCallout.boxOpacity : 90;
  const currentWidth = selectedCallout?.boxWidth || (selectedCallout?.boxSize === 'sm' ? 180 : selectedCallout?.boxSize === 'lg' ? 360 : 280);

  return (
    <aside className="w-full lg:w-88 xl:w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Top Sidebar Header & Tabs */}
      <div className="border-b border-slate-800 px-4 pt-3 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Panel Callout
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-400">
              {callouts.length} Titik
            </span>
          </div>

          {/* Quick AI Scan Button */}
          <button
            onClick={onOpenAiModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Otomatis</span>
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex text-xs font-semibold">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar ({callouts.length})
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            disabled={!selectedCallout}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-cyan-500 text-cyan-400'
                : selectedCallout
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 cursor-not-allowed'
            }`}
          >
            Edit Detail
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pengaturan
          </button>
        </div>
      </div>

      {/* Sidebar Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: LIST OF CALLOUTS */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {/* Add Callout Button */}
            <button
              onClick={() => {
                onAddCallout();
                playSound('click', soundEnabled);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Callout Baru (Klik Kanvas)</span>
            </button>

            {/* List */}
            {callouts.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <Layers className="w-6 h-6" />
                </div>
                <h5 className="text-xs font-bold text-slate-300 mb-1">Belum Ada Callout</h5>
                <p className="text-[11px] text-slate-500 mb-4">
                  Klik titik manapun pada foto/video atau gunakan deteksi AI otomatis untuk mulai.
                </p>
                <button
                  onClick={onOpenAiModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Pindai dengan AI</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {callouts.map((c) => {
                  const isSelected = selectedId === c.id;
                  const color = c.accentColor || '#06b6d4';
                  const bType = c.boxType || 'card';

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectAndEdit(c.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-500/10'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}25`, color: color }}
                        >
                          {getCalloutIcon(c.icon, 'w-3.5 h-3.5')}
                        </div>

                        <span className="text-xs font-bold text-white truncate flex-1">
                          {c.title}
                        </span>

                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCallout({ ...c, visible: !c.visible });
                            playSound('click', soundEnabled);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                          title={c.visible ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {c.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateCallout(c.id);
                            playSound('click', soundEnabled);
                          }}
                          className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Duplikat"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCallout(c.id);
                            playSound('delete', soundEnabled);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span
                          className="px-1.5 py-0.5 rounded font-semibold uppercase"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          {bType === 'none' ? '📏 Garis Saja' : bType === 'text-only' ? '✍️ Teks Saja' : bType === 'badge-only' ? '🏷️ Lencana' : (c.badgeText || c.theme)}
                        </span>
                        <span>X: {Math.round(c.targetX)}% Y: {Math.round(c.targetY)}%</span>
                        {mediaType === 'video' && (
                          <span className="text-cyan-400">@{c.timestamp}s</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDIT SELECTED CALLOUT */}
        {activeTab === 'edit' && selectedCallout && (
          <div className="space-y-4 text-xs">
            {/* 1. TIPE TAMPILAN: GARIS SAJA vs KOTAK vs TEKS (Requested by User) */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block font-bold text-white text-xs flex items-center justify-between">
                <span>Model Tampilan Callout:</span>
                <span className="text-[10px] text-cyan-400 font-normal">Sesuai Kebutuhan</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Hanya Garis', icon: <Minus className="w-3.5 h-3.5" />, desc: 'Garis penunjuk tanpa kotak' },
                  { id: 'text-only', label: 'Garis + Teks', icon: <Type className="w-3.5 h-3.5" />, desc: 'Teks melayang tanpa background' },
                  { id: 'card', label: 'Kotak Lengkap', icon: <Square className="w-3.5 h-3.5" />, desc: 'Kartu deskripsi & spesifikasi' },
                  { id: 'badge-only', label: 'Lencana Mini', icon: <TagIcon className="w-3.5 h-3.5" />, desc: 'Pill / tag kecil di ujung garis' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      onUpdateCallout({ ...selectedCallout, boxType: mode.id as CalloutBoxType });
                      playSound('click', soundEnabled);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      currentBoxType === mode.id
                        ? 'border-cyan-500 bg-cyan-500/15 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5 text-cyan-400">
                      {mode.icon}
                      <span>{mode.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {mode.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TRANSPARANSI & UKURAN KOTAK (Hanya jika bukan 'none') */}
            {currentBoxType !== 'none' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Transparansi & Ukuran Kotak</span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Opacity: {currentOpacity}% | Lebar: {currentWidth}px
                  </span>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span>Transparansi Latar Kotak:</span>
                    <span className="font-mono text-cyan-300">
                      {currentOpacity === 0 ? '0% (Bening Penuh)' : currentOpacity === 100 ? '100% (Solid Pekat)' : `${currentOpacity}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={currentOpacity}
                    onChange={(e) => onUpdateCallout({ ...selectedCallout, boxOpacity: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  {/* Quick Preset Buttons for Opacity */}
                  <div className="flex items-center justify-between gap-1.5 mt-1.5">
                    {[
                      { label: '0% Bening', val: 0 },
                      { label: '25% Kaca', val: 25 },
                      { label: '60% Semi', val: 60 },
                      { label: '90% Standar', val: 90 },
                      { label: '100% Solid', val: 100 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {
                          onUpdateCallout({ ...selectedCallout, boxOpacity: p.val });
                          playSound('click', soundEnabled);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                          currentOpacity === p.val
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box Size / Width Slider (Besar Kecilnya Kotak) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span>Ukuran Lebar Kotak (Besar / Kecil):</span>
                    <span className="font-mono text-cyan-300">{currentWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="420"
                    step="10"
                    value={currentWidth}
                    onChange={(e) => onUpdateCallout({ ...selectedCallout, boxWidth: parseInt(e.target.value), boxSize: 'custom' })}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  {/* Preset Size Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {[
                      { id: 'sm', label: 'Kecil (180px)', width: 180 },
                      { id: 'md', label: 'Sedang (280px)', width: 280 },
                      { id: 'lg', label: 'Besar (360px)', width: 360 },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => {
                          onUpdateCallout({ ...selectedCallout, boxWidth: sz.width, boxSize: sz.id as any });
                          playSound('click', soundEnabled);
                        }}
                        className={`py-1 rounded text-[11px] font-semibold text-center transition-colors ${
                          currentWidth === sz.width
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PENGATURAN GARIS (Ketebalan, Arrowhead, Panjang Garis) */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="font-bold text-white text-xs block">Pengaturan Garis Penunjuk</span>

              {/* Arrowhead toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Tampilkan Ujung Panah (Arrowhead):</span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateCallout({ ...selectedCallout, showArrowHead: !selectedCallout.showArrowHead });
                    playSound('click', soundEnabled);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    selectedCallout.showArrowHead ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.75 transition-transform ${
                      selectedCallout.showArrowHead ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Line Width (Ketebalan Garis) */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Ketebalan Garis:</span>
                  <span className="font-mono text-cyan-300">{selectedCallout.lineWidth || 2} px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={selectedCallout.lineWidth || 2}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, lineWidth: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Line Length / Distance */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Panjang Jangkauan Garis:</span>
                  <span className="font-mono text-cyan-300">{selectedCallout.lineLength || 18}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="1"
                  value={selectedCallout.lineLength || 18}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, lineLength: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Title Exactly At Line Endpoint Toggle */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-200 font-semibold block">Judul Tepat di Ujung Titik Garis:</span>
                  <span className="text-[10px] text-cyan-400 block">Menempel langsung di kepala garis (Leader Line)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = selectedCallout.titleAtLineEnd !== undefined ? !selectedCallout.titleAtLineEnd : false;
                    onUpdateCallout({ ...selectedCallout, titleAtLineEnd: nextVal });
                    playSound('click', soundEnabled);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                    selectedCallout.titleAtLineEnd !== false ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                  title="Tempatkan judul tepat di ujung titik garis"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.75 transition-transform ${
                      selectedCallout.titleAtLineEnd !== false ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Replay Line & Description Entrance Animation Button */}
              {onReplayAnimation && (
                <button
                  type="button"
                  onClick={() => {
                    onReplayAnimation();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all shadow-sm active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Uji Animasi Muncul Garis & Keterangan</span>
                </button>
              )}
            </div>

            {/* Title & AI Refine */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">Judul Callout:</label>
                <button
                  onClick={handleRefineText}
                  disabled={isRefining}
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>{isRefining ? 'Memoles...' : 'Poles Teks AI'}</span>
                </button>
              </div>
              <input
                type="text"
                value={selectedCallout.title}
                onChange={(e) => onUpdateCallout({ ...selectedCallout, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                placeholder="Contoh: Sensor 50MP Sony IMX..."
              />
            </div>

            {/* AI Refine Suggestions Box */}
            {refineVariations.length > 0 && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>Pilihan AI:</span>
                  <button onClick={() => setRefineVariations([])} className="text-slate-400 hover:text-white">✕</button>
                </div>
                {refineVariations.map((v, i) => (
                  <div
                    key={i}
                    onClick={() => applyVariation(v)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 cursor-pointer transition-all"
                  >
                    <div className="text-[10px] uppercase font-bold text-cyan-400 mb-0.5">{v.style}</div>
                    <div className="font-bold text-white text-xs">{v.title}</div>
                    <div className="text-[11px] text-slate-300">{v.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Description (hanya relevan jika ada teks / card) */}
            {currentBoxType !== 'none' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Deskripsi / Penjelasan:</label>
                <textarea
                  rows={2}
                  value={selectedCallout.description}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  placeholder="Keterangan singkat dan menarik tentang fitur ini..."
                />
              </div>
            )}

            {/* Badge Text & Category */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teks Lencana (Badge):</label>
                <input
                  type="text"
                  value={selectedCallout.badgeText || ''}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, badgeText: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Misal: Rp 1.999.000 / Spek"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kategori:</label>
                <select
                  value={selectedCallout.category}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, category: e.target.value as CalloutCategory })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="fitur">Fitur Utama</option>
                  <option value="spek">Spesifikasi</option>
                  <option value="harga">Harga & Belanja</option>
                  <option value="sorotan">Sorotan / Highlight</option>
                  <option value="desain">Desain / Material</option>
                  <option value="tips">Tips & Edukasi</option>
                </select>
              </div>
            </div>

            {/* Visual Theme Selector (jika boxType === 'card') */}
            {currentBoxType === 'card' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Gaya Visual Kartu:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cyber', label: 'Cyber HUD' },
                    { id: 'glass', label: 'Frosted Glass' },
                    { id: 'badge', label: 'Tag Produk' },
                    { id: 'neon', label: 'Neon Glow' },
                    { id: 'pop', label: 'Comic Pop' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        onUpdateCallout({ ...selectedCallout, theme: th.id as CalloutTheme });
                        playSound('click', soundEnabled);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                        selectedCallout.theme === th.id
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Accent Color Palette */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Warna Aksen Garis & Pin:</label>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      onUpdateCallout({ ...selectedCallout, accentColor: col.hex });
                      playSound('click', soundEnabled);
                    }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                      selectedCallout.accentColor === col.hex ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {selectedCallout.accentColor === col.hex && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-300">
                Pilih Ikon Pin:
              </label>

              {/* Fasilitas & Tempat Publik (Pasar, Terminal, Halte, Sekolah, Kantor, Lapangan) */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  🏢 Fasilitas Publik & Peta:
                </span>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {FACILITY_ICONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onUpdateCallout({ ...selectedCallout, icon: item.id });
                        playSound('click', soundEnabled);
                      }}
                      className={`py-1.5 px-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        selectedCallout.icon === item.id
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                      title={item.label}
                    >
                      {getCalloutIcon(item.id, 'w-4 h-4')}
                      <span className="text-[9px] leading-none truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fitur & Simbol Umum */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ✨ Simbol & Fitur Umum:
                </span>
                <div className="grid grid-cols-6 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {GENERAL_ICONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onUpdateCallout({ ...selectedCallout, icon: item.id });
                        playSound('click', soundEnabled);
                      }}
                      className={`p-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                        selectedCallout.icon === item.id
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                      title={item.label}
                    >
                      {getCalloutIcon(item.id, 'w-3.5 h-3.5')}
                      <span className="text-[8px] leading-none truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Animation & Connector */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Animasi Pin:</label>
                <select
                  value={selectedCallout.animation}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, animation: e.target.value as CalloutAnimation })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="pulse">Pulse Ping</option>
                  <option value="radar">Radar Scan</option>
                  <option value="glow">Glow Halus</option>
                  <option value="bounce">Bounce</option>
                  <option value="none">Diam (None)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bentuk Garis:</label>
                <select
                  value={selectedCallout.connectorType}
                  onChange={(e) => onUpdateCallout({ ...selectedCallout, connectorType: e.target.value as ConnectorType })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="straight">Garis Lurus</option>
                  <option value="angled">Garis Sudut Tech</option>
                  <option value="dashed">Garis Putus-Putus</option>
                  <option value="none">Tanpa Garis</option>
                </select>
              </div>
            </div>

            {/* Video Timestamp Sync (if Video) */}
            {mediaType === 'video' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Waktu Tampil di Video:</span>
                  </span>
                  <button
                    onClick={() => {
                      onUpdateCallout({
                        ...selectedCallout,
                        timestamp: Math.round(currentVideoTime * 10) / 10,
                      });
                      playSound('click', soundEnabled);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-bold"
                  >
                    Gunakan Waktu Sekarang ({Math.round(currentVideoTime)}s)
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Mulai (detik):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedCallout.timestamp}
                      onChange={(e) => onUpdateCallout({ ...selectedCallout, timestamp: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Durasi (0 = selalu):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedCallout.duration}
                      onChange={(e) => onUpdateCallout({ ...selectedCallout, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Button & Link (CTA) */}
            {currentBoxType !== 'none' && (
              <div className="space-y-2">
                <label className="block font-semibold text-slate-300">Tautan Aksi (Opsional):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Label Tombol (e.g. Beli)"
                    value={selectedCallout.actionLabel || ''}
                    onChange={(e) => onUpdateCallout({ ...selectedCallout, actionLabel: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={selectedCallout.actionUrl || ''}
                    onChange={(e) => onUpdateCallout({ ...selectedCallout, actionUrl: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS & AUDIO */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            {/* Display Mode */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Mode Tampilan Kartu:</label>
              <div className="space-y-2">
                {[
                  { id: 'hover', label: 'Buka Saat Disorot (Hover)', desc: 'Kartu hanya muncul ketika kursor berada di atas pin' },
                  { id: 'click', label: 'Buka Saat Diklik (Click)', desc: 'Kartu terbuka saat pengguna mengklik pin callout' },
                  { id: 'always', label: 'Selalu Terbuka (Show All)', desc: 'Semua kartu callout tampil terbuka bersamaan' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onChangeDisplayMode(mode.id as any);
                      playSound('click', soundEnabled);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      displayMode === mode.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-cyan-400 mb-0.5">{mode.label}</div>
                    <div className="text-[11px] text-slate-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Synthesizer Toggle */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <div className="font-bold text-white text-xs">Efek Suara Audio Interaktif</div>
                  <div className="text-[11px] text-slate-400">Synthesizer nada saat hover & klik pin</div>
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                    soundEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
