import React, { useRef, useState } from 'react';
import { Upload, X, Music, Loader2, FolderPlus } from 'lucide-react';
import { Song, Playlist } from '../types/music';
import { parseAudioFile } from '../lib/id3Parser';

interface AddMusicModalProps {
  isOpen: boolean;
  targetPlaylist: Playlist | null;
  availablePlaylists: Playlist[];
  onClose: () => void;
  onSongsAddedToPlaylist: (newSongs: Song[], playlistId: string) => void;
  onCreatePlaylistWithSongs: (playlistName: string, newSongs: Song[]) => void;
}

export const AddMusicModal: React.FC<AddMusicModalProps> = ({
  isOpen,
  targetPlaylist,
  availablePlaylists,
  onClose,
  onSongsAddedToPlaylist,
  onCreatePlaylistWithSongs,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    targetPlaylist?.id || (availablePlaylists[0]?.id ?? 'new')
  );
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      alert('Please select audio files.');
      setIsProcessing(false);
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    const oversizedFiles = audioFiles.filter((f) => f.size > MAX_SIZE);
    const validFiles = audioFiles.filter((f) => f.size <= MAX_SIZE);

    if (oversizedFiles.length > 0) {
      alert(
        `Security Notice: ${oversizedFiles.length} file(s) exceeded the 100MB limit and were skipped:\n` +
          oversizedFiles.map((f) => `• ${f.name} (${Math.round(f.size / (1024 * 1024))}MB)`).join('\n')
      );
    }

    if (validFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    const importedSongs: Song[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setProgressText(`Adding ${i + 1} of ${validFiles.length}: ${file.name}`);
      try {
        const song = await parseAudioFile(file);
        importedSongs.push(song);
      } catch (err) {
        console.error('Failed to parse audio file', file.name, err);
      }
    }

    if (importedSongs.length > 0) {
      if (targetPlaylist) {
        onSongsAddedToPlaylist(importedSongs, targetPlaylist.id);
      } else if (selectedPlaylistId === 'new' || availablePlaylists.length === 0) {
        const nameToUse = newPlaylistName.trim() || `Playlist ${new Date().toLocaleDateString()}`;
        onCreatePlaylistWithSongs(nameToUse, importedSongs);
      } else {
        onSongsAddedToPlaylist(importedSongs, selectedPlaylistId);
      }
    }

    setIsProcessing(false);
    setProgressText('');
    setNewPlaylistName('');
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl glass-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-2xl border border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Music className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Add Music
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist selector if not in a specific playlist */}
        {!targetPlaylist && (
          <div className="mb-4">
            <div className="space-y-2">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full bg-white/10 text-white text-xs rounded-xl px-3 py-2.5 border border-white/15 focus:outline-none focus:border-white/30"
              >
                {availablePlaylists.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                    {p.name}
                  </option>
                ))}
                <option value="new" className="bg-zinc-900 text-white">
                  + New Playlist...
                </option>
              </select>

              {(selectedPlaylistId === 'new' || availablePlaylists.length === 0) && (
                <div className="flex items-center gap-2 mt-2">
                  <FolderPlus className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 bg-white/10 text-white placeholder-zinc-500 text-xs rounded-xl px-3 py-2 border border-white/15 focus:outline-none"
                    maxLength={40}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Drop Zone / Button without wordy instructions */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-white bg-white/10'
              : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/[0.07]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
              <p className="text-xs text-zinc-300 font-mono">
                {progressText}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Upload className="w-5 h-5 stroke-[2]" />
              </div>
              <p className="text-sm font-semibold text-white">
                Select Audio Files
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
