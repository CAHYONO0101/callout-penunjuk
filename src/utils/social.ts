import { Callout, Project } from '../types';

export interface ShareDataPayload {
  title: string;
  text: string;
  url: string;
  hashtags?: string[];
  imageUrl?: string;
}

export function buildSocialShareUrls(project: Project, currentUrl?: string) {
  const targetUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : 'https://calloutstudio.app');
  
  const calloutHighlights = project.callouts
    .slice(0, 3)
    .map(c => `• ${c.title}`)
    .join('\n');

  const defaultHashtags = ['CalloutInteraktif', 'VisualStorytelling', 'AIStudio', 'TechShowcase'];
  const hashtags = project.socialCaptions?.hashtags?.length 
    ? project.socialCaptions.hashtags 
    : defaultHashtags;

  // Formatted copy for WhatsApp
  const waText = encodeURIComponent(
    `*${project.title}*\n\n` +
    `${project.description || 'Lihat konten interaktif keren ini dengan callout visual langsung:'}\n\n` +
    (calloutHighlights ? `*Sorotan Utama:*\n${calloutHighlights}\n\n` : '') +
    `👉 Buka & jelajahi interaktif di sini: ${targetUrl}`
  );

  // Formatted copy for X (Twitter)
  const twitterCaption = project.socialCaptions?.twitter || 
    `Eksplorasi ${project.title} dalam format interaktif! Klik untuk melihat detail & spesifikasi lengkap 🔍✨`;
  const xText = encodeURIComponent(twitterCaption);
  const xTags = hashtags.map(h => h.replace('#', '')).slice(0, 4).join(',');

  // Formatted copy for LinkedIn
  const liUrl = encodeURIComponent(targetUrl);

  // Formatted copy for Telegram
  const tgText = encodeURIComponent(
    `✨ *${project.title}*\n\n` +
    `${project.description || 'Eksplorasi visual interaktif'}\n\n` +
    `Jelajahi di sini:`
  );

  // Formatted copy for Pinterest
  const pinDesc = encodeURIComponent(`${project.title} - ${project.description || ''}`);
  const pinMedia = encodeURIComponent(project.mediaUrl);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${waText}`,
    twitter: `https://twitter.com/intent/tweet?text=${xText}&url=${encodeURIComponent(targetUrl)}&hashtags=${xTags}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${liUrl}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${tgText}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(targetUrl)}&media=${pinMedia}&description=${pinDesc}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${project.title}\n${targetUrl}`)}`
  };
}

export async function shareViaWebShareApi(payload: { title: string; text: string; url: string; file?: File }) {
  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      const shareData: any = {
        title: payload.title,
        text: payload.text,
        url: payload.url,
      };

      if (payload.file && (navigator as any).canShare && (navigator as any).canShare({ files: [payload.file] })) {
        shareData.files = [payload.file];
      }

      await (navigator as any).share(shareData);
      return { success: true };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed or cancelled:', err);
      }
      return { success: false, error: err.message };
    }
  }
  return { success: false, notSupported: true };
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(successful);
  } catch (err) {
    return Promise.resolve(false);
  }
}
