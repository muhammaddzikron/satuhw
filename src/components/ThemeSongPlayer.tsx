import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Music, Download, ExternalLink, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { formatAudioUrl } from '../utils/audioUtils';

interface ThemeSongPlayerProps {
  audioUrl?: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

export const ThemeSongPlayer: React.FC<ThemeSongPlayerProps> = ({
  audioUrl,
  title = 'Mars / Themesong Kegiatan',
  className = '',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formattedUrl = useMemo(() => formatAudioUrl(audioUrl), [audioUrl]);

  useEffect(() => {
    setIsPlaying(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  if (!audioUrl || !formattedUrl) {
    return null;
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Audio play failed:', err);
        setHasError(true);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async () => {
    if (!formattedUrl) return;
    try {
      const fileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
      const res = await fetch(formattedUrl);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(formattedUrl, '_blank');
    }
  };

  if (compact) {
    return (
      <div className={`bg-slate-900/90 text-white p-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-2 ${className}`}>
        <audio
          ref={audioRef}
          src={formattedUrl}
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        />
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-emerald-300 truncate">{title}</p>
            {duration > 0 && (
              <p className="text-[9px] text-gray-400">{formatTime(currentTime)} / {formatTime(duration)}</p>
            )}
          </div>
        </div>
        {hasError && (
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-amber-300 underline flex items-center gap-1 shrink-0"
          >
            <ExternalLink size={12} /> Buka
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-4 rounded-2xl text-white shadow-xl border border-emerald-700/40 ${className}`}>
      <audio
        ref={audioRef}
        src={formattedUrl}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 border border-emerald-500/30">
            <Music size={20} className={isPlaying ? 'animate-bounce text-emerald-400' : 'animate-pulse'} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
              Themesong Official Kegiatan
            </span>
            <h5 className="text-xs font-black font-display text-white truncate">
              {title}
            </h5>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0 active:scale-95"
          title="Download MP3 Themesong"
        >
          <Download size={13} />
          <span>Download</span>
        </button>
      </div>

      {hasError ? (
        <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-200">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium leading-tight truncate">
              Format audio tidak dapat diputar langsung di browser.
            </span>
          </div>
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-[10px] rounded-lg shrink-0 flex items-center gap-1"
          >
            <ExternalLink size={12} /> Buka Tab Baru
          </a>
        </div>
      ) : (
        <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <div className="flex-1 min-w-0 space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-emerald-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
