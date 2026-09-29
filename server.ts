import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Media analysis endpoint: Detects objects, points of interest and generates interactive callouts
  app.post('/api/analyze-media', async (req, res) => {
    try {
      const { imageBase64, goal = 'features', customPrompt = '', mediaType = 'image', timestamp = 0 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Data gambar / frame tidak boleh kosong.' });
      }

      // Extract mime type and clean base64 data
      let mimeType = 'image/jpeg';
      let cleanData = imageBase64;
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanData = match[2];
      }

      const goalInstruction = {
        features: 'Fokus mendeteksi fitur produk terbaik, keunggulan visual, material, komponen, dan tombol atau bagian penting.',
        specs: 'Fokus mendeteksi spesifikasi teknis, dimensi, detail material, performa, atau rancangan arsitektural/mekanikal.',
        general: 'Pilih 3 hingga 5 titik fokus paling menarik dan menonjol dalam gambar secara seimbang.',
        social: 'Sorot elemen yang paling menarik perhatian warganet/audiens media sosial, estetik, dan layak dibagikan.',
        pricing: 'Sorot item/komponen dengan perkiraan tag harga, label belanja, atau nama varian produk.'
      }[goal as 'features' | 'specs' | 'general' | 'social' | 'pricing'] || 'Deteksi titik-titik fokus utama.';

      const promptText = `
Anda adalah kurator dan desainer konten visual interaktif kelas dunia.
Tugas Anda: Analisis gambar atau frame video ini secara teliti. Identifikasi 3 sampai 6 titik fokus utama (callout points) yang paling menarik dan penting untuk diberi label interaktif.

Instruksi Analisis:
${goalInstruction}
${customPrompt ? `Catatan Tambahan Pengguna: "${customPrompt}"` : ''}

Ketentuan untuk setiap callout:
1. "targetX": Persentase posisi horizontal titik sasaran (0 - 100, dari tepi kiri gambar). Harus tepat menunjuk objek/bagian yang dimaksud.
2. "targetY": Persentase posisi vertikal titik sasaran (0 - 100, dari tepi atas gambar). Harus tepat menunjuk objek yang dimaksud.
3. "title": Judul singkat yang sangat jelas dan memikat (maks 4-6 kata) dalam Bahasa Indonesia.
4. "description": Keterangan informatif, elegan, dan menarik (1-2 kalimat) dalam Bahasa Indonesia.
5. "badgeText": Teks lencana pendek seperti "Fitur Unggulan", "Material Premium", "Sensor 50MP", "Aksen Kayu", atau harga jika cocok.
6. "category": Kategori ("fitur" | "spek" | "harga" | "sorotan" | "desain").
7. "icon": Pilih salah satu nama icon yang paling cocok dari daftar ini: ["sparkles", "camera", "cpu", "tag", "shield", "battery", "zap", "eye", "info", "heart", "layers", "compass", "award", "activity", "check-circle", "maximize-2", "clock", "sliders"].
8. "cardPosition": Posisi kartu info terhadap titik agar tidak terpotong tepi gambar. Pilih salah satu: "top-right", "top-left", "bottom-right", "bottom-left", "top", "bottom". Pastikan jika targetX > 60 pilih yang ke arah kiri (misal "top-left" atau "bottom-left"). Jika targetY < 25 pilih yang ke arah bawah ("bottom-right" atau "bottom-left").
9. "theme": Gaya visual kartu: "cyber" (futuristik neon), "glass" (modern frosted glass), "badge" (elegan minimalis), "neon" (terang mencolok), atau "pop" (ceria ramah).
10. "accentColor": Kode warna HEX yang cocok dengan elemen tersebut (misal "#06b6d4" untuk cyan tech, "#10b981" untuk emerald eco/green, "#8b5cf6" untuk violet mewah, "#f43f5e" untuk rose/danger, "#f59e0b" untuk emas/amber).

Sediakan juga judul proyek yang disarankan ("suggestedTitle"), rangkuman singkat ("suggestedDescription"), serta draft caption siap pakai untuk Instagram, TikTok, Twitter/X, WhatsApp, dan LinkedIn dengan sentuhan hashtag dan emoji yang memikat.
Kembalikan murni format JSON yang valid.
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanData,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: { type: Type.STRING },
              suggestedDescription: { type: Type.STRING },
              callouts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    badgeText: { type: Type.STRING },
                    category: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    targetX: { type: Type.NUMBER },
                    targetY: { type: Type.NUMBER },
                    cardPosition: { type: Type.STRING },
                    theme: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'targetX', 'targetY'],
                },
              },
              socialCaptions: {
                type: Type.OBJECT,
                properties: {
                  instagram: { type: Type.STRING },
                  tiktok: { type: Type.STRING },
                  twitter: { type: Type.STRING },
                  whatsapp: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                },
                required: ['instagram', 'tiktok', 'twitter', 'whatsapp', 'linkedin'],
              },
            },
            required: ['suggestedTitle', 'suggestedDescription', 'callouts', 'socialCaptions'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      // Enhance callouts with IDs and video timestamp
      const enhancedCallouts = (parsedData.callouts || []).map((c: any, index: number) => ({
        id: `callout_${Date.now()}_${index}`,
        title: c.title || `Titik Sorot ${index + 1}`,
        description: c.description || '',
        badgeText: c.badgeText || 'Sorotan',
        category: c.category || 'fitur',
        icon: c.icon || 'sparkles',
        targetX: Math.max(5, Math.min(95, Number(c.targetX) || 50)),
        targetY: Math.max(5, Math.min(95, Number(c.targetY) || 50)),
        cardPosition: c.cardPosition || 'top-right',
        theme: c.theme || 'cyber',
        accentColor: c.accentColor || '#06b6d4',
        timestamp: Number(timestamp) || 0,
        duration: 4, // default 4 seconds on video
        visible: true,
        animation: 'pulse',
        connectorType: 'angled',
      }));

      return res.json({
        success: true,
        suggestedTitle: parsedData.suggestedTitle || 'Proyek Callout Interaktif',
        suggestedDescription: parsedData.suggestedDescription || '',
        callouts: enhancedCallouts,
        socialCaptions: parsedData.socialCaptions || {},
      });
    } catch (error: any) {
      console.error('Error in /api/analyze-media:', error);
      return res.status(500).json({
        error: error.message || 'Gagal menganalisis media dengan AI.',
      });
    }
  });

  // Social Captions Generator
  app.post('/api/generate-captions', async (req, res) => {
    try {
      const { title, description, callouts, tone = 'engaging' } = req.body;

      const calloutSummaries = (callouts || [])
        .map((c: any, i: number) => `- ${c.title}: ${c.description}`)
        .join('\n');

      const prompt = `
Buatkan paket caption media sosial yang sangat menarik dan terstruktur dalam Bahasa Indonesia untuk konten foto/video interaktif berikut:

Judul Konten: "${title || 'Sorotan Visual Interaktif'}"
Deskripsi: "${description || ''}"
Titik Callout yang Disorot:
${calloutSummaries}

Nada Bicara (Tone): ${tone}

Berikan format output JSON dengan format:
{
  "instagram": "Caption Instagram lengkap dengan hook kuat, poin-poin bullet ber-emoji, ajakan bertindak (CTA) untuk tap dan jelajahi, serta 7-10 hashtag relevan.",
  "tiktok": "Caption TikTok gaya casual, kekinian, ringkas, menarik rasa penasaran dengan trending hashtag.",
  "twitter": "Postingan X/Twitter maksimal 260 karakter, punchy, kuat, dengan call to action dan 3 hashtag utama.",
  "whatsapp": "Pesan broadcast WhatsApp yang rapi dengan format *tebal*, bullet poin yang bersih, dan ajakan melihat konten interaktif ini.",
  "linkedin": "Postingan LinkedIn profesional yang menyoroti inovasi, aspek desain/teknis, dan wawasan nilai tambah bagi audiens profesional.",
  "hashtags": ["#CalloutInteraktif", "#VisualShowcase", "#InovasiProduk", "#TechDesign", "#CreativeContent"]
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              instagram: { type: Type.STRING },
              tiktok: { type: Type.STRING },
              twitter: { type: Type.STRING },
              whatsapp: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['instagram', 'tiktok', 'twitter', 'whatsapp', 'linkedin', 'hashtags'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, captions: parsed });
    } catch (error: any) {
      console.error('Error generating captions:', error);
      return res.status(500).json({ error: error.message || 'Gagal membuat caption.' });
    }
  });

  // Callout Text Refiner
  app.post('/api/refine-callout', async (req, res) => {
    try {
      const { title, description, context = '' } = req.body;

      const prompt = `
Perbaiki dan optimalkan judul dan deskripsi callout interaktif berikut agar lebih memikat, ringkas, dan bernilai jual tinggi dalam Bahasa Indonesia.
Konteks umum: ${context}
Judul asal: "${title}"
Deskripsi asal: "${description}"

Buat 3 variasi:
1. "marketing": Gaya persuasif, menonjolkan manfaat (benefit-driven)
2. "technical": Gaya spesifikasi teknis tajam dan presisi
3. "minimalist": Super ringkas, to-the-point

JSON format:
{
  "variations": [
    { "style": "marketing", "title": "...", "description": "...", "badge": "..." },
    { "style": "technical", "title": "...", "description": "...", "badge": "..." },
    { "style": "minimalist", "title": "...", "description": "...", "badge": "..." }
  ]
}
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, ...parsed });
    } catch (error: any) {
      console.error('Error refining callout:', error);
      return res.status(500).json({ error: error.message || 'Gagal memoles teks.' });
    }
  });

  // Media Proxy for Video/Image to guarantee CORS and Range requests support without browser errors
  app.get('/api/proxy-media', async (req, res) => {
    const mediaUrl = req.query.url as string;
    if (!mediaUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await fetch(mediaUrl, {
        headers,
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

      if (response.headers.get('content-type')) {
        res.setHeader('Content-Type', response.headers.get('content-type')!);
      }
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range')!);
      }
      if (response.headers.get('accept-ranges')) {
        res.setHeader('Accept-Ranges', response.headers.get('accept-ranges')!);
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length')!);
      }

      res.status(response.status);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (err: any) {
      console.error('Error proxying media:', err);
      res.status(500).send('Failed to fetch media');
    }
  });

  app.options('/api/proxy-media', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.sendStatus(204);
  });

  // Mount Vite or static
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CalloutStudio Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
