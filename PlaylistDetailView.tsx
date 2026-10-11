import React from 'react';
import { 
  ChevronLeft, 
  Play, 
  Shuffle, 
  Plus, 
  Trash2, 
  FolderMinus,
  Music
} from 'lucide-react';
import { Playlist, Song } from '../types/music';
import { playUiTap, playUiSwitch } from '../lib/uiSounds';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  playlistSongs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onBack: () => void;
  onPlaySong: (song: Song, queue: Song[]) => void;
  onPlayAll: (shuffle?: boolean) => void;
  onAddSongsClick: () => void;
  onRemoveSongFromPlaylist: (songId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  playlistSongs,
  currentSong,
  isPlaying,
  onBack,
  onPlaySong,
  onPlayAll,
  onAddSongsClick,
  onRemoveSongFromPlaylist,
  onDeletePlaylist,
}) => {
  const totalDuration = playlistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalMins = Math.round(totalDuration / 60);
  const firstArtwork = playlistSongs.find((s) => s.artworkUrl)?.artworkUrl || playlist.coverUrl;

  return (
    <div
      className={`flex-1 flex flex-col w-full max-w-md mx-auto px-4 overflow-y-auto no-scrollbar animate-fade-in ${
        currentSong
          ? 'pb-[calc(env(safe-area-inset-bottom,6px)+105px)]'
          : 'pb-[calc(env(safe-area-inset-bottom,6px)+54px)]'
      }`}
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => {
            playUiSwitch(isPlaying);
            onBack();
          }}
          className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors py-1 pr-3"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          <span>Playlists</span>
        </button>

        <button
          onClick={() => {
            if (confirm(`Delete playlist "${playlist.name}"?`)) {
              onDeletePlaylist(playlist.id);
            }
          }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete Playlist"
        >
          <FolderMinus className="w-4 h-4" />
        </button>
      </div>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col items-center text-center mb-6">
        {/* Cover Art */}
        <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-xl bg-neutral-900 border border-white/15 mb-3.5 flex items-center justify-center">
          {firstArtwork ? (
            <img
              src={firstArtwork}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600">
              <Music className="w-12 h-12 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          {playlist.name}
        </h2>
        <p className="text-xs text-zinc-400 font-medium">
          {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
          {totalMins > 0 ? ` · ${totalMins} min` : ''}
        </p>

        {/* Action Buttons: Play, Shuffle, Add */}
        <div className="flex items-center gap-2.5 mt-4 w-full">
          <button
            onClick={() => onPlayAll(false)}
            disabled={playlistSongs.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs active:scale-95 transition-all disabled:opacity-40 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-black stroke-none" />
            <span>Play</span>
          </button>

          <button
            onClick={() => onPlayAll(true)}
            disabled={playlistSongs.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs active:scale-95 transition-all disabled:opacity-40 border border-white/10"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={onAddSongsClick}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all border border-white/10"
            title="Add local music to this playlist"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Playlist Tracks */}
      {playlistSongs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <p className="text-xs text-zinc-400 mb-3">
            This playlist has no songs yet.
          </p>
          <button
            onClick={onAddSongsClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Songs</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {playlistSongs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={`${song.id}-${index}`}
                onClick={() => onPlaySong(song, playlistSongs)}
                className={`group flex items-center justify-between py-2.5 px-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                  isCurrent
                    ? 'bg-white/15 border border-white/15 shadow-sm'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                    {song.artworkUrl ? (
                      <img
                        src={song.artworkUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                        ♪
                      </div>
                    )}

                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-semibold truncate tracking-tight ${
                        isCurrent ? 'text-white' : 'text-zinc-100'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-zinc-300 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-300 font-mono">
                    {formatDuration(song.duration)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSongFromPlaylist(song.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
