export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  artworkUrl?: string; // Data URL or object URL
  blob: Blob; // Local audio binary blob for offline playback
  addedAt: number;
  fileName: string;
  fileSize: number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  songIds: string[]; // Array of song IDs in order
  coverUrl?: string; // Optional cover or dynamic preview
}

export type PlaybackMode = 'standard' | 'repeat-all' | 'repeat-one' | 'shuffle';

export type ActiveTab = 'library' | 'add';
