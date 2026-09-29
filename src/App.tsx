import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Share2, Play, Pause, Upload, Layers, Plus, 
  HelpCircle, Eye, Volume2, VolumeX, Maximize2, RotateCcw, 
  Smartphone, Film, Image as ImageIcon, Check, Download, Video
} from 'lucide-react';
import { Project, Callout, SocialCaptions } from './types';
import { SAMPLE_MEDIA_LIST } from './utils/sampleData';
import { CalloutOverlay } from './components/CalloutOverlay';
import { VideoTimeline } from './components/VideoTimeline';
import { CalloutEditorSidebar } from './components/CalloutEditorSidebar';
import { AiAssistantModal } from './components/AiAssistantModal';
import { SocialShareModal } from './components/SocialShareModal';
import { TourPresentationMode } from './components/TourPresentationMode';
import { playSound } from './utils/audio';

export default function App() {
  // Primary Project State
  const [project, setProject] = useState<Project>(() => ({
    id: 'proj-1',
    title: SAMPLE_MEDIA_LIST[0].title,
    description: 'Sorotan interaktif fitur unggulan smartwatch titanium generasi terbaru.',
    mediaType: SAMPLE_MEDIA_LIST[0].type,
    mediaUrl: SAMPLE_MEDIA_LIST[0].url,
    mediaName: 'smartwatch.jpg',
    aspectRatio: 'original',
    callouts: SAMPLE_MEDIA_LIST[0].defaultCallouts,
    soundEffects: true,
    displayMode: 'click',
  }));

  const [selectedCalloutId, setSelectedCalloutId] = useState<string | null>(
    SAMPLE_MEDIA_LIST[0].defaultCallouts[0]?.id || null
  );

  // Modals & Tour States
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isTourModeOpen, setIsTourModeOpen] = useState<boolean>(false);
  const [tourIndex, setTourIndex] = useState<number>(0);
  const [mediaBase64ForAi, setMediaBase64ForAi] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);

  // Video playback states
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Refs
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replay entrance animation for lines, arrows and descriptions
  const handleReplayAnimation = () => {
    setAnimationKey((prev) => prev + 1);
    playSound('laser', project.soundEffects);
  };

  // Load a sample preset
  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_MEDIA_LIST.find((s) => s.id === sampleId);
    if (!found) return;

    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setAnimationKey((prev) => prev + 1);
    setProject({
      id: `proj-${Date.now()}`,
      title: found.title,
      description: `Eksplorasi interaktif ${found.title}`,
      mediaType: found.type,
      mediaUrl: found.url,
      mediaName: found.title,
      aspectRatio: 'original',
      callouts: found.defaultCallouts,
      soundEffects: project.soundEffects,
      displayMode: project.displayMode,
    });
    setSelectedCalloutId(found.defaultCallouts[0]?.id || null);
    playSound('click', project.soundEffects);
  };

  // Upload custom file (image or video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    setProject({
      ...project,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      mediaType: isVideo ? 'video' : 'image',
      mediaUrl: url,
      mediaName: file.name,
      callouts: [],
    });
    setSelectedCalloutId(null);
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    playSound('success', project.soundEffects);
  };

  // Video Time Update listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTogglePlayVideo = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
    playSound('click', project.soundEffects);
  };

  const handleSeekVideo = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setVideoCurrentTime(time);
  };

  // Add Callout by clicking on media canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaContainerRef.current) return;
    const rect = mediaContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(5, Math.min(95, Math.round(x * 10) / 10));
    const clampedY = Math.max(5, Math.min(95, Math.round(y * 10) / 10));

    const newCallout: Callout = {
      id: `callout_${Date.now()}`,
      title: `Titik Callout ${project.callouts.length + 1}`,
      description: 'Tambahkan deskripsi atau spesifikasi fitur di sini...',
      badgeText: 'Sorotan',
      category: 'fitur',
      icon: 'sparkles',
      targetX: clampedX,
      targetY: clampedY,
      cardPosition: clampedX > 60 ? 'top-left' : 'top-right',
      theme: 'cyber',
      accentColor: '#06b6d4',
      animation: 'pulse',
      connectorType: 'angled',
      timestamp: Math.round(videoCurrentTime * 10) / 10,
      duration: 4,
      visible: true,
    };

    setProject({
      ...project,
      callouts: [...project.callouts, newCallout],
    });
    setSelectedCalloutId(newCallout.id);
    playSound('click', project.soundEffects);
  };

  // Update Callout
  const handleUpdateCallout = (updated: Callout) => {
    setProject((prev) => ({
      ...prev,
      callouts: prev.callouts.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  // Delete Callout
  const handleDeleteCallout = (id: string) => {
    setProject((prev) => ({
      ...prev,
      callouts: prev.callouts.filter((c) => c.id !== id),
    }));
    if (selectedCalloutId === id) {
      setSelectedCalloutId(null);
    }
  };

  // Duplicate Callout
  const handleDuplicateCallout = (id: string) => {
    const target = project.callouts.find((c) => c.id === id);
    if (!target) return;
    const dup: Callout = {
      ...target,
      id: `callout_${Date.now()}`,
      title: `${target.title} (Salinan)`,
      targetX: Math.min(95, target.targetX + 5),
      targetY: Math.min(95, target.targetY + 5),
    };
    setProject((prev) => ({
      ...prev,
      callouts: [...prev.callouts, dup],
    }));
    setSelectedCalloutId(dup.id);
  };

  // Prepare base64 for AI scan
  const handleOpenAiScanner = async () => {
    let base64 = '';

    if (project.mediaType === 'video' && videoRef.current) {
      // Capture current video frame on canvas
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    } else if (imageRef.current) {
      // Create canvas from image
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          base64 = canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
          // If tainted by CORS, fetch as blob
          try {
            const resp = await fetch(project.mediaUrl);
            const blob = await resp.blob();
            base64 = await new Promise((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch (err) {
            console.warn('Could not extract image data URL directly', err);
          }
        }
      }
    }

    setMediaBase64ForAi(base64);
    setIsAiModalOpen(true);
    playSound('click', project.soundEffects);
  };

  // Apply AI Generated Callouts
  const handleApplyAiCallouts = (newCallouts: Callout[], captions?: SocialCaptions, append: boolean = false) => {
    setProject((prev) => ({
      ...prev,
      callouts: append ? [...prev.callouts, ...newCallouts] : newCallouts,
      socialCaptions: captions || prev.socialCaptions,
    }));
    if (newCallouts.length > 0) {
      setSelectedCalloutId(newCallouts[0].id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ' && project.mediaType === 'video') {
        e.preventDefault();
        handleTogglePlayVideo();
      } else if (e.key === 'Escape') {
        setIsTourModeOpen(false);
        setIsShareModalOpen(false);
        setIsAiModalOpen(false);
      } else if (e.key === 'Delete' && selectedCalloutId) {
        handleDeleteCallout(selectedCalloutId);
        playSound('delete', project.soundEffects);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.mediaType, isVideoPlaying, selectedCalloutId, project.soundEffects]);

  // Determine active callouts for video timeline filtering
  const visibleCallouts = project.callouts.filter((c) => {
    if (project.mediaType !== 'video') return true;
    if (c.duration === 0) return true; // always show
    return videoCurrentTime >= c.timestamp && videoCurrentTime <= c.timestamp + c.duration;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        {/* Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight text-white">CalloutStudio</span>
              <span className="text-cyan-400 text-xs font-mono ml-1 font-bold">AI</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Project Title Editor */}
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="text-xs font-bold text-slate-200 bg-transparent hover:bg-slate-800/60 focus:bg-slate-900 px-2 py-1 rounded-lg border border-transparent focus:border-cyan-500/60 focus:outline-none transition-colors max-w-[160px] sm:max-w-xs truncate"
            title="Klik untuk ubah judul proyek"
          />
        </div>

        {/* Center: Presets & Upload */}
        <div className="hidden md:flex items-center gap-2">
          {/* Sample Presets Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 text-[11px] font-semibold">Preset:</span>
            {SAMPLE_MEDIA_LIST.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  project.title === sample.title
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sample.type === 'video' ? '🎬 ' : '📷 '}
                {sample.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto/Video</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Unggah Media"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* AI Auto Generate */}
          <button
            onClick={handleOpenAiScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-transform active:scale-95"
            title="Pindai gambar/frame video dengan Gemini AI untuk membuat callout otomatis"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Deteksi Otomatis AI</span>
            <span className="sm:hidden">AI Scan</span>
          </button>

          {/* Interactive Tour Presentation Mode */}
          <button
            onClick={() => {
              if (project.callouts.length > 0) {
                setTourIndex(0);
                setIsTourModeOpen(true);
                playSound('tourStep', project.soundEffects);
              }
            }}
            disabled={project.callouts.length === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isTourModeOpen
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40'
            }`}
            title="Mulai tur interaktif berurutan"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Mode Tur</span>
          </button>

          {/* Direct Social Media Share & Export Modal */}
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              playSound('click', project.soundEffects);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
            title="Bagikan langsung ke WhatsApp, X, IG Stories, TikTok atau ekspor gambar/web"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan & Ekspor</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area (Canvas + Sidebar) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center Canvas Workspace */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Top Canvas Helper Bar */}
          <div className="h-8 border-b border-slate-900 bg-slate-950/60 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                {project.mediaType === 'video' ? 'Video Interaktif' : 'Foto Interaktif'} •{' '}
                <span className="text-slate-300 font-semibold">{project.callouts.length} callout</span>
              </span>
            </div>

            {/* Quick Animation Replay & Helper Hints */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleReplayAnimation}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                title="Putar ulang animasi memunculkan panah garis dan keterangan"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Putar Animasi Garis</span>
              </button>

              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline">💡 Klik media untuk tambah pin • Tarik pin untuk pindah</span>
            </div>
          </div>

          {/* Media Interactive Canvas Box */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative select-none">
            <div
              ref={mediaContainerRef}
              onClick={handleCanvasClick}
              className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-900/60 cursor-crosshair group flex items-center justify-center"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.08)',
              }}
            >
              {/* Media Content: Image or Video */}
              {project.mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  key={project.mediaUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={(e) => {
                    console.warn('Video source event:', e);
                  }}
                  playsInline
                  loop
                  className="max-h-[calc(100vh-170px)] max-w-full object-contain pointer-events-auto"
                >
                  <source
                    src={
                      typeof window !== 'undefined' && project.mediaUrl.startsWith('http') && !project.mediaUrl.startsWith(window.location.origin) && !project.mediaUrl.startsWith('blob:')
                        ? `/api/proxy-media?url=${encodeURIComponent(project.mediaUrl)}`
                        : project.mediaUrl
                    }
                    type="video/mp4"
                  />
                  <source src={project.mediaUrl} type="video/mp4" />
                  Browser Anda tidak mendukung pemutaran video ini.
                </video>
              ) : (
                <img
                  ref={imageRef}
                  src={project.mediaUrl}
                  alt={project.title}
                  crossOrigin="anonymous"
                  className="max-h-[calc(100vh-120px)] max-w-full object-contain pointer-events-auto"
                />
              )}

              {/* Interactive Callout Overlay */}
              <CalloutOverlay
                callouts={project.callouts}
                selectedId={selectedCalloutId}
                onSelectCallout={(id) => {
                  setSelectedCalloutId(id);
                  const idx = project.callouts.findIndex((c) => c.id === id);
                  if (idx !== -1) setTourIndex(idx);
                }}
                onUpdateCallout={handleUpdateCallout}
                onDeleteCallout={handleDeleteCallout}
                soundEnabled={project.soundEffects}
                displayMode={project.displayMode}
                isEditing={true}
                tourActiveId={isTourModeOpen ? project.callouts[tourIndex]?.id : null}
                containerRef={mediaContainerRef}
                animationKey={animationKey}
              />
            </div>

            {/* Interactive Tour Floating Card */}
            {isTourModeOpen && (
              <TourPresentationMode
                isOpen={isTourModeOpen}
                onClose={() => setIsTourModeOpen(false)}
                callouts={project.callouts}
                currentIndex={tourIndex}
                onIndexChange={(idx) => {
                  setTourIndex(idx);
                  const c = project.callouts[idx];
                  if (c) {
                    setSelectedCalloutId(c.id);
                    if (project.mediaType === 'video' && videoRef.current) {
                      handleSeekVideo(c.timestamp);
                    }
                  }
                }}
                soundEnabled={project.soundEffects}
              />
            )}
          </div>

          {/* Video Timeline Bar (Displayed when media is video) */}
          {project.mediaType === 'video' && (
            <div className="px-4 pb-3 pt-1 shrink-0 z-20">
              <VideoTimeline
                videoRef={videoRef}
                currentTime={videoCurrentTime}
                duration={videoDuration}
                isPlaying={isVideoPlaying}
                onTogglePlay={handleTogglePlayVideo}
                onSeek={handleSeekVideo}
                callouts={project.callouts}
                selectedCalloutId={selectedCalloutId}
                onSelectCallout={(id) => setSelectedCalloutId(id)}
              />
            </div>
          )}
        </div>

        {/* Right Control & Editor Sidebar */}
        <CalloutEditorSidebar
          callouts={project.callouts}
          selectedId={selectedCalloutId}
          onSelectCallout={setSelectedCalloutId}
          onUpdateCallout={handleUpdateCallout}
          onDeleteCallout={handleDeleteCallout}
          onAddCallout={() => {
            // Add callout near center
            const newC: Callout = {
              id: `callout_${Date.now()}`,
              title: `Fitur ${project.callouts.length + 1}`,
              description: 'Deskripsi elemen fitur...',
              badgeText: 'Sorotan',
              category: 'fitur',
              icon: 'sparkles',
              targetX: 50,
              targetY: 50,
              cardPosition: 'top-right',
              theme: 'cyber',
              accentColor: '#06b6d4',
              animation: 'pulse',
              connectorType: 'angled',
              timestamp: Math.round(videoCurrentTime * 10) / 10,
              duration: 4,
              visible: true,
            };
            setProject({ ...project, callouts: [...project.callouts, newC] });
            setSelectedCalloutId(newC.id);
            playSound('click', project.soundEffects);
          }}
          onDuplicateCallout={handleDuplicateCallout}
          mediaType={project.mediaType}
          currentVideoTime={videoCurrentTime}
          soundEnabled={project.soundEffects}
          onToggleSound={() => setProject({ ...project, soundEffects: !project.soundEffects })}
          displayMode={project.displayMode}
          onChangeDisplayMode={(mode) => setProject({ ...project, displayMode: mode })}
          onOpenAiModal={handleOpenAiScanner}
          onReplayAnimation={handleReplayAnimation}
        />
      </div>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        mediaBase64={mediaBase64ForAi}
        mediaType={project.mediaType}
        currentTimestamp={videoCurrentTime}
        onApplyGeneratedCallouts={handleApplyAiCallouts}
        soundEnabled={project.soundEffects}
      />

      {/* Direct Social Media Sharing & Export Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        mediaElement={project.mediaType === 'video' ? videoRef.current : imageRef.current}
        soundEnabled={project.soundEffects}
      />
    </div>
  );
}
