export type CalloutCategory = 'fitur' | 'spek' | 'harga' | 'sorotan' | 'desain' | 'tips';

export type CalloutTheme = 'cyber' | 'glass' | 'badge' | 'neon' | 'pop' | 'spotlight' | 'loupe';

export type CalloutAnimation = 'pulse' | 'radar' | 'glow' | 'bounce' | 'none';

export type ConnectorType = 'angled' | 'straight' | 'arc' | 'dashed' | 'none';

export type CardPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom' | 'custom';

export type CalloutBoxType = 'card' | 'none' | 'text-only' | 'badge-only';

export type BoxSize = 'sm' | 'md' | 'lg' | 'custom';

export interface Callout {
  id: string;
  title: string;
  description: string;
  badgeText?: string;
  category: CalloutCategory;
  icon: string;
  targetX: number; // 0 to 100 percentage
  targetY: number; // 0 to 100 percentage
  cardOffsetX?: number; // relative pixel offset
  cardOffsetY?: number;
  cardPosition: CardPosition;
  theme: CalloutTheme;
  accentColor: string;
  animation: CalloutAnimation;
  connectorType: ConnectorType;
  timestamp: number; // in seconds (for video)
  duration: number; // in seconds visible (for video, 0 = always visible)
  visible: boolean;
  actionUrl?: string;
  actionLabel?: string;

  // New customization features requested by user:
  boxType?: CalloutBoxType; // 'card' (kotak lengkap), 'none' (hanya garis), 'text-only' (teks tanpa kotak), 'badge-only'
  boxOpacity?: number; // 0 (transparan bening) hingga 100 (solid pekat)
  boxWidth?: number; // lebar kotak dalam piksel (140 - 450px)
  boxSize?: BoxSize; // 'sm', 'md', 'lg', 'custom'
  showArrowHead?: boolean; // tampilkan mata panah penunjuk pada garis
  lineWidth?: number; // ketebalan garis (1 - 5px)
  lineLength?: number; // panjang offset garis
  titleAtLineEnd?: boolean; // judul tepat menempel di ujung titik garis (leader line title)
}

export interface SocialCaptions {
  instagram: string;
  tiktok: string;
  twitter: string;
  whatsapp: string;
  linkedin: string;
  hashtags?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaName: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | 'original';
  callouts: Callout[];
  soundEffects: boolean;
  displayMode: 'hover' | 'click' | 'always';
  socialCaptions?: SocialCaptions;
  authorName?: string;
}

export interface SampleMediaItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  category: string;
  url: string;
  thumbnail: string;
  defaultCallouts: Callout[];
}
