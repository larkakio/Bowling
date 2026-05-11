import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

function svgIcon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#120018"/>
      <stop offset="45%" style="stop-color:#05202a"/>
      <stop offset="100%" style="stop-color:#200010"/>
    </linearGradient>
    <radialGradient id="ball" cx="40%" cy="40%" r="55%">
      <stop offset="0%" style="stop-color:#f5fff0"/>
      <stop offset="40%" style="stop-color:#00ffbf"/>
      <stop offset="100%" style="stop-color:#00483a"/>
    </radialGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" result="b"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <g opacity="0.25" stroke="#00fff0" stroke-width="2">
    ${Array.from({ length: 24 })
      .map((_, i) => {
        const x = (i * 48) % 1024;
        return `<line x1="${x}" y1="0" x2="${x + 520}" y2="1024"/>`;
      })
      .join('')}
  </g>
  <circle cx="712" cy="220" r="180" fill="#ff2eea" opacity="0.12" filter="url(#blur)"/>
  <circle cx="220" cy="780" r="220" fill="#00fff0" opacity="0.1" filter="url(#blur)"/>
  <ellipse cx="520" cy="280" rx="120" ry="40" fill="none" stroke="#ff2eea" stroke-width="6" opacity="0.85" transform="rotate(-8 520 280)"/>
  <ellipse cx="520" cy="320" rx="95" ry="32" fill="none" stroke="#00fff0" stroke-width="5" opacity="0.75"/>
  <ellipse cx="520" cy="360" rx="70" ry="26" fill="none" stroke="#7cff00" stroke-width="4" opacity="0.65"/>
  <circle cx="512" cy="640" r="108" fill="url(#ball)" stroke="#7cff00" stroke-width="6"/>
  <polygon points="505,530 540,635 580,640 545,720 520,620 485,720 520,645" fill="#ff2eea" opacity="0.85"/>
  <text x="512" y="920" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="56" font-weight="700" fill="#00fff0" style="letter-spacing:14px">BASE</text>
  <text x="512" y="980" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#e8aaff" opacity="0.85">NEO-BOWLING</text>
</svg>`;
}

function svgThumb() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1910" height="1000" viewBox="0 0 1910 1000">
  <defs>
    <linearGradient id="lane" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0a0014"/>
      <stop offset="50%" style="stop-color:#052228"/>
      <stop offset="100%" style="stop-color:#14000c"/>
    </linearGradient>
    <linearGradient id="burst" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00fff0"/>
      <stop offset="50%" style="stop-color:#ff2eea"/>
      <stop offset="100%" style="stop-color:#7cff00"/>
    </linearGradient>
  </defs>
  <rect width="1910" height="1000" fill="url(#lane)"/>
  <path d="M955 80 L1300 920 L610 920 Z" fill="#030308" stroke="url(#burst)" stroke-width="8" opacity="0.95"/>
  <line x1="955" y1="120" x2="955" y2="860" stroke="#00fff0" stroke-width="3" opacity="0.4"/>
  ${[0, 1, 2, 3]
    .map(
      (row) =>
        `<g fill="none" stroke="#ff2eea" stroke-width="4" opacity="0.7">${[
          ...Array(row + 1),
        ]
          .map((_, i) => {
            const cx = 955 - (row * 36) / 2 + i * 36;
            const cy = 260 + row * 44;
            return `<circle cx="${cx}" cy="${cy}" r="18"/>`;
          })
          .join('')}</g>`,
    )
    .join('')}
  <circle cx="955" cy="780" r="48" fill="#00ffbf" stroke="#7cff00" stroke-width="5" opacity="0.95"/>
  <text x="955" y="120" text-anchor="middle" fill="url(#burst)" font-family="Arial Black,sans-serif" font-size="72" font-weight="800" style="letter-spacing:20px">LANE SECTOR</text>
  <text x="955" y="972" text-anchor="middle" fill="#a8fff8" font-family="sans-serif" font-size="32" opacity="0.9">Swipe • Strike the grid • Built on Base</text>
</svg>`;
}

async function jpegUnder1mb(label, svgMaker, dest, startQ) {
  let q = startQ;
  let buf = await sharp(Buffer.from(svgMaker()))
    .jpeg({ quality: q, mozjpeg: true })
    .toBuffer();
  while (buf.byteLength > 1_048_576 && q > 45) {
    q -= 5;
    buf = await sharp(Buffer.from(svgMaker()))
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();
  }
  if (buf.byteLength > 1_048_576) {
    throw new Error(`${label}: still exceeds 1MB at quality ${q}`);
  }
  writeFileSync(dest, buf);
  return buf.byteLength;
}

async function main() {
  const iconPath = join(publicDir, 'app-icon.jpg');
  const thumbPath = join(publicDir, 'app-thumbnail.jpg');
  const iconBytes = await jpegUnder1mb('app-icon', svgIcon, iconPath, 88);
  const thumbBytes = await jpegUnder1mb('app-thumbnail', svgThumb, thumbPath, 86);
  console.log(`Wrote ${iconPath} (${iconBytes} bytes)`);
  console.log(`Wrote ${thumbPath} (${thumbBytes} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
