
import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`relative group overflow-hidden rounded-[2rem] bg-black shadow-2xl ${className}`}>
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover"
        onClick={togglePlay}
      />
      
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <button 
          onClick={togglePlay}
          className="p-6 bg-hav-gold/90 text-hav-forest rounded-full shadow-2xl hover:scale-110 transition-transform pointer-events-auto"
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={toggleMute}
          className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors">
          <Maximize size={20} />
        </button>
      </div>

      {!isPlaying && (
        <div className="absolute top-6 left-6 bg-hav-gold/90 text-hav-forest px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
          Watch in Action
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
