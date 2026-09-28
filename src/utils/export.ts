import { Callout, Project } from '../types';

/**
 * Renders the media and visible callouts onto an HTML5 Canvas and returns a Data URL / Blob
 */
export async function captureCalloutCanvas(
  mediaElement: HTMLImageElement | HTMLVideoElement,
  callouts: Callout[],
  projectTitle: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context tidak tersedia');

  // Determine intrinsic dimensions
  let width = 1280;
  let height = 720;

  if (mediaElement instanceof HTMLImageElement) {
    width = mediaElement.naturalWidth || 1280;
    height = mediaElement.naturalHeight || 720;
  } else if (mediaElement instanceof HTMLVideoElement) {
    width = mediaElement.videoWidth || 1280;
    height = mediaElement.videoHeight || 720;
  }

  canvas.width = width;
  canvas.height = height;

  // Draw media base
  ctx.drawImage(mediaElement, 0, 0, width, height);

  // Subtle vignette / overlay for callout contrast
  const gradient = ctx.createLinearGradient(0, height - 100, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw Project Branding watermark
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(projectTitle || 'CalloutStudio AI', 32, height - 32);

  // Render each visible callout
  const activeCallouts = callouts.filter(c => c.visible);

  for (const c of activeCallouts) {
    const targetX = (c.targetX / 100) * width;
    const targetY = (c.targetY / 100) * height;
    const color = c.accentColor || '#06b6d4';
    const boxType = c.boxType || 'card';

    ctx.save();

    // 1. Draw Target Pin
    // Outer glow
    ctx.beginPath();
    ctx.arc(targetX, targetY, 20, 0, Math.PI * 2);
    ctx.fillStyle = color + '33'; // 20% opacity
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(targetX, targetY, 13, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = c.lineWidth ? Math.max(2, c.lineWidth) : 2.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 2. Calculate card / line end position
    const configuredWidth = c.boxWidth || (c.boxSize === 'sm' ? 190 : c.boxSize === 'lg' ? 360 : 280);
    const cardWidth = Math.min(configuredWidth, width * 0.4);
    const cardPadding = cardWidth < 220 ? 12 : 16;
    const lineOffset = (c.lineLength || 18) * 4;

    let cardX = targetX + lineOffset;
    let cardY = targetY - 50;

    if (c.cardPosition.includes('left') || targetX > width * 0.65) {
      cardX = targetX - lineOffset - (boxType !== 'none' ? cardWidth : 0);
    }
    if (c.cardPosition.includes('bottom') || targetY < 120) {
      cardY = targetY + 30;
    }

    // Keep inside bounds
    cardX = Math.max(20, Math.min(width - cardWidth - 20, cardX));
    cardY = Math.max(20, Math.min(height - 180, cardY));

    // 3. Draw connector line
    const endX = boxType === 'none' ? (cardX > targetX ? targetX + lineOffset : targetX - lineOffset) : (cardX > targetX ? cardX : cardX + cardWidth);
    const endY = boxType === 'none' ? targetY - 30 : cardY + 25;

    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    const midX = (targetX + endX) / 2;
    ctx.lineTo(midX, targetY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = c.lineWidth || 2;
    ctx.setLineDash(c.connectorType === 'dashed' ? [5, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // End point circle
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Optional Arrowhead pointing to target
    if (c.showArrowHead) {
      drawArrowHead(ctx, midX, targetY, targetX, targetY, color);
    }

    // IF BOX TYPE IS 'none' -> STOP HERE! GARIS SAJA TANPA KOTAK KETERANGAN
    if (boxType === 'none') {
      ctx.restore();
      continue;
    }

    // IF BOX TYPE IS 'text-only' -> TEKS SAJA TANPA LATAR KOTAK
    if (boxType === 'text-only') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      if (c.badgeText) {
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(c.badgeText.toUpperCase(), cardX, cardY + 16);
      }
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#ffffff';
      const textTitleY = c.badgeText ? cardY + 34 : cardY + 20;
      ctx.fillText(c.title, cardX, textTitleY, cardWidth);

      if (c.description) {
        ctx.font = '400 11px sans-serif';
        ctx.fillStyle = '#e2e8f0';
        wrapText(ctx, c.description, cardX, textTitleY + 18, cardWidth, 15);
      }
      ctx.restore();
      continue;
    }

    // IF BOX TYPE IS 'card' or 'badge-only' -> DRAW ADJUSTABLE BOX WITH CUSTOM OPACITY
    const opacityVal = c.boxOpacity !== undefined ? c.boxOpacity : 90;
    const bgAlpha = opacityVal / 100;
    const cardHeight = c.description ? (cardWidth < 220 ? 80 : 96) : 60;

    ctx.fillStyle = `rgba(15, 23, 42, ${bgAlpha})`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 10);
    if (bgAlpha > 0) {
      ctx.fill();
    }
    ctx.stroke();

    // 5. Draw Card Badge
    if (c.badgeText) {
      ctx.font = '700 10px sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(c.badgeText.toUpperCase(), cardX + cardPadding, cardY + 20);
    }

    // 6. Draw Card Title
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    const titleY = c.badgeText ? cardY + 38 : cardY + 24;
    ctx.fillText(c.title, cardX + cardPadding, titleY, cardWidth - cardPadding * 2);

    // 7. Draw Card Description
    if (c.description) {
      ctx.font = '400 11px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      wrapText(ctx, c.description, cardX + cardPadding, titleY + 18, cardWidth - cardPadding * 2, 15);
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

function drawArrowHead(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesCount++;
      if (linesCount >= 2) {
        ctx.fillText(words.slice(n).join(' ') + '...', x, currentY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

/**
 * Downloads a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a complete, single-file interactive HTML web viewer for the project
 */
export function generateInteractiveHtmlEmbed(project: Project): string {
  const jsonStr = JSON.stringify(project).replace(/<\/script>/g, '<\\/script>');
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.title} - Callout Interaktif</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .container {
      width: 100%;
      max-width: 1080px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title { font-size: 1.15rem; font-weight: 700; color: #fff; }
    .badge { font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 9999px; background: rgba(6,182,212,0.15); color: #06b6d4; font-weight: 600; }
    .media-box {
      position: relative;
      width: 100%;
      background: #020617;
      overflow: hidden;
      user-select: none;
    }
    .media-content {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
    }
    .pin {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 20;
    }
    .pin-pulse {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      position: absolute;
      top: -16px;
      left: -16px;
      opacity: 0.75;
      animation: pulseAnim 2s infinite ease-out;
    }
    .pin-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #06b6d4;
      position: absolute;
      top: -8px;
      left: -8px;
      transition: transform 0.2s;
    }
    .pin:hover .pin-dot { transform: scale(1.3); }
    .card {
      position: absolute;
      border: 1px solid rgba(6,182,212,0.5);
      backdrop-filter: blur(12px);
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      width: 260px;
      font-size: 0.85rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      z-index: 30;
      transition: all 0.25s ease;
      pointer-events: auto;
    }
    .card-title { font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .card-desc { color: #cbd5e1; font-size: 0.78rem; line-height: 1.4; }
    .card-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; display: inline-block; color: #06b6d4; }
    @keyframes pulseAnim {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .footer {
      padding: 0.85rem 1.5rem;
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${project.title}</h1>
      <span class="badge">Interaktif</span>
    </div>
    <div class="media-box" id="mediaBox">
      ${
        project.mediaType === 'video'
          ? `<video id="videoEl" class="media-content" src="${project.mediaUrl}" controls loop playsinline></video>`
          : `<img id="imageEl" class="media-content" src="${project.mediaUrl}" alt="${project.title}" />`
      }
      <div id="calloutLayer"></div>
    </div>
    <div class="footer">
      <span>Klik atau sentuh pin untuk melihat informasi lengkap</span>
      <span>Dibuat dengan CalloutStudio AI</span>
    </div>
  </div>

  <script>
    const project = ${jsonStr};
    const layer = document.getElementById('calloutLayer');
    let activeCardId = null;

    function renderCallouts() {
      layer.innerHTML = '';
      project.callouts.forEach(c => {
        if (!c.visible) return;
        const pin = document.createElement('div');
        pin.className = 'pin';
        pin.style.left = c.targetX + '%';
        pin.style.top = c.targetY + '%';

        const pulse = document.createElement('div');
        pulse.className = 'pin-pulse';
        pulse.style.background = c.accentColor || '#06b6d4';

        const dot = document.createElement('div');
        dot.className = 'pin-dot';
        dot.style.borderColor = c.accentColor || '#06b6d4';

        pin.appendChild(pulse);
        pin.appendChild(dot);

        // If boxType === 'none', no card is appended!
        if (c.boxType !== 'none') {
          const card = document.createElement('div');
          card.className = 'card';
          card.id = 'card-' + c.id;
          card.style.borderColor = c.accentColor || '#06b6d4';
          
          const op = c.boxOpacity !== undefined ? c.boxOpacity : 90;
          card.style.background = 'rgba(15, 23, 42, ' + (op / 100) + ')';
          if (c.boxWidth) {
            card.style.width = c.boxWidth + 'px';
          }
          
          let cardLeft = c.targetX > 60 ? (c.targetX - 25) : (c.targetX + 3);
          let cardTop = c.targetY > 70 ? (c.targetY - 15) : (c.targetY + 2);
          card.style.left = cardLeft + '%';
          card.style.top = cardTop + '%';

          card.innerHTML = \`
            \${c.badgeText ? \`<span class="card-badge" style="color: \${c.accentColor || '#06b6d4'}">\${c.badgeText}</span>\` : ''}
            <div class="card-title">\${c.title}</div>
            \${c.description ? \`<div class="card-desc">\${c.description}</div>\` : ''}
          \`;

          pin.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrent = activeCardId === c.id;
            document.querySelectorAll('.card').forEach(el => el.style.display = 'none');
            if (!isCurrent) {
              card.style.display = 'block';
              activeCardId = c.id;
            } else {
              activeCardId = null;
            }
          });

          layer.appendChild(card);
        }

        layer.appendChild(pin);
      });
    }

    renderCallouts();
    document.addEventListener('click', () => {
      document.querySelectorAll('.card').forEach(el => el.style.display = 'none');
      activeCardId = null;
    });
  </script>
</body>
</html>`;
}
