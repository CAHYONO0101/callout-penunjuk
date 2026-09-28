import React, { useState } from 'react';
import { 
  X, Share2, Copy, Check, Download, Code, Globe, MessageCircle, 
  Send, ExternalLink, Sparkles, Image as ImageIcon, CheckCircle2,
  FileCode, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, SocialCaptions } from '../types';
import { buildSocialShareUrls, shareViaWebShareApi, copyToClipboard } from '../utils/social';
import { captureCalloutCanvas, downloadDataUrl, generateInteractiveHtmlEmbed } from '../utils/export';
import { playSound } from '../utils/audio';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  mediaElement: HTMLImageElement | HTMLVideoElement | null;
  soundEnabled: boolean;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  project,
  mediaElement,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'captions' | 'export'>('social');
  const [selectedCaptionPlatform, setSelectedCaptionPlatform] = useState<'instagram' | 'tiktok' | 'twitter' | 'whatsapp' | 'linkedin'>('instagram');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);

  if (!isOpen) return null;

  const shareUrls = buildSocialShareUrls(project);

  const handleShareClick = (url: string) => {
    playSound('click', soundEnabled);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const handleNativeShare = async () => {
    playSound('click', soundEnabled);
    const result = await shareViaWebShareApi({
      title: project.title,
      text: project.description || `Eksplorasi ${project.title} dengan callout visual interaktif`,
      url: window.location.href,
    });

    if (result.success) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      playSound('success', soundEnabled);
    }
  };

  const currentCaptions: SocialCaptions = project.socialCaptions || {
    instagram: `✨ ${project.title}\n\n${project.description || 'Jelajahi setiap detail dengan visual callout interaktif!'}\n\n🔍 Sorotan:\n${project.callouts.map(c => `👉 ${c.title}`).join('\n')}\n\nYuk klik link di bio untuk coba versi interaktifnya!\n\n#CalloutInteraktif #TechDesign #ProductShowcase #VisualStory #Trending`,
    tiktok: `Spill detail lengkap ${project.title}! 🤯 Klik link di bio buat eksplorasi interaktifnya secara langsung 🔥 #fyp #trending #productdesign #aesthetic`,
    twitter: `Eksplorasi ${project.title} dalam visual interaktif! Temukan detail & fitur unggulan di sini: 🔍✨ #CalloutInteraktif #TechDesign`,
    whatsapp: `*${project.title}*\n\n${project.description || 'Eksplorasi visual interaktif'}\n\n*Fitur Utama:*\n${project.callouts.map(c => `• ${c.title}`).join('\n')}\n\nBuka sekarang: ${window.location.href}`,
    linkedin: `Inovasi visual: ${project.title}.\n\nMelalui representasi callout interaktif, kita dapat menyampaikan nilai produk, arsitektur, dan fitur dengan jauh lebih intuitif dan terukur.\n\nSimak interaksinya secara langsung:`
  };

  const handleCopyCaption = async () => {
    const text = currentCaptions[selectedCaptionPlatform];
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCaption(true);
      playSound('success', soundEnabled);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const handleDownloadSnapshot = async () => {
    if (!mediaElement) return;
    setIsExportingImage(true);
    playSound('click', soundEnabled);
    try {
      const dataUrl = await captureCalloutCanvas(mediaElement, project.callouts, project.title);
      const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-callout.png`;
      downloadDataUrl(dataUrl, filename);
      playSound('success', soundEnabled);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to export canvas:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleDownloadInteractiveHtml = () => {
    playSound('click', soundEnabled);
    const htmlContent = generateInteractiveHtmlEmbed(project);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-interaktif.html`;
    downloadDataUrl(url, filename);
    URL.revokeObjectURL(url);
    playSound('success', soundEnabled);
  };

  const embedCode = `<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" allowfullscreen style="border-radius: 12px; border: 1px solid #334155;"></iframe>`;

  const handleCopyEmbed = async () => {
    const ok = await copyToClipboard(embedCode);
    if (ok) {
      setCopiedEmbed(true);
      playSound('success', soundEnabled);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bagikan ke Media Sosial & Ekspor Konten
              </h3>
              <p className="text-xs text-slate-400">
                Kirim langsung ke medsos, salin caption siap pakai, atau unduh hasil interaktif
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

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/30 text-xs font-semibold">
          {[
            { id: 'social', label: 'Integrasi Langsung Medsos', icon: <Share2 className="w-3.5 h-3.5" /> },
            { id: 'captions', label: 'Caption Medsos AI', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'export', label: 'Unduh & Embed Web', icon: <Download className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playSound('hover', soundEnabled);
              }}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5">
          {/* TAB 1: DIRECT SOCIAL MEDIA INTEGRATION */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Klik platform di bawah untuk langsung membuka aplikasi dan membagikan konten interaktif ini dengan draf pesan otomatis:
              </p>

              {/* Native Web Share Button */}
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-transform active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <span>Bagikan ke Instagram Stories / TikTok / Aplikasi Lain (Web Share)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                  Atau Bagikan Langsung ke:
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Grid of Direct Share Platforms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* WhatsApp */}
                <button
                  onClick={() => handleShareClick(shareUrls.whatsapp)}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>

                {/* Twitter / X */}
                <button
                  onClick={() => handleShareClick(shareUrls.twitter)}
                  className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <span className="w-4 h-4 font-bold text-center leading-none text-sky-400">𝕏</span>
                  <span>Twitter / X</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>

                {/* Telegram */}
                <button
                  onClick={() => handleShareClick(shareUrls.telegram)}
                  className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Telegram</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => handleShareClick(shareUrls.linkedin)}
                  className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShareClick(shareUrls.facebook)}
                  className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Facebook</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>

                {/* Pinterest */}
                <button
                  onClick={() => handleShareClick(shareUrls.pinterest)}
                  className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-2.5 text-xs font-semibold transition-all hover:scale-102"
                >
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Pinterest</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AI CAPTIONS HUB */}
          {activeTab === 'captions' && (
            <div className="space-y-3.5">
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'twitter', label: 'Twitter / X' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'linkedin', label: 'LinkedIn' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedCaptionPlatform(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors shrink-0 ${
                      selectedCaptionPlatform === p.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Caption Text Box */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={currentCaptions[selectedCaptionPlatform]}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none resize-none"
                />
                <button
                  onClick={handleCopyCaption}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Caption</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                💡 Caption dioptimalkan dengan emoji, hook persuasif, dan hashtag relevan sesuai gaya platform.
              </p>
            </div>
          )}

          {/* TAB 3: DOWNLOAD & EMBED */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Snapshot Image Download */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Unduh Gambar Beranotasi (PNG)</h5>
                    <p className="text-[11px] text-slate-400">
                      Render callout visual langsung menempel pada gambar beresolusi tinggi
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadSnapshot}
                  disabled={isExportingImage || !mediaElement}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {isExportingImage ? 'Memproses...' : 'Unduh PNG'}
                </button>
              </div>

              {/* Standalone Interactive HTML */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Unduh Paket Web Interaktif (.html)</h5>
                    <p className="text-[11px] text-slate-400">
                      File mandiri berisi media & callout interaktif yang bisa dibuka offline di browser apa saja
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadInteractiveHtml}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                >
                  Unduh HTML
                </button>
              </div>

              {/* Embed Code */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <h5 className="text-xs font-bold text-white">Kode Sematkan Web (iFrame Embed)</h5>
                  </div>
                  <button
                    onClick={handleCopyEmbed}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedEmbed ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmbed ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={embedCode}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 select-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>{project.callouts.length} Callout Terpasang</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
