import { Song } from '../types/music';

// Syncsafe integer decoder for ID3 tags
function readSyncsafeInt(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

// Convert bytes to Base64 data URL reliably
function bytesToDataUrl(bytes: Uint8Array, mimeType: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const copy = new Uint8Array(bytes);
      const blob = new Blob([copy.buffer as ArrayBuffer], { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    } catch {
      resolve('');
    }
  });
}

// Detect image MIME type directly from magic bytes
function detectImageMimeType(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

// Clean non-printable control characters and null bytes that cause tofu boxes (□) on iOS
export function cleanString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F\uFFFF]/g, '')
    .trim();
}

// Decode text according to ID3 encoding byte
function decodeText(bytes: Uint8Array, encoding: number): string {
  try {
    let decoded = '';
    if (encoding === 0) {
      decoded = new TextDecoder('latin1').decode(bytes);
    } else if (encoding === 1) {
      decoded = new TextDecoder('utf-16').decode(bytes);
    } else if (encoding === 2) {
      decoded = new TextDecoder('utf-16be').decode(bytes);
    } else if (encoding === 3) {
      decoded = new TextDecoder('utf-8').decode(bytes);
    } else {
      decoded = new TextDecoder('utf-8').decode(bytes);
    }
    return cleanString(decoded);
  } catch {
    return '';
  }
}

// Generate aesthetic reference artwork: 3D illuminated floating orbs on dark backdrop
export function generateCoverArt(title: string, artist: string): string {
  let hash = 0;
  const str = `${title}-${artist}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // Base hue: default around 205 (sky/cyan blue like the reference photo)
  const isDefaultDemo = title.toLowerCase().includes('velvet') || title.toLowerCase().includes('demo');
  const baseHue = isDefaultDemo ? 205 : Math.abs(hash % 360);
  const lightHue = (baseHue + 15) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
      <radialGradient id="sphere1" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="hsl(${lightHue}, 90%, 82%)" />
        <stop offset="40%" stop-color="hsl(${baseHue}, 85%, 62%)" />
        <stop offset="80%" stop-color="hsl(${baseHue}, 90%, 35%)" />
        <stop offset="100%" stop-color="#050a14" />
      </radialGradient>
      <radialGradient id="sphere2" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="hsl(${lightHue}, 95%, 85%)" />
        <stop offset="50%" stop-color="hsl(${baseHue}, 85%, 58%)" />
        <stop offset="85%" stop-color="hsl(${baseHue}, 95%, 32%)" />
        <stop offset="100%" stop-color="#03060c" />
      </radialGradient>
      <radialGradient id="sphere3" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="hsl(${lightHue}, 90%, 88%)" />
        <stop offset="45%" stop-color="hsl(${baseHue}, 80%, 65%)" />
        <stop offset="85%" stop-color="hsl(${baseHue}, 90%, 38%)" />
        <stop offset="100%" stop-color="#020408" />
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="hsl(${baseHue}, 90%, 55%)" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    
    <!-- Deep Space Background -->
    <rect width="600" height="600" fill="#08080a" />
    
    <!-- Ambient Light Glow -->
    <circle cx="350" cy="250" r="300" fill="url(#glow)" />
    
    <!-- Top-Right Huge Floating Sphere (Reference Image) -->
    <circle cx="480" cy="50" r="220" fill="url(#sphere1)" />

    <!-- Center Floating Sphere -->
    <circle cx="330" cy="280" r="140" fill="url(#sphere2)" opacity="0.9" />

    <!-- Bottom-Left Large Sphere -->
    <circle cx="100" cy="480" r="190" fill="url(#sphere1)" />

    <!-- Mid-Left Small Floating Bubble -->
    <circle cx="60" cy="240" r="45" fill="url(#sphere3)" />

    <!-- Bottom-Center Small Sphere -->
    <circle cx="360" cy="530" r="75" fill="url(#sphere2)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Parse audio duration from audio element
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      cleanup();
      resolve(isFinite(dur) && dur > 0 ? dur : 0);
    };

    audio.onerror = () => {
      cleanup();
      resolve(0);
    };

    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 4000);
  });
}

// Parse MP4 / M4A metadata atoms (moov -> udta -> meta -> ilst -> covr)
async function parseM4AArtworkAndMeta(file: File): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}> {
  try {
    const slice = file.slice(0, Math.min(file.size, 1048576));
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    let title = '';
    let artist = '';
    let album = '';
    let artworkUrl = '';

    for (let i = 0; i < bytes.length - 8; i++) {
      if (bytes[i] === 0xa9 && bytes[i + 1] === 0x6e && bytes[i + 2] === 0x61 && bytes[i + 3] === 0x6d) {
        const atomSize = view.getUint32(Math.max(0, i - 4));
        if (atomSize > 8 && atomSize < 500 && i + atomSize <= bytes.length) {
          const textSlice = bytes.slice(i + 20, i + atomSize);
          title = cleanString(new TextDecoder('utf-8').decode(textSlice));
        }
      }
      if (bytes[i] === 0xa9 && bytes[i + 1] === 0x41 && bytes[i + 2] === 0x52 && bytes[i + 3] === 0x54) {
        const atomSize = view.getUint32(Math.max(0, i - 4));
        if (atomSize > 8 && atomSize < 500 && i + atomSize <= bytes.length) {
          const textSlice = bytes.slice(i + 20, i + atomSize);
          artist = cleanString(new TextDecoder('utf-8').decode(textSlice));
        }
      }
      if (
        bytes[i] === 0x63 &&
        bytes[i + 1] === 0x6f &&
        bytes[i + 2] === 0x76 &&
        bytes[i + 3] === 0x72
      ) {
        const atomSize = view.getUint32(Math.max(0, i - 4));
        if (atomSize > 16 && i + atomSize <= bytes.length) {
          const dataOffset = i + 4;
          const imgBytes = bytes.slice(dataOffset + 16, i + atomSize);
          if (imgBytes.length > 32) {
            const mime = detectImageMimeType(imgBytes);
            artworkUrl = await bytesToDataUrl(imgBytes, mime);
          }
        }
      }
    }

    return { title, artist, album, artworkUrl };
  } catch {
    return {};
  }
}

// Clean filename into artist and title
function parseNameFromFilename(filename: string): { title: string; artist: string } {
  const withoutExt = filename.replace(/\.[^/.]+$/, '').trim();
  const cleaned = withoutExt.replace(/_/g, ' ');

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { title: title || 'Unknown Title', artist: artist || 'Unknown Artist' };
  }

  return { title: cleaned || 'Unknown Title', artist: 'Unknown Artist' };
}

export const MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function parseAudioFile(file: File): Promise<Song> {
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    throw new Error(`"${file.name}" exceeds 100MB size limit (${Math.round(file.size / (1024 * 1024))}MB).`);
  }

  let title = '';
  let artist = '';
  let album = '';
  let artworkUrl: string | undefined;

  try {
    const headerBuffer = await file.slice(0, 10).arrayBuffer();
    const headerView = new DataView(headerBuffer);

    if (
      headerBuffer.byteLength >= 10 &&
      headerView.getUint8(0) === 0x49 &&
      headerView.getUint8(1) === 0x44 &&
      headerView.getUint8(2) === 0x33
    ) {
      const majorVersion = headerView.getUint8(3);
      const tagSize = readSyncsafeInt(headerView, 6);
      
      const readLength = Math.min(file.size, Math.min(12582912, 10 + tagSize + 512));
      const fullBuffer = await file.slice(0, readLength).arrayBuffer();
      const view = new DataView(fullBuffer);
      const fullBytes = new Uint8Array(fullBuffer);

      let offset = 10;
      const maxOffset = Math.min(fullBuffer.byteLength, 10 + tagSize);

      while (offset + 10 <= maxOffset) {
        let frameId = '';
        for (let i = 0; i < 4; i++) {
          const charCode = view.getUint8(offset + i);
          if (charCode === 0) break;
          frameId += String.fromCharCode(charCode);
        }

        if (frameId.length < 4) break;

        let frameSize = 0;
        if (majorVersion === 4) {
          frameSize = readSyncsafeInt(view, offset + 4);
        } else {
          frameSize = view.getUint32(offset + 4);
        }

        if (frameSize <= 0 || offset + 10 + frameSize > fullBuffer.byteLength) {
          break;
        }

        const frameDataOffset = offset + 10;
        const frameData = fullBytes.subarray(frameDataOffset, frameDataOffset + frameSize);

        if (frameId === 'TIT2' && !title) {
          const encoding = frameData[0];
          title = decodeText(frameData.slice(1), encoding);
        } else if (frameId === 'TPE1' && !artist) {
          const encoding = frameData[0];
          artist = decodeText(frameData.slice(1), encoding);
        } else if (frameId === 'TALB' && !album) {
          const encoding = frameData[0];
          album = decodeText(frameData.slice(1), encoding);
        } else if (frameId === 'APIC' && !artworkUrl) {
          try {
            const encoding = frameData[0];
            let pos = 1;

            let mimeType = '';
            while (pos < frameData.length && frameData[pos] !== 0) {
              mimeType += String.fromCharCode(frameData[pos]);
              pos++;
            }
            pos++;

            pos++;

            if (encoding === 1 || encoding === 2) {
              while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
                pos += 2;
              }
              pos += 2;
            } else {
              while (pos < frameData.length && frameData[pos] !== 0) {
                pos++;
              }
              pos++;
            }

            if (pos < frameData.length) {
              const imgBytes = frameData.subarray(pos);
              if (imgBytes.length > 32) {
                const detectedMime = detectImageMimeType(imgBytes) || mimeType || 'image/jpeg';
                artworkUrl = await bytesToDataUrl(imgBytes, detectedMime);
              }
            }
          } catch (e) {
            console.warn('Could not parse APIC picture frame', e);
          }
        }

        offset += 10 + frameSize;
      }
    }
  } catch (err) {
    console.warn('ID3 tag parse error', err);
  }

  if (!artworkUrl && /\.(m4a|aac|mp4)$/i.test(file.name)) {
    const m4aMeta = await parseM4AArtworkAndMeta(file);
    if (!title && m4aMeta.title) title = m4aMeta.title;
    if (!artist && m4aMeta.artist) artist = m4aMeta.artist;
    if (!album && m4aMeta.album) album = m4aMeta.album;
    if (m4aMeta.artworkUrl) artworkUrl = m4aMeta.artworkUrl;
  }

  const fallback = parseNameFromFilename(file.name);
  title = cleanString(title || fallback.title) || 'Unknown Title';
  artist = cleanString(artist || fallback.artist) || 'Unknown Artist';
  album = cleanString(album || 'Single') || 'Single';

  if (!artworkUrl) {
    artworkUrl = generateCoverArt(title, artist);
  }

  const duration = await getAudioDuration(file);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    artist,
    album,
    duration,
    artworkUrl,
    blob: file,
    addedAt: Date.now(),
    fileName: file.name,
    fileSize: file.size,
  };
}
