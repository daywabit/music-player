import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl glass-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 shadow-2xl border border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <FolderPlus className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              New Playlist
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              autoFocus
              placeholder="Playlist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 focus:bg-white/15 text-white placeholder-zinc-500 text-sm rounded-xl px-4 py-3 border border-white/15 focus:outline-none focus:border-white/30 transition-colors"
              maxLength={40}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
