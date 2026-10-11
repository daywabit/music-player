import React, { useState, useRef } from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX,
  ImagePlus,
} from 'lucide-react';
import { Song, PlaybackMode } from '../types/music';

interface NowPlayingSheetProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackMode: PlaybackMode;
  volume: number;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onCyclePlaybackMode: () => void;
  onVolumeChange: (vol: number) => void;
  onUpdateArtwork?: (songId: string, newArtworkUrl: string) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const NowPlayingSheet: React.FC<NowPlayingSheetProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  playbackMode,
  volume,
  onClose,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onCyclePlaybackMode,
  onVolumeChange,
  onUpdateArtwork,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateArtwork) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        onUpdateArtwork(song.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const remainingTime = duration > 0 ? duration - displayTime : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(parseFloat(e.target.value));
  };

  const handleSliderTouchStart = () => {
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleSliderTouchEnd = () => {
    setIsScrubbing(false);
    onSeek(scrubValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black/20 backdrop-blur-2xl transition-all duration-300">
      {/* Top Bar with Dynamic Island respect and dismiss handle */}
      <div className="pt-[max(env(safe-area-inset-top),52px)] px-6 pb-2 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white active:scale-90 transition-all bg-white/5 border border-white/10"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Grab handle bar */}
        <div className="w-10 h-1 rounded-full bg-white/30 self-center" />

        <div className="w-10" />
      </div>

      {/* Center Artwork & Track Details */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-md mx-auto w-full">
        {/* Album Artwork with smooth breathing scale & custom photo picker */}
        <div className="w-full aspect-square max-w-[320px] max-h-[320px] mb-8 relative flex items-center justify-center group">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />
          <div
            onClick={() => imageInputRef.current?.click()}
            title="Tap to change album cover photo"
            className={`w-full h-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ease-out border border-white/20 cursor-pointer relative ${
              isPlaying
                ? 'scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/20'
                : 'scale-90 opacity-90 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            {song.artworkUrl ? (
              <img
                src={song.artworkUrl}
                alt={song.title}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-5xl">
                ♪
              </div>
            )}

            {/* Subtle tap-to-change overlay on hover/touch */}
            <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/70 hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
              <ImagePlus className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Track Title and Artist */}
        <div className="w-full text-left mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-1">
            {song.title}
          </h2>
          <p className="text-base text-zinc-300 font-medium tracking-tight mt-1 line-clamp-1">
            {song.artist}
          </p>
        </div>

        {/* Scrubber Timeline */}
        <div className="w-full mb-6">
          <div className="relative py-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={displayTime}
              onChange={handleSliderChange}
              onTouchStart={handleSliderTouchStart}
              onTouchEnd={handleSliderTouchEnd}
              onMouseDown={handleSliderTouchStart}
              onMouseUp={handleSliderTouchEnd}
              className="ios-slider w-full"
              aria-label="Seek track"
            />
          </div>

          <div className="flex justify-between items-center text-xs font-medium text-zinc-400 mt-1 select-none">
            <span>{formatTime(displayTime)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="w-full flex items-center justify-between px-2 mb-6">
          {/* Shuffle Toggle */}
          <button
            onClick={onCyclePlaybackMode}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              playbackMode === 'shuffle'
                ? 'text-white bg-white/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Shuffle"
          >
            <Shuffle className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevious}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/5"
            aria-label="Previous Track"
          >
            <SkipBack className="w-7 h-7 fill-white stroke-none" />
          </button>

          {/* Big Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="w-18 h-18 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-all duration-200"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-black stroke-none" />
            ) : (
              <Play className="w-8 h-8 fill-black stroke-none ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/5"
            aria-label="Next Track"
          >
            <SkipForward className="w-7 h-7 fill-white stroke-none" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={onCyclePlaybackMode}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              playbackMode === 'repeat-all' || playbackMode === 'repeat-one'
                ? 'text-white bg-white/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Repeat Mode"
          >
            {playbackMode === 'repeat-one' ? (
              <Repeat1 className="w-5 h-5 stroke-[2]" />
            ) : (
              <Repeat className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Volume Slider Bar */}
        <div className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
            className="text-zinc-400 hover:text-white"
            aria-label="Mute or Unmute"
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="ios-slider flex-1"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Bottom Safe Area Spacer */}
      <div className="pb-[max(env(safe-area-inset-bottom),24px)]" />
    </div>
  );
};
