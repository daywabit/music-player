import { Song } from '../types/music';
import { generateCoverArt } from './id3Parser';

// Encodes audio buffer to WAV Blob locally without any network
function bufferToWave(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit depth

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < abuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Generate a soothing 18-second offline local lo-fi chord melody
export async function createDemoSong(title: string, artist: string, rootFreq: number): Promise<Song> {
  const sampleRate = 44100;
  const duration = 18;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Chord progression: Root, Major 3rd, 5th, Octave
  const notes = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 2];

  notes.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, 0);

    // Subtle gentle vibrato
    const lfo = offlineCtx.createOscillator();
    const lfoGain = offlineCtx.createGain();
    lfo.frequency.value = 4.5;
    lfoGain.gain.value = 2.0;
    lfo.connect(osc.frequency);
    lfo.start(0);

    // Envelope
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, duration - 0.5);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(duration);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = bufferToWave(renderedBuffer);

  return {
    id: `demo-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    artist,
    album: 'Pure Tones',
    duration,
    artworkUrl: generateCoverArt(title, artist),
    blob: wavBlob,
    addedAt: Date.now(),
    fileName: `${title}.wav`,
    fileSize: wavBlob.size,
  };
}
