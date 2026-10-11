import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Song } from '../types/music';

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onExpand,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onExpand}
      className="fixed left-3 right-3 bottom-[calc(env(safe-area-inset-bottom,6px)+50px)] z-25 max-w-md mx-auto cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl glass-surface px-3 py-2.5 shadow-xl transition-all duration-200 active:scale-[0.99] border border-white/15">
        {/* Progress line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div
            className="h-full bg-white transition-all duration-200 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10 shadow-sm">
            {song.artworkUrl ? (
              <img
                src={song.artworkUrl}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                ♪
              </div>
            )}
          </div>

          {/* Song info */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-sm font-semibold text-white tracking-tight truncate">
              {song.title}
            </h4>
            <p className="text-xs text-zinc-300 font-medium truncate">
              {song.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white stroke-none" />
              ) : (
                <Play className="w-5 h-5 fill-white stroke-none ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-current stroke-none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
