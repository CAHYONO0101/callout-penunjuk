import React, { useState } from 'react';
import { 
  Sparkles, X, Wand2, Check, AlertCircle, Loader2, Target, 
  ShoppingBag, Cpu, Eye, Share2, Layers, RefreshCw 
} from 'lucide-react';
import { Callout, SocialCaptions } from '../types';
import { playSound } from '../utils/audio';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaBase64: string | null;
  mediaType: 'image' | 'video';
  currentTimestamp: number;
  onApplyGeneratedCallouts: (newCallouts: Callout[], captions?: SocialCaptions, append?: boolean) => void;
  soundEnabled: boolean;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  mediaBase64,
  mediaType,
  currentTimestamp,
  onApplyGeneratedCallouts,
  soundEnabled,
}) => {
  const [goal, setGoal] = useState<'features' | 'specs' | 'social' | 'pricing' | 'general'>('features');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [detectedCallouts, setDetectedCallouts] = useState<Callout[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [suggestedCaptions, setSuggestedCaptions] = useState<SocialCaptions | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>('');
  const [appendMode, setAppendMode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    if (!mediaBase64) {
      setError('Media belum siap atau gambar tidak dapat diambil.');
      return;
    }

    setIsLoading(true);
    setError(null);
    playSound('scan', soundEnabled);

    try {
      const res = await fetch('/api/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: mediaBase64,
          goal,
          customPrompt,
          mediaType,
          timestamp: currentTimestamp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses media.');
      }

      setDetectedCallouts(data.callouts || []);
      // By default select all detected callouts
      const allIndices = new Set<number>((data.callouts || []).map((_: any, idx: number) => idx));
      setSelectedIndices(allIndices);

      if (data.socialCaptions) {
        setSuggestedCaptions(data.socialCaptions);
      }
      if (data.suggestedTitle) {
        setSuggestedTitle(data.suggestedTitle);
      }

      playSound('success', soundEnabled);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mendeteksi callout otomatis.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    const updated = new Set(selectedIndices);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedIndices(updated);
  };

  const handleApply = () => {
    const chosen = detectedCallouts.filter((_, idx) => selectedIndices.has(idx));
    onApplyGeneratedCallouts(chosen, suggestedCaptions || undefined, appendMode);
    playSound('click', soundEnabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Wand2 className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Deteksi Otomatis Callout dengan AI</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Vision Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pindai visual secara instan dan dapatkan titik pin, teks penjelasan, serta elemen visual otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* If not generated yet or re-configuring */}
          {detectedCallouts.length === 0 ? (
            <div className="space-y-5">
              {/* Media Preview Thumbnail with Scan Effect */}
              {mediaBase64 && (
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <img
                    src={mediaBase64}
                    alt="Preview scan"
                    className="w-full h-full object-contain"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
                      {/* Laser sweep animation line */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                      <span className="text-xs font-mono font-semibold text-cyan-200">
                        Memindai objek & merancang callout interaktif...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Goal Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Pilih Fokus Analisis Callout:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'features', label: 'Fitur & Bagian Produk', icon: <Cpu className="w-4 h-4" />, desc: 'Tombol, layar, komponen fisik' },
                    { id: 'specs', label: 'Spesifikasi Teknis', icon: <Target className="w-4 h-4" />, desc: 'Material, ukuran, kapabilitas' },
                    { id: 'social', label: 'Sorotan Viral / Estetik', icon: <Sparkles className="w-4 h-4" />, desc: 'Sudut paling memikat mata' },
                    { id: 'pricing', label: 'Label Harga & Belanja', icon: <ShoppingBag className="w-4 h-4" />, desc: 'Tag item dan estimasi nilai' },
                    { id: 'general', label: 'Titik Fokus Umum', icon: <Eye className="w-4 h-4" />, desc: '3-5 area penting seimbang' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        goal === item.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md shadow-cyan-500/10'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs mb-1 text-cyan-400">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instruksi Khusus (Opsional):
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Misal: 'Sorot kamera utama, bezel tipis, dan baterai tahan lama'..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            /* Results Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Hasil Deteksi: {detectedCallouts.length} Titik Ditemukan</span>
                    {suggestedTitle && (
                      <span className="text-xs font-normal text-cyan-400">({suggestedTitle})</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Centang titik yang ingin Anda tambahkan ke kanvas media Anda.
                  </p>
                </div>
                <button
                  onClick={() => setDetectedCallouts([])}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai Ulang</span>
                </button>
              </div>

              {/* Callout Cards List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {detectedCallouts.map((c, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={c.id || idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'border-cyan-500/60 bg-cyan-950/30'
                          : 'border-slate-800 bg-slate-950/40 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: `${c.accentColor || '#06b6d4'}22`, color: c.accentColor || '#06b6d4' }}
                          >
                            {c.badgeText || c.category}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {c.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 ml-auto">
                            X: {Math.round(c.targetX)}% Y: {Math.round(c.targetY)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
                          {c.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Append or Replace Toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <input
                  type="checkbox"
                  id="appendMode"
                  checked={appendMode}
                  onChange={(e) => setAppendMode(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="appendMode" className="text-slate-300 cursor-pointer">
                  Gabungkan dengan callout yang sudah ada (jangan hapus callout lama)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          {detectedCallouts.length === 0 ? (
            <button
              onClick={handleStartAnalysis}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Menganalisis Media...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Pindai & Buat Callout Otomatis</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={selectedIndices.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Terapkan {selectedIndices.size} Callout ke Kanvas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
