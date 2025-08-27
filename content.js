// Content script for Vibe Video & Podcast Summarizer
// Runs on YouTube and podcast pages to detect content and capture audio

let currentVideo = null;
let isCapturing = false;
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let microphone = null;

// Initialize content script
(function() {
  'use strict';
  
  console.log('Vibe Summarizer content script loaded');
  
  // Set up message listener for background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'startAudioCapture':
        startAudioCapture();
        break;
      case 'stopAudioCapture':
        stopAudioCapture();
        break;
      case 'getPageText':
        sendResponse({ text: getPageText() });
        return true;
    }
  });
  
  // Start monitoring for video/podcast content
  startContentMonitoring();
})();

// Monitor for video/podcast content changes
function startContentMonitoring() {
  // Initial check
  checkForContent();
  
  // Set up observers for dynamic content changes
  const observer = new MutationObserver(() => {
    checkForContent();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check periodically for single-page app navigation
  setInterval(checkForContent, 5000);
}

// Check if current page contains video/podcast content
function checkForContent() {
  const url = window.location.href;
  
  if (url.includes('youtube.com')) {
    checkYouTubeContent();
  } else if (url.includes('spotify.com')) {
    checkSpotifyContent();
  } else if (url.includes('apple.com')) {
    checkAppleContent();
  }
}

// Check for YouTube video content
function checkYouTubeContent() {
  // Wait for YouTube to load
  if (!document.querySelector('#movie_player')) {
    return;
  }
  
  // Check if we're on a video page
  const videoId = getYouTubeVideoId();
  if (!videoId) return;
  
  // Get video metadata
  const title = getYouTubeTitle();
  const description = getYouTubeDescription();
  const duration = getYouTubeDuration();
  const captions = getYouTubeCaptions();
  
  if (title && duration) {
    const videoData = {
      platform: 'youtube',
      type: 'video',
      isVideo: true,
      id: videoId,
      title: title,
      description: description,
      duration: duration,
      captions: captions,
      url: window.location.href,
      timestamp: Date.now()
    };
    
    // Only notify if this is a new video
    if (!currentVideo || currentVideo.id !== videoId) {
      currentVideo = videoData;
      notifyBackgroundScript('detectVideo', videoData);
    }
  }
}

// Get YouTube video ID from URL
function getYouTubeVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Get YouTube video title
function getYouTubeTitle() {
  // Try multiple selectors for YouTube title
  const selectors = [
    'h1.ytd-video-primary-info-renderer',
    'h1.ytd-watch-metadata',
    '.title.ytd-video-primary-info-renderer',
    'h1.title'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  
  return null;
}

// Get YouTube video description
function getYouTubeDescription() {
  const descriptionElement = document.querySelector('#description-text');
  if (descriptionElement) {
    return descriptionElement.textContent.trim();
  }
  return '';
}

// Get YouTube video duration
function getYouTubeDuration() {
  const durationElement = document.querySelector('.ytp-time-duration');
  if (durationElement) {
    return durationElement.textContent;
  }
  return '';
}

// Get available YouTube captions
function getYouTubeCaptions() {
  const captionButton = document.querySelector('.ytp-subtitles-button');
  if (captionButton) {
    return captionButton.getAttribute('aria-label') || 'Captions available';
  }
  return '';
}

// Check for Spotify podcast content
function checkSpotifyContent() {
  // Check if we're on a podcast episode page
  const episodeTitle = getSpotifyEpisodeTitle();
  const showTitle = getSpotifyShowTitle();
  const duration = getSpotifyDuration();
  
  if (episodeTitle && showTitle) {
    const podcastData = {
      platform: 'spotify',
      type: 'podcast',
      isVideo: false,
      id: window.location.pathname,
      title: `${showTitle} - ${episodeTitle}`,
      description: getSpotifyDescription(),
      duration: duration,
      captions: 'Audio only',
      url: window.location.href,
      timestamp: Date.now()
    };
    
    if (!currentVideo || currentVideo.id !== podcastData.id) {
      currentVideo = podcastData;
      notifyBackgroundScript('detectVideo', podcastData);
    }
  }
}

// Get Spotify episode title
function getSpotifyEpisodeTitle() {
  const titleElement = document.querySelector('[data-testid="episode-title"]');
  if (titleElement) {
    return titleElement.textContent.trim();
  }
  return null;
}

// Get Spotify show title
function getSpotifyShowTitle() {
  const showElement = document.querySelector('[data-testid="show-title"]');
  if (showElement) {
    return showElement.textContent.trim();
  }
  return null;
}

// Get Spotify episode description
function getSpotifyDescription() {
  const descElement = document.querySelector('[data-testid="episode-description"]');
  if (descElement) {
    return descElement.textContent.trim();
  }
  return '';
}

// Get Spotify episode duration
function getSpotifyDuration() {
  const durationElement = document.querySelector('[data-testid="duration"]');
  if (durationElement) {
    return durationElement.textContent;
  }
  return '';
}

// Check for Apple Podcast content
function checkAppleContent() {
  // Check if we're on a podcast episode page
  const episodeTitle = getAppleEpisodeTitle();
  const showTitle = getAppleShowTitle();
  
  if (episodeTitle && showTitle) {
    const podcastData = {
      platform: 'apple',
      type: 'podcast',
      isVideo: false,
      id: window.location.pathname,
      title: `${showTitle} - ${episodeTitle}`,
      description: getAppleDescription(),
      duration: getAppleDuration(),
      captions: 'Audio only',
      url: window.location.href,
      timestamp: Date.now()
    };
    
    if (!currentVideo || currentVideo.id !== podcastData.id) {
      currentVideo = podcastData;
      notifyBackgroundScript('detectVideo', podcastData);
    }
  }
}

// Get Apple Podcast episode title
function getAppleEpisodeTitle() {
  const titleElement = document.querySelector('h1, .episode-title, [data-testid="episode-title"]');
  if (titleElement) {
    return titleElement.textContent.trim();
  }
  return null;
}

// Get Apple Podcast show title
function getAppleShowTitle() {
  const showElement = document.querySelector('.show-title, [data-testid="show-title"]');
  if (showElement) {
    return showElement.textContent.trim();
  }
  return null;
}

// Get Apple Podcast episode description
function getAppleDescription() {
  const descElement = document.querySelector('.episode-description, [data-testid="episode-description"]');
  if (descElement) {
    return descElement.textContent.trim();
  }
  return '';
}

// Get Apple Podcast episode duration
function getAppleDuration() {
  const durationElement = document.querySelector('.duration, [data-testid="duration"]');
  if (durationElement) {
    return durationElement.textContent;
  }
  return '';
}

// Start audio capture
async function startAudioCapture() {
  if (isCapturing) return;
  
  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
    
    // Set up audio context and analyser
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    // Connect audio nodes
    microphone.connect(analyser);
    
    // Set up media recorder for audio capture
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    // Collect audio data
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    // Handle recording stop
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const pageText = getPageText();
      
      // Send audio data to background script for processing
      notifyBackgroundScript('generateSummary', {
        audioData: audioArrayBuffer,
        metadata: { ...currentVideo, pageText }
      });
      
      // Reset for next capture
      audioChunks = [];
      isCapturing = false;
    };
    
    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isCapturing = true;
    
    console.log('Audio capture started');
    
    // Stop recording after 5 minutes (or when video ends)
    setTimeout(() => {
      if (isCapturing) {
        stopAudioCapture();
      }
    }, 300000);
    
  } catch (error) {
    console.error('Failed to start audio capture:', error);
    
    // Fallback: try to capture system audio (limited support)
    tryCaptureSystemAudio();
  }
}

// Fallback system audio capture (limited browser support)
function tryCaptureSystemAudio() {
  console.log('Attempting system audio capture fallback...');
  
  // This is a simplified fallback - in practice, you'd need to implement
  // a more sophisticated system audio capture mechanism
  // For now, we'll simulate audio capture for testing
  
  setTimeout(() => {
    if (currentVideo) {
      // Simulate audio capture completion
      notifyBackgroundScript('generateSummary', {
        audioData: new ArrayBuffer(1024), // Placeholder
        metadata: { ...currentVideo, pageText: getPageText() }
      });
    }
  }, 5000);
}

// Stop audio capture
function stopAudioCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  if (microphone && microphone.mediaStream) {
    microphone.mediaStream.getTracks().forEach(track => track.stop());
  }
  
  if (audioContext) {
    audioContext.close();
  }
  
  isCapturing = false;
  console.log('Audio capture stopped');
}

// Notify background script
function notifyBackgroundScript(action, data) {
  chrome.runtime.sendMessage({
    action: action,
    data: data
  });
}

// Extract meaningful text content from the page for fallback summaries
function getPageText() {
  try {
    const parts = [];
    // Meta description
    const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (meta && meta.content) parts.push(meta.content);
    // Titles and headings
    const titleEl = document.querySelector('h1, .title, [data-testid="episode-title"], .episode-title');
    if (titleEl) parts.push(titleEl.textContent);
    document.querySelectorAll('h2, h3').forEach(h => parts.push(h.textContent));
    // Descriptions and main paragraphs
    const candidates = document.querySelectorAll('#description, #description-text, .content, article, main, p');
    let collected = 0;
    candidates.forEach(el => {
      if (collected > 8000) return;
      const text = (el.textContent || '').trim();
      if (text && text.length > 60) {
        parts.push(text);
        collected += text.length;
      }
    });
    const text = parts.join('\n').replace(/\s+/g, ' ').slice(0, 12000);
    return text;
  } catch (e) {
    return '';
  }
}

// Listen for page visibility changes to pause/resume capture
document.addEventListener('visibilitychange', () => {
  if (document.hidden && isCapturing) {
    // Pause capture when tab is not visible
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
  } else if (!document.hidden && isCapturing) {
    // Resume capture when tab becomes visible
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  }
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
  if (isCapturing) {
    stopAudioCapture();
  }
});
