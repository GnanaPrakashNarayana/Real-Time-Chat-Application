// frontend/src/components/AudioPlayer.jsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatAudioDuration } from '../lib/audioUtils';

const AudioPlayer = ({ audioUrl, duration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const audioRef = useRef(null);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  // Update progress as audio plays
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
      setProgress((audioElement.currentTime / audioElement.duration) * 100);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // Add event listeners
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    
    // Set initial duration if needed
    if (duration && !audioElement.duration) {
      audioElement.onloadedmetadata = () => {
        if (!audioElement.duration && duration) {
          // Use provided duration if actual duration not available
          const durationElement = document.querySelector(`#duration-${audioUrl.split('/').pop()}`);
          if (durationElement) {
            durationElement.textContent = formatAudioDuration(duration);
          }
        }
      };
    }
    
    return () => {
      // Clean up event listeners
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, duration]);
  
  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[220px]">
      <button
        onClick={togglePlayback}
        className="btn btn-circle btn-sm"
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      
      <div className="flex-1">
        <div className="w-full bg-base-300 rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-base-content/60">
          <span>{formatAudioDuration(currentTime)}</span>
          <span id={`duration-${audioUrl.split('/').pop()}`}>
            {formatAudioDuration(audioRef.current?.duration || duration)}
          </span>
        </div>
      </div>
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;