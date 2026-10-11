import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createPNG(width, height) {
  // RGBA buffer: width * 4 + 1 (filter byte 0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Squircle background with pure dark aesthetics
      const cornerR = width * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
      const inRoundedRect = Math.sqrt(qx * qx + qy * qy) <= cornerR;

      if (!inRoundedRect) {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Vinyl groove ring highlight
      if (Math.abs(dist - radius * 0.8) < 1.5 || Math.abs(dist - radius * 0.55) < 1.5) {
        rawData[pixelOffset] = 60;
        rawData[pixelOffset + 1] = 60;
        rawData[pixelOffset + 2] = 65;
        rawData[pixelOffset + 3] = 255;
      } else if (dist < radius * 0.25) {
        // Center spindle
        if (dist < radius * 0.08) {
          rawData[pixelOffset] = 10;
          rawData[pixelOffset + 1] = 10;
          rawData[pixelOffset + 2] = 12;
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = 240;
          rawData[pixelOffset + 1] = 240;
          rawData[pixelOffset + 2] = 245;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Deep dark background
        const grad = Math.max(0, Math.min(255, Math.floor(18 + (y / height) * 12)));
        rawData[pixelOffset] = grad;
        rawData[pixelOffset + 1] = grad;
        rawData[pixelOffset + 2] = grad + 4;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  // Compress raw data
  const compressed = zlib.deflateSync(rawData);

  // PNG structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180));
console.log('Generated PWA and Apple Touch icons successfully.');
