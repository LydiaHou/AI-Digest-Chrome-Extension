// Web Worker for background audio processing
// Handles audio analysis and processing without blocking the main thread

// Audio processing configuration
const AUDIO_CONFIG = {
  sampleRate: 44100,
  bufferSize: 4096,
  channels: 1,
  bitDepth: 16
};

// Initialize worker
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'processAudio':
      processAudio(data);
      break;
    case 'analyzeAudio':
      analyzeAudio(data);
      break;
    case 'convertFormat':
      convertAudioFormat(data);
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

// Process audio data for speech recognition
function processAudio(audioData) {
  try {
    // Convert audio data to proper format for processing
    const processedData = preprocessAudio(audioData);
    
    // Perform noise reduction
    const denoisedData = reduceNoise(processedData);
    
    // Normalize audio levels
    const normalizedData = normalizeAudio(denoisedData);
    
    // Send processed audio back to main thread
    self.postMessage({
      type: 'audioProcessed',
      data: normalizedData,
      success: true
    });
    
  } catch (error) {
    self.postMessage({
      type: 'audioProcessed',
      error: error.message,
      success: false
    });
  }
}

// Analyze audio for key features
function analyzeAudio(audioData) {
  try {
    const analysis = {
      duration: calculateDuration(audioData),
      volume: calculateAverageVolume(audioData),
      frequency: analyzeFrequencySpectrum(audioData),
      silence: detectSilence(audioData),
      speech: detectSpeechSegments(audioData)
    };
    
    self.postMessage({
      type: 'audioAnalyzed',
      data: analysis,
      success: true
    });
    
  } catch (error) {
    self.postMessage({
      type: 'audioAnalyzed',
      error: error.message,
      success: false
    });
  }
}

// Convert audio between different formats
function convertAudioFormat(audioData) {
  try {
    const { fromFormat, toFormat, data } = audioData;
    
    let convertedData;
    
    if (fromFormat === 'webm' && toFormat === 'wav') {
      convertedData = convertWebmToWav(data);
    } else if (fromFormat === 'mp3' && toFormat === 'wav') {
      convertedData = convertMp3ToWav(data);
    } else {
      throw new Error(`Unsupported format conversion: ${fromFormat} to ${toFormat}`);
    }
    
    self.postMessage({
      type: 'formatConverted',
      data: convertedData,
      success: true
    });
    
  } catch (error) {
    self.postMessage({
      type: 'formatConverted',
      error: error.message,
      success: false
    });
  }
}

// Preprocess audio data
function preprocessAudio(audioData) {
  // Convert to Float32Array if needed
  let floatData;
  
  if (audioData instanceof Int16Array) {
    floatData = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      floatData[i] = audioData[i] / 32768.0;
    }
  } else if (audioData instanceof Float32Array) {
    floatData = audioData;
  } else {
    throw new Error('Unsupported audio data format');
  }
  
  return floatData;
}

// Reduce noise in audio
function reduceNoise(audioData) {
  // Simple noise gate implementation
  const threshold = 0.01;
  const denoisedData = new Float32Array(audioData.length);
  
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) > threshold) {
      denoisedData[i] = audioData[i];
    } else {
      denoisedData[i] = 0;
    }
  }
  
  return denoisedData;
}

// Normalize audio levels
function normalizeAudio(audioData) {
  // Find peak amplitude
  let peak = 0;
  for (let i = 0; i < audioData.length; i++) {
    peak = Math.max(peak, Math.abs(audioData[i]));
  }
  
  // Normalize to -1 to 1 range
  if (peak > 0) {
    const normalizedData = new Float32Array(audioData.length);
    const scale = 0.95 / peak; // Leave some headroom
    
    for (let i = 0; i < audioData.length; i++) {
      normalizedData[i] = audioData[i] * scale;
    }
    
    return normalizedData;
  }
  
  return audioData;
}

// Calculate audio duration
function calculateDuration(audioData) {
  return audioData.length / AUDIO_CONFIG.sampleRate;
}

// Calculate average volume
function calculateAverageVolume(audioData) {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += Math.abs(audioData[i]);
  }
  return sum / audioData.length;
}

// Analyze frequency spectrum
function analyzeFrequencySpectrum(audioData) {
  // Simple frequency analysis using FFT
  const fftSize = Math.min(2048, audioData.length);
  const spectrum = new Float32Array(fftSize / 2);
  
  // This is a simplified FFT implementation
  // In production, you'd use a proper FFT library
  for (let k = 0; k < fftSize / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < fftSize; n++) {
      const angle = (2 * Math.PI * k * n) / fftSize;
      real += audioData[n] * Math.cos(angle);
      imag += audioData[n] * Math.sin(angle);
    }
    
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return spectrum;
}

// Detect silence segments
function detectSilence(audioData) {
  const threshold = 0.01;
  const minSilenceDuration = 0.5; // seconds
  const silenceSegments = [];
  
  let silenceStart = null;
  
  for (let i = 0; i < audioData.length; i++) {
    const isSilent = Math.abs(audioData[i]) < threshold;
    
    if (isSilent && silenceStart === null) {
      silenceStart = i / AUDIO_CONFIG.sampleRate;
    } else if (!isSilent && silenceStart !== null) {
      const silenceEnd = i / AUDIO_CONFIG.sampleRate;
      const duration = silenceEnd - silenceStart;
      
      if (duration >= minSilenceDuration) {
        silenceSegments.push({
          start: silenceStart,
          end: silenceEnd,
          duration: duration
        });
      }
      
      silenceStart = null;
    }
  }
  
  return silenceSegments;
}

// Detect speech segments
function detectSpeechSegments(audioData) {
  const speechSegments = [];
  const windowSize = Math.floor(0.1 * AUDIO_CONFIG.sampleRate); // 100ms windows
  const energyThreshold = 0.005;
  
  for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
    let energy = 0;
    
    // Calculate energy in current window
    for (let j = 0; j < windowSize; j++) {
      energy += audioData[i + j] * audioData[i + j];
    }
    
    energy = energy / windowSize;
    
    if (energy > energyThreshold) {
      const startTime = i / AUDIO_CONFIG.sampleRate;
      const endTime = (i + windowSize) / AUDIO_CONFIG.sampleRate;
      
      speechSegments.push({
        start: startTime,
        end: endTime,
        energy: energy
      });
    }
  }
  
  return speechSegments;
}

// Convert WebM to WAV format
function convertWebmToWav(webmData) {
  // This is a simplified conversion
  // In production, you'd use a proper audio codec library
  
  // Create WAV header
  const wavHeader = createWavHeader(webmData.length);
  
  // Combine header with audio data
  const wavData = new Uint8Array(wavHeader.length + webmData.length);
  wavData.set(wavHeader, 0);
  wavData.set(webmData, wavHeader.length);
  
  return wavData;
}

// Convert MP3 to WAV format
function convertMp3ToWav(mp3Data) {
  // This is a simplified conversion
  // In production, you'd use a proper MP3 decoder
  
  // Create WAV header
  const wavHeader = createWavHeader(mp3Data.length);
  
  // Combine header with audio data
  const wavData = new Uint8Array(wavHeader.length + mp3Data.length);
  wavData.set(wavHeader, 0);
  wavData.set(mp3Data, wavHeader.length);
  
  return wavData;
}

// Create WAV file header
function createWavHeader(dataLength) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // File size
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // fmt sub-chunk
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, AUDIO_CONFIG.channels, true); // NumChannels
  view.setUint32(24, AUDIO_CONFIG.sampleRate, true); // SampleRate
  view.setUint32(28, AUDIO_CONFIG.sampleRate * AUDIO_CONFIG.channels * AUDIO_CONFIG.bitDepth / 8, true); // ByteRate
  view.setUint16(32, AUDIO_CONFIG.channels * AUDIO_CONFIG.bitDepth / 8, true); // BlockAlign
  view.setUint16(34, AUDIO_CONFIG.bitDepth, true); // BitsPerSample
  
  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataLength, true); // Subchunk2Size
  
  return new Uint8Array(header);
}

// Error handling
self.onerror = function(error) {
  console.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error.message,
    success: false
  });
};

// Handle unhandled promise rejections
self.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  self.postMessage({
    type: 'error',
    error: event.reason,
    success: false
  });
};
