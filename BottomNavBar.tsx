import React from 'react';
import { Library, Plus } from 'lucide-react';
import { ActiveTab } from '../types/music';
import { playUiTap, playUiSwitch } from '../lib/uiSounds';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  isPlaying: boolean;
  onTabChange: (tab: ActiveTab) => void;
  onAddClick: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  isPlaying,
  onTabChange,
  onAddClick,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav pb-[max(env(safe-area-inset-bottom),20px)] pt-1.5 px-6">
      <div className="max-w-md mx-auto flex items-center justify-around h-11">
        {/* Tab 1: Library */}
        <button
          onClick={() => {
            playUiSwitch(isPlaying);
            onTabChange('library');
          }}
          className={`flex flex-col items-center justify-center w-16 py-0.5 transition-all duration-200 active:scale-95 ${
            activeTab === 'library'
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Library"
        >
          <Library className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Library
          </span>
        </button>

        {/* Tab 2: + Add Music */}
        <button
          onClick={() => {
            playUiTap(isPlaying);
            onAddClick();
          }}
          className="flex flex-col items-center justify-center w-16 py-0.5 text-zinc-400 hover:text-white transition-all duration-200 active:scale-95"
          aria-label="Add Music"
        >
          <div className="w-6.5 h-6.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Add
          </span>
        </button>
      </div>
    </nav>
  );
};
