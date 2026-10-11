import React, { useEffect, useState, useRef } from 'react';
import { Song } from '../types/music';

interface GlassBackgroundProps {
  currentSong: Song | null;
}

export const GlassBackground: React.FC<GlassBackgroundProps> = ({ currentSong }) => {
  const currentArt = currentSong?.artworkUrl || null;

  // Dual-slot crossfade state for 60/120fps hardware-accelerated transitions
  const [slotA, setSlotA] = useState<string | null>(currentArt);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  const activeArtRef = useRef<string | null>(currentArt);

  useEffect(() => {
    if (!currentArt || currentArt === activeArtRef.current) return;
    activeArtRef.current = currentArt;

    // Preload image in memory so the transition never hitches
    const img = new Image();
    img.src = currentArt;

    // Immediately flip active slot with snappy, responsive transition
    if (activeSlot === 'A') {
      setSlotB(currentArt);
      // Request animation frame for instantaneous, buttery flip
      requestAnimationFrame(() => {
        setActiveSlot('B');
      });
    } else {
      setSlotA(currentArt);
      requestAnimationFrame(() => {
        setActiveSlot('A');
      });
    }
  }, [currentArt, activeSlot]);

  return (
    <div className="fixed -top-16 -bottom-48 -left-10 -right-10 pointer-events-none overflow-hidden z-0 bg-[#07090e]">
      {/* 
        ========================================================================
        UNDER LAYER: Dynamic Album Cover with High-Performance Crossfade
        - Snappy 350ms spring/ease response
        - No DOM destruction / re-mount lag
        - Purely dynamic to whatever song is playing
        ========================================================================
      */}
      <div className="absolute inset-0 overflow-hidden">
        {/* SLOT A: Image Layer */}
        {slotA && (
          <div
            className={`absolute inset-0 will-change-[opacity,transform] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              activeSlot === 'A'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[1.04]'
            }`}
          >
            {/* Ambient radiant projection of album cover */}
            <div
              className="absolute inset-[-20%] w-[140%] h-[140%] bg-center bg-cover blur-2xl opacity-65"
              style={{
                backgroundImage: `url(${slotA})`,
                filter: 'saturate(190%) brightness(1.15)',
              }}
            />
            {/* Crisp underlying album cover */}
            <div
              className="absolute inset-[-6%] w-[112%] h-[112%] bg-center bg-cover"
              style={{
                backgroundImage: `url(${slotA})`,
                filter: 'saturate(170%) contrast(110%) brightness(1.05)',
              }}
            />
          </div>
        )}

        {/* SLOT B: Image Layer */}
        {slotB && (
          <div
            className={`absolute inset-0 will-change-[opacity,transform] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              activeSlot === 'B'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[1.04]'
            }`}
          >
            {/* Ambient radiant projection of album cover */}
            <div
              className="absolute inset-[-20%] w-[140%] h-[140%] bg-center bg-cover blur-2xl opacity-65"
              style={{
                backgroundImage: `url(${slotB})`,
                filter: 'saturate(190%) brightness(1.15)',
              }}
            />
            {/* Crisp underlying album cover */}
            <div
              className="absolute inset-[-6%] w-[112%] h-[112%] bg-center bg-cover"
              style={{
                backgroundImage: `url(${slotB})`,
                filter: 'saturate(170%) contrast(110%) brightness(1.05)',
              }}
            />
          </div>
        )}

        {/* Fallback if no music has been selected yet */}
        {!slotA && !slotB && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-zinc-950 to-black" />
        )}
      </div>

      {/* 
        ========================================================================
        TOP LAYER: Physical Frosted Glass Blur Sheet (Reference Style)
        ========================================================================
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(28px) saturate(160%) brightness(1.03)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%) brightness(1.03)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Beveled glass edge highlight */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.25)',
          }}
        />

        {/* Ambient specular sheen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 35%, rgba(0, 0, 0, 0.12) 100%)',
          }}
        />

        {/* Tactile frosted glass noise grain */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
          style={{ opacity: 0.07 }}
        >
          <filter id="frosted-glass-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#frosted-glass-grain)" />
        </svg>
      </div>
    </div>
  );
};
