import React from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl glass-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-2xl border border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Install on iPhone
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
          Install as a PWA to run in full screen without the Safari URL bar and enjoy full Dynamic Island immersion:
        </p>

        <div className="space-y-3.5 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">1. Tap Safari Share</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tap the square Share icon at the bottom of Safari
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">2. Add to Home Screen</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Scroll down the action sheet and select "Add to Home Screen"
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-tight shadow-md active:scale-98 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
