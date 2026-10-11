import { useState, useEffect, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Song, Playlist, PlaybackMode, ActiveTab } from './types/music';
import { 
  getAllSongsFromDB, 
  saveSongToDB,
  saveMultipleSongsToDB, 
  getAllPlaylistsFromDB,
  savePlaylistToDB,
  deletePlaylistFromDB
} from './lib/db';
import { createDemoSong } from './lib/demoAudio';
import { generateCoverArt, cleanString } from './lib/id3Parser';
import { GlassBackground } from './components/GlassBackground';
import { DynamicIslandHeader } from './components/DynamicIslandHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { LibraryView } from './components/LibraryView';
import { PlaylistDetailView } from './components/PlaylistDetailView';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingSheet } from './components/NowPlayingSheet';
import { AddMusicModal } from './components/AddMusicModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { IOSInstallGuide } from './components/IOSInstallGuide';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [currentQueue, setCurrentQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('standard');
  const [volume, setVolume] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');

  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const currentSong =
    currentSongIndex >= 0 && currentSongIndex < currentQueue.length
      ? currentQueue[currentSongIndex]
      : null;

  // Initialize DB and load playlists & songs
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      const [dbSongs, dbPlaylists] = await Promise.all([
        getAllSongsFromDB(),
        getAllPlaylistsFromDB(),
      ]);

      if (!isMounted) return;

      let finalSongs = dbSongs;
      let finalPlaylists = dbPlaylists;

      if (finalSongs.length === 0 && finalPlaylists.length === 0) {
        // Preload one serene offline demo tone and put it in a default playlist
        try {
          const demoSong = await createDemoSong('Velvet Horizon', 'Glass Echoes', 220);
          const initialPlaylist: Playlist = {
            id: 'pl-favorites',
            name: 'Favorites',
            createdAt: Date.now(),
            songIds: [demoSong.id],
            coverUrl: demoSong.artworkUrl,
          };

          await saveMultipleSongsToDB([demoSong]);
          await savePlaylistToDB(initialPlaylist);

          finalSongs = [demoSong];
          finalPlaylists = [initialPlaylist];
        } catch (e) {
          console.warn('Could not generate initial demo song', e);
        }
      } else if (finalPlaylists.length === 0 && finalSongs.length > 0) {
        // Migrate existing songs into a default playlist
        const defaultPlaylist: Playlist = {
          id: 'pl-imported',
          name: 'My Library',
          createdAt: Date.now(),
          songIds: finalSongs.map((s) => s.id),
        };
        await savePlaylistToDB(defaultPlaylist);
        finalPlaylists = [defaultPlaylist];
      }

      // Sanitize all song metadata (removes null bytes/tofu boxes permanently)
      finalSongs = finalSongs.map((s) => {
        const cleanedTitle = cleanString(s.title);
        const cleanedArtist = cleanString(s.artist);
        const cleanedAlbum = cleanString(s.album);
        if (cleanedTitle !== s.title || cleanedArtist !== s.artist) {
          const updated = { ...s, title: cleanedTitle, artist: cleanedArtist, album: cleanedAlbum };
          saveSongToDB(updated).catch(() => {});
          return updated;
        }
        return s;
      });

      // Ensure demo song has latest glowing sphere artwork
      for (let i = 0; i < finalSongs.length; i++) {
        if (finalSongs[i].id.startsWith('demo-')) {
          finalSongs[i].artworkUrl = generateCoverArt(finalSongs[i].title, finalSongs[i].artist);
          await saveSongToDB(finalSongs[i]);
        }
      }

      setSongs(finalSongs);
      setPlaylists(finalPlaylists);

      if (finalSongs.length > 0) {
        setCurrentQueue(finalSongs);
        setCurrentSongIndex(0);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update MediaSession on track change
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: currentSong.artworkUrl
          ? [
              { src: currentSong.artworkUrl, sizes: '192x192', type: 'image/png' },
              { src: currentSong.artworkUrl, sizes: '512x512', type: 'image/png' },
            ]
          : [],
      });
    } catch (e) {
      console.warn('Error setting mediaSession metadata', e);
    }
  }, [currentSong]);

  // Audio object URL loader
  const loadAndPlayTrack = useCallback((song: Song, autoPlay = true) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // Revoke previous blob url if any
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
    }

    const newUrl = URL.createObjectURL(song.blob);
    currentObjectUrlRef.current = newUrl;
    audio.src = newUrl;
    audio.volume = volume;
    audio.currentTime = 0;
    setCurrentTime(0);

    if (autoPlay) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback prevented or awaiting user interaction', err);
          setIsPlaying(false);
        });
    }
  }, [volume]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      if (currentSong) {
        loadAndPlayTrack(currentSong, true);
      }
      return;
    }

    const audio = audioRef.current;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Could not start playback', e));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentSong, loadAndPlayTrack]);

  // Next Track logic
  const handleNext = useCallback(() => {
    if (currentQueue.length === 0) return;

    let nextIndex = 0;
    if (playbackMode === 'shuffle') {
      if (currentQueue.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * currentQueue.length);
        } while (nextIndex === currentSongIndex);
      }
    } else {
      nextIndex = (currentSongIndex + 1) % currentQueue.length;
    }

    setCurrentSongIndex(nextIndex);
    loadAndPlayTrack(currentQueue[nextIndex], true);
  }, [currentQueue, currentSongIndex, playbackMode, loadAndPlayTrack]);

  // Previous Track logic
  const handlePrevious = useCallback(() => {
    if (currentQueue.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = (currentSongIndex - 1 + currentQueue.length) % currentQueue.length;
    setCurrentSongIndex(prevIndex);
    loadAndPlayTrack(currentQueue[prevIndex], true);
  }, [currentQueue, currentSongIndex, loadAndPlayTrack]);

  // Handle audio events
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (playbackMode === 'repeat-one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (playbackMode === 'repeat-all' || playbackMode === 'shuffle') {
        handleNext();
      } else {
        if (currentSongIndex < currentQueue.length - 1) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Media Session handlers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [playbackMode, handleNext, handlePrevious, togglePlay, currentSongIndex, currentQueue.length]);

  // Seek handler
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // Cycle playback mode
  const handleCyclePlaybackMode = () => {
    const modes: PlaybackMode[] = ['standard', 'shuffle', 'repeat-all', 'repeat-one'];
    const nextIndex = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIndex]);
  };

  // Play a song directly from a playlist or search
  const handlePlaySongInQueue = (song: Song, queue: Song[]) => {
    const index = queue.findIndex((s) => s.id === song.id);
    if (index !== -1) {
      setCurrentQueue(queue);
      setCurrentSongIndex(index);
      loadAndPlayTrack(song, true);
    }
  };

  // Play all songs in current playlist
  const handlePlayAllInPlaylist = (playlistSongs: Song[], shuffle = false) => {
    if (playlistSongs.length === 0) return;

    if (shuffle) {
      const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
      setCurrentQueue(shuffled);
      setCurrentSongIndex(0);
      loadAndPlayTrack(shuffled[0], true);
      setPlaybackMode('shuffle');
    } else {
      setCurrentQueue(playlistSongs);
      setCurrentSongIndex(0);
      loadAndPlayTrack(playlistSongs[0], true);
    }
  };

  // Create a new named playlist
  const handleCreatePlaylist = async (name: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
      songIds: [],
    };

    await savePlaylistToDB(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
  };

  // Delete a playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    await deletePlaylistFromDB(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
  };

  // Add songs to existing playlist
  const handleSongsAddedToPlaylist = async (newSongs: Song[], playlistId: string) => {
    await saveMultipleSongsToDB(newSongs);
    const updatedSongs = [...newSongs, ...songs];
    setSongs(updatedSongs);

    const target = playlists.find((p) => p.id === playlistId);
    if (target) {
      const updatedPlaylist: Playlist = {
        ...target,
        songIds: [...target.songIds, ...newSongs.map((s) => s.id)],
      };
      await savePlaylistToDB(updatedPlaylist);

      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updatedPlaylist : p))
      );

      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(updatedPlaylist);
      }
    }
  };

  // Create new playlist with songs
  const handleCreatePlaylistWithSongs = async (name: string, newSongs: Song[]) => {
    await saveMultipleSongsToDB(newSongs);
    setSongs((prev) => [...newSongs, ...prev]);

    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
      songIds: newSongs.map((s) => s.id),
      coverUrl: newSongs[0]?.artworkUrl,
    };

    await savePlaylistToDB(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
  };

  // Remove song from playlist
  const handleRemoveSongFromPlaylist = async (playlistId: string, songId: string) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (target) {
      const updatedPlaylist: Playlist = {
        ...target,
        songIds: target.songIds.filter((id) => id !== songId),
      };
      await savePlaylistToDB(updatedPlaylist);

      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updatedPlaylist : p))
      );

      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(updatedPlaylist);
      }
    }
  };

  // Songs for currently viewed playlist
  const currentViewPlaylistSongs = selectedPlaylist
    ? songs.filter((s) => selectedPlaylist.songIds.includes(s.id))
    : [];

  // Manual refresh of local database and file metadata
  const handleRefreshDatabase = async () => {
    try {
      const [dbSongs, dbPlaylists] = await Promise.all([
        getAllSongsFromDB(),
        getAllPlaylistsFromDB(),
      ]);

      setSongs(dbSongs);
      setPlaylists(dbPlaylists);

      if (selectedPlaylist) {
        const updated = dbPlaylists.find((p) => p.id === selectedPlaylist.id);
        if (updated) {
          setSelectedPlaylist(updated);
        }
      }
    } catch (e) {
      console.warn('Failed to refresh local database', e);
    }
  };

  // Update album cover artwork and persist in IndexedDB
  const handleUpdateArtwork = async (songId: string, newArtworkUrl: string) => {
    const updatedSongs = songs.map((s) =>
      s.id === songId ? { ...s, artworkUrl: newArtworkUrl } : s
    );
    setSongs(updatedSongs);

    const targetSong = updatedSongs.find((s) => s.id === songId);
    if (targetSong) {
      await saveSongToDB(targetSong);
    }

    setCurrentQueue((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, artworkUrl: newArtworkUrl } : s))
    );
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col text-white select-none">
      {/* Background with blurred album art of currently playing song */}
      <GlassBackground currentSong={currentSong} />

      {/* Dynamic Island Compliant Top Header */}
      <DynamicIslandHeader
        title=""
        rightAction={
          !isInstalled ? (
            isInstallable ? (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-medium text-white transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setIsIOSGuideOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-medium text-white transition-all active:scale-95"
              >
                <span>Add to Home</span>
              </button>
            ) : null
          ) : null
        }
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {selectedPlaylist ? (
          <PlaylistDetailView
            playlist={selectedPlaylist}
            playlistSongs={currentViewPlaylistSongs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onBack={() => setSelectedPlaylist(null)}
            onPlaySong={(song, queue) => handlePlaySongInQueue(song, queue)}
            onPlayAll={(shuffle) => handlePlayAllInPlaylist(currentViewPlaylistSongs, shuffle)}
            onAddSongsClick={() => setIsAddModalOpen(true)}
            onRemoveSongFromPlaylist={(songId) =>
              handleRemoveSongFromPlaylist(selectedPlaylist.id, songId)
            }
            onDeletePlaylist={handleDeletePlaylist}
          />
        ) : (
          <LibraryView
            playlists={playlists}
            allSongs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onRefresh={handleRefreshDatabase}
            onSelectPlaylist={(playlist) => setSelectedPlaylist(playlist)}
            onOpenCreatePlaylistModal={() => setIsCreatePlaylistOpen(true)}
            onPlaySongDirectly={(song) => handlePlaySongInQueue(song, [song])}
          />
        )}
      </main>

      {/* Mini Player when browsing Library or Playlist */}
      {currentSong && !isNowPlayingOpen && (
        <MiniPlayer
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          onNext={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          onExpand={() => setIsNowPlayingOpen(true)}
        />
      )}

      {/* Bottom Menu Bar */}
      <BottomNavBar
        activeTab={activeTab}
        isPlaying={isPlaying}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'library') {
            setIsNowPlayingOpen(false);
          }
        }}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Full Screen Glassmorphic Now Playing Sheet */}
      {isNowPlayingOpen && currentSong && (
        <NowPlayingSheet
          song={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackMode={playbackMode}
          volume={volume}
          onClose={() => setIsNowPlayingOpen(false)}
          onTogglePlay={togglePlay}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSeek={handleSeek}
          onCyclePlaybackMode={handleCyclePlaybackMode}
          onVolumeChange={handleVolumeChange}
          onUpdateArtwork={handleUpdateArtwork}
        />
      )}

      {/* Add Local Music Modal */}
      <AddMusicModal
        isOpen={isAddModalOpen}
        targetPlaylist={selectedPlaylist}
        availablePlaylists={playlists}
        onClose={() => setIsAddModalOpen(false)}
        onSongsAddedToPlaylist={handleSongsAddedToPlaylist}
        onCreatePlaylistWithSongs={handleCreatePlaylistWithSongs}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      {/* iOS PWA Installation Guide */}
      <IOSInstallGuide
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />
    </div>
  );
}
