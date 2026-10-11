import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  ChevronRight, 
  Music, 
  FolderPlus,
  Play,
  RotateCw
} from 'lucide-react';
import { Playlist, Song } from '../types/music';
import { playUiTap, playUiRefresh, playUiSwitch } from '../lib/uiSounds';

interface LibraryViewProps {
  playlists: Playlist[];
  allSongs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onRefresh: () => Promise<void>;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenCreatePlaylistModal: () => void;
  onPlaySongDirectly: (song: Song) => void;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const PULL_THRESHOLD = 64; // px to trigger refresh
const PULL_MAX = 90; // max rubber-band limit

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  allSongs,
  currentSong,
  isPlaying,
  onRefresh,
  onSelectPlaylist,
  onOpenCreatePlaylistModal,
  onPlaySongDirectly,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const isPulling = useRef<boolean>(false);

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isRefreshing) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0) {
      touchStartY.current = clientY;
      isPulling.current = true;
    } else {
      touchStartY.current = null;
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPulling.current || touchStartY.current === null || isRefreshing) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = clientY - touchStartY.current;

    if (diff > 0) {
      // Rubber-band resistance curve
      const pull = Math.min(PULL_MAX, Math.pow(diff, 0.85) * 1.5);
      setPullDistance(pull);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || touchStartY.current === null) return;
    isPulling.current = false;
    touchStartY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.75); // Hold at spinner height
      playUiRefresh(isPlaying);

      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
  };

  const trimmedQuery = searchQuery.toLowerCase().trim();

  // Search across songs
  const matchedSongs = trimmedQuery
    ? allSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(trimmedQuery) ||
          s.artist.toLowerCase().includes(trimmedQuery) ||
          s.album.toLowerCase().includes(trimmedQuery)
      )
    : [];

  // Search across playlists
  const matchedPlaylists = trimmedQuery
    ? playlists.filter((p) => p.name.toLowerCase().includes(trimmedQuery))
    : playlists;

  const pullProgress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      className={`flex-1 flex flex-col w-full max-w-md mx-auto px-4 overflow-y-auto no-scrollbar relative select-none ${
        currentSong
          ? 'pb-[calc(env(safe-area-inset-bottom,6px)+105px)]'
          : 'pb-[calc(env(safe-area-inset-bottom,6px)+54px)]'
      }`}
    >
      {/* Pull-To-Refresh Indicator */}
      <div
        className="w-full flex items-center justify-center pointer-events-none transition-all duration-200 overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-sm">
          <RotateCw
            className={`w-3.5 h-3.5 ${
              isRefreshing
                ? 'animate-spin text-white'
                : 'text-zinc-300 transition-transform'
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${pullProgress * 360}deg)`,
            }}
          />
          <span className="text-zinc-300">
            {isRefreshing
              ? 'Refreshing database...'
              : pullDistance >= PULL_THRESHOLD
              ? 'Release to refresh'
              : 'Pull down to refresh'}
          </span>
        </div>
      </div>

      {/* 1. Search Bar - Positioned ABOVE the Title of the Library */}
      <div className="pt-1 pb-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search songs or playlists"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 focus:bg-white/15 text-white placeholder-zinc-400 text-sm rounded-xl pl-10 pr-9 py-2.5 border border-white/10 focus:outline-none focus:border-white/25 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                playUiTap(isPlaying);
                setSearchQuery('');
              }}
              className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* When Search Query is active */}
      {trimmedQuery ? (
        <div className="space-y-5 animate-fade-in">
          {/* Quick Match Songs */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Songs ({matchedSongs.length})
              </span>
            </div>

            {matchedSongs.length === 0 ? (
              <p className="text-xs text-zinc-500 px-1 py-2">No matching songs</p>
            ) : (
              <div className="flex flex-col divide-y divide-white/5 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                {matchedSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        playUiTap(isPlaying);
                        onPlaySongDirectly(song);
                      }}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-white/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
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
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">
                          {formatDuration(song.duration)}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
                          <Play className="w-3 h-3 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matching Playlists */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Playlists ({matchedPlaylists.length})
              </span>
            </div>

            {matchedPlaylists.length === 0 ? (
              <p className="text-xs text-zinc-500 px-1 py-2">No matching playlists</p>
            ) : (
              <div className="flex flex-col gap-2">
                {matchedPlaylists.map((playlist) => {
                  const pSongs = allSongs.filter((s) => playlist.songIds.includes(s.id));
                  const cover = pSongs.find((s) => s.artworkUrl)?.artworkUrl;

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => {
                        playUiSwitch(isPlaying);
                        onSelectPlaylist(playlist);
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 flex items-center justify-center">
                          {cover ? (
                            <img src={cover} alt={playlist.name} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-zinc-400">
                            {pSongs.length} {pSongs.length === 1 ? 'song' : 'songs'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Normal View: Title of the Library + Playlists Only */
        <div className="animate-fade-in">
          {/* 2. Title of the Library with Playlists Count & Add Playlist Button */}
          <div className="flex items-center justify-between pt-1 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Playlists
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
              </p>
            </div>

            <button
              onClick={() => {
                playUiTap(isPlaying);
                onOpenCreatePlaylistModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Playlist</span>
            </button>
          </div>

          {/* Playlists List */}
          {playlists.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4 rounded-3xl border border-dashed border-white/15 bg-white/[0.02]">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-zinc-400">
                <FolderPlus className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                No Playlists
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-5">
                Create a playlist to organize your local songs.
              </p>
              <button
                onClick={() => {
                  playUiTap(isPlaying);
                  onOpenCreatePlaylistModal();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black font-semibold text-xs active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Playlist</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {playlists.map((playlist) => {
                const playlistSongs = allSongs.filter((s) =>
                  playlist.songIds.includes(s.id)
                );
                const totalDuration = playlistSongs.reduce(
                  (acc, s) => acc + (s.duration || 0),
                  0
                );
                const totalMins = Math.round(totalDuration / 60);
                const coverArt = playlistSongs.find((s) => s.artworkUrl)?.artworkUrl;

                return (
                  <div
                    key={playlist.id}
                    onClick={() => {
                      playUiSwitch(isPlaying);
                      onSelectPlaylist(playlist);
                    }}
                    className="group flex items-center justify-between p-3 rounded-2xl glass-surface hover:bg-white/15 transition-all duration-150 cursor-pointer active:scale-[0.99] border border-white/10"
                  >
                    {/* Left Cover & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/15 shadow-sm flex items-center justify-center">
                        {coverArt ? (
                          <img
                            src={coverArt}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center text-zinc-500">
                            <Music className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-white tracking-tight truncate group-hover:text-white">
                          {playlist.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                          {playlistSongs.length}{' '}
                          {playlistSongs.length === 1 ? 'song' : 'songs'}
                          {totalMins > 0 ? ` · ${totalMins} min` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
