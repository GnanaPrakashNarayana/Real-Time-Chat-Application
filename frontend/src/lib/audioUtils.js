// frontend/src/lib/audioUtils.js

/**
 * Start recording audio using the MediaRecorder API
 * @returns {Promise<MediaRecorder>} - MediaRecorder instance
 */
export const startRecording = async () => {
  // Request audio permissions
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Initialize media recorder
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];
  
  // Set up event listeners
  mediaRecorder.addEventListener('dataavailable', event => {
    audioChunks.push(event.data);
  });
  
  // Store chunks in the recorder object for later access
  mediaRecorder.audioChunks = audioChunks;
  
  // Start recording
  mediaRecorder.start();
  return mediaRecorder;
};

/**
 * Stop recording and get the audio data
 * @param {MediaRecorder} mediaRecorder - The active MediaRecorder
 * @returns {Promise<{blob: Blob, url: string, duration: number}>} - Audio data
 */
export const stopRecording = (mediaRecorder) => {
  return new Promise(resolve => {
    mediaRecorder.addEventListener('stop', () => {
      // Create blob from chunks
      const audioBlob = new Blob(mediaRecorder.audioChunks, { type: 'audio/webm' });
      
      // Create URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Convert blob to base64 for sending to server
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64data = reader.result;
        
        // Stop all tracks to release microphone
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        resolve({
          blob: audioBlob,
          url: audioUrl, 
          data: base64data,
          duration: mediaRecorder.duration || 0
        });
      };
    });
    
    // Store duration
    mediaRecorder.duration = mediaRecorder.duration || 0;
    
    // Stop recording
    mediaRecorder.stop();
  });
};

/**
 * Format seconds into MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted time string
 */
export const formatAudioDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};