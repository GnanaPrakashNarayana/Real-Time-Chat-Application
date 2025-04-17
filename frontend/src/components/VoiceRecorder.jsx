// frontend/src/components/VoiceRecorder.jsx
import { useState, useEffect, useRef } from 'react';
import { startRecording, stopRecording, formatAudioDuration } from '../lib/audioUtils';
import { Mic, Send, X, Pause, Play, Trash } from 'lucide-react';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Browser compatibility check
  const isBrowserSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  // Check for compatibility before rendering the main component
  if (!isBrowserSupported()) {
    return (
      <div className="p-3 bg-base-200 rounded-lg">
        <p className="text-sm text-error">
          Voice recording is not supported in your browser.
        </p>
      </div>
    );
  }
  
  // Start recording
  const handleStartRecording = async () => {
    try {
      recorderRef.current = await startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (recorderRef.current) {
            recorderRef.current.duration = newTime;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  // Stop recording
  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    
    clearInterval(timerRef.current);
    setIsRecording(false);
    
    try {
      const data = await stopRecording(recorderRef.current);
      setAudioData(data);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  // Toggle playback of recorded audio
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Send the voice message
  const handleSend = () => {
    if (!audioData) return;
    
    onSend({
      data: audioData.data,
      duration: recordingTime
    });
    
    // Reset state
    setAudioData(null);
    setRecordingTime(0);
  };
  
  // Cancel recording
  const handleCancel = () => {
    // If recording, stop
    if (isRecording && recorderRef.current) {
      recorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
    }
    
    // If we have audio data, revoke the URL
    if (audioData && audioData.url) {
      URL.revokeObjectURL(audioData.url);
    }
    
    // Reset state
    setIsRecording(false);
    setAudioData(null);
    setRecordingTime(0);
    onCancel();
  };
  
  // Handle audio playback completion
  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleEnded = () => setIsPlaying(false);
    
    if (audioElement) {
      audioElement.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleEnded);
      }
      
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      if (audioData && audioData.url) {
        URL.revokeObjectURL(audioData.url);
      }
    };
  }, [audioData]);
  
  return (
    <div className="p-3 bg-base-200 rounded-lg voice-recorder">
      {audioData ? (
        // Playback UI - after recording
        <div className="flex items-center gap-2">
          <audio ref={audioRef} src={audioData.url} />
          
          <button 
            onClick={togglePlayback}
            className="btn btn-sm btn-circle"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          
          <div className="flex-1">
            <div className="w-full bg-base-300 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full progress-bar" style={{ width: '0%' }}></div>
            </div>
            <span className="text-xs text-base-content/60 mt-1 inline-block">
              {formatAudioDuration(recordingTime)}
            </span>
          </div>
          
          <button 
            onClick={handleCancel}
            className="btn btn-sm btn-circle btn-ghost text-error"
            title="Delete"
            aria-label="Delete recording"
          >
            <Trash className="size-4" />
          </button>
          
          <button 
            onClick={handleSend}
            className="btn btn-sm btn-circle btn-primary"
            title="Send"
            aria-label="Send voice message"
          >
            <Send className="size-4" />
          </button>
        </div>
      ) : (
        // Recording UI
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              <div className="flex-1 flex items-center gap-2">
                <span className="recording-indicator text-error">●</span>
                <span className="text-sm">Recording... {formatAudioDuration(recordingTime)}</span>
              </div>
              
              <button 
                onClick={handleStopRecording}
                className="btn btn-sm btn-circle"
                title="Stop recording"
                aria-label="Stop recording"
              >
                <span className="size-3 bg-error rounded-sm"></span>
              </button>
              
              <button 
                onClick={handleCancel}
                className="btn btn-sm btn-circle btn-ghost"
                title="Cancel"
                aria-label="Cancel recording"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <span className="text-sm">Record a voice message</span>
              </div>
              
              <button 
                onClick={handleStartRecording}
                className="btn btn-sm btn-circle"
                title="Start recording"
                aria-label="Start recording"
              >
                <Mic className="size-4" />
              </button>
              
              <button 
                onClick={handleCancel}
                className="btn btn-sm btn-circle btn-ghost"
                title="Cancel"
                aria-label="Cancel"
              >
                <X className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;