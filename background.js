// Background service worker for Vibe Video & Podcast Summarizer
// Handles YouTube video detection, audio capture, and API communication

let currentTab = null;
let isProcessing = false;
let audioContext = null;
let mediaRecorder = null;
let audioChunks = [];

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Vibe Summarizer extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    openaiApiKey: '',
    summaryLength: 'medium',
    outputLanguage: 'en',
    darkMode: false,
    autoSummarize: true
  });
  // Clear any badge
  setBadge('');
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'detectVideo':
      handleVideoDetection(request.data, sender.tab.id);
      break;
    case 'startAudioCapture':
      startAudioCapture(sender.tab && sender.tab.id);
      break;
    case 'stopAudioCapture':
      stopAudioCapture();
      break;
    case 'generateSummary':
      generateSummary(request.audioData, request.metadata);
      break;
    case 'getSettings':
      getSettings(sendResponse);
      return true; // Keep message channel open for async response
    case 'updateSettings':
      updateSettings(request.settings, sendResponse);
      return true;
  }
});

// Handle video detection from content script
async function handleVideoDetection(videoData, tabId) {
  currentTab = tabId;
  
  // Check if auto-summarize is enabled
  const settings = await chrome.storage.sync.get(['autoSummarize']);
  const auto = settings.autoSummarize !== false; // default to true when undefined
  
  if (auto) {
    console.log('Video detected, starting auto-summarization:', videoData.title);
    
    // Notify popup about detected video
    chrome.runtime.sendMessage({
      action: 'videoDetected',
      data: videoData
    });
    
    // Start audio capture after a short delay
    setTimeout(() => {
      startAudioCapture(tabId);
    }, 2000);
  }
}

// Start audio capture from the current tab
async function startAudioCapture(tabId) {
  if (isProcessing) return;
  
  try {
    // If triggered from popup, sender.tab may be undefined. Resolve active tab.
    if (!tabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = activeTab && activeTab.id;
    }
    if (!tabId) {
      throw new Error('No active tab to capture');
    }
    // Request tab permissions
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        // This will be executed in the content script context
        return true;
      }
    });
    
    // Send message to content script to start audio capture
    chrome.tabs.sendMessage(tabId, {
      action: 'startAudioCapture'
    });
    
    isProcessing = true;
    console.log('Audio capture started');
    setBadge('•', '#dc3545'); // red dot while processing
    
  } catch (error) {
    console.error('Failed to start audio capture:', error);
  }
}

// Stop audio capture
function stopAudioCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  if (audioContext) {
    audioContext.close();
  }
  
  isProcessing = false;
  audioChunks = [];
  console.log('Audio capture stopped');
  // Keep badge until summary status updates
}

// Generate summary using OpenAI API
async function generateSummary(audioData, metadata) {
  try {
    const settings = await chrome.storage.sync.get(['openaiApiKey', 'summaryLength', 'outputLanguage']);
    
    if (!settings.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // First, convert audio to text using Web Speech API or OpenAI Whisper
    let transcript = null;
    if (audioData && (audioData.byteLength || 0) > 0) {
      transcript = await convertAudioToText(audioData);
    }
    
    // If no transcript, fall back to page text summary
    const pageText = (metadata && metadata.pageText) || '';
    const havePageText = pageText && pageText.length > 100;
    if (!transcript && !havePageText) {
      throw new Error('No audio transcript or page text available');
    }
    
    // Generate summary using OpenAI
    const summary = await callOpenAI(transcript || pageText, metadata, settings);
    
    // Store summary in local storage
    const summaryData = {
      id: Date.now(),
      url: metadata.url,
      title: metadata.title,
      transcript: transcript,
      summary: summary,
      timestamp: new Date().toISOString(),
      duration: metadata.duration
    };
    
    await chrome.storage.local.set({
      [`summary_${summaryData.id}`]: summaryData
    });
    
    // Notify popup about completed summary
    chrome.runtime.sendMessage({
      action: 'summaryComplete',
      data: summaryData
    });
    
    console.log('Summary generated successfully');
    setBadge('•', '#28a745'); // green dot on completion
    
  } catch (error) {
    console.error('Failed to generate summary:', error);
    
    // Notify popup about error
    chrome.runtime.sendMessage({
      action: 'summaryError',
      error: error.message
    });
    setBadge('!','#dc3545');
  }
}

// Convert audio to text using OpenAI Whisper API
async function convertAudioToText(audioData) {
  const settings = await chrome.storage.sync.get(['openaiApiKey']);
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.text;
    
  } catch (error) {
    console.error('Whisper API failed, falling back to Web Speech API:', error);
    
    // Fallback to Web Speech API (less accurate but no API key required)
    return await convertAudioToTextFallback(audioData);
  }
}

// Fallback audio-to-text conversion using Web Speech API
async function convertAudioToTextFallback(audioData) {
  return new Promise((resolve) => {
    // This is a simplified fallback - in practice, you'd need to implement
    // a more sophisticated audio processing pipeline
    console.log('Using Web Speech API fallback');
    resolve('Audio transcript placeholder - Web Speech API implementation needed');
  });
}

// Call OpenAI API to generate summary
async function callOpenAI(content, metadata, settings) {
  const refinedContent = content.length > 15000 ? content.slice(0, 15000) : content;
  const mode = settings.summaryMode || 'executive';
  const modeInstructions = {
    executive: 'Write a concise executive summary with key points and conclusions.',
    takeaways: 'Write bullet-point key takeaways with short explanations.',
    blog: 'Draft a blog-post style summary in an engaging, clear tone.'
  }[mode] || '';

  const prompt =
    'Please provide a summary of the following ' + (metadata.type || 'content') + '.\n\n' +
    'Title: ' + (metadata.title || '') + '\n' +
    'Duration: ' + (metadata.duration || '') + '\n' +
    'Content: ' + refinedContent + '\n\n' +
    'Please create a ' + (settings.summaryLength || 'medium') + ' summary in ' + (settings.outputLanguage || 'en') + ' language. Include:\n' +
    '1. Main topics discussed\n' +
    '2. Key points and insights\n' +
    '3. Important timestamps if available\n' +
    '4. Overall conclusion\n' +
    '5. Extract notable quotes and any companies mentioned\n\n' +
    'Style: ' + (modeInstructions || '') + '\n\n' +
    'Format the response in a clear, structured manner.';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of audio and video content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  let result = await response.json();
  let output = result.choices[0].message.content;

  // Iterative refinement loop (0-3)
  const iterations = Math.max(0, Math.min(3, settings.iterations || 0));
  for (let i = 0; i < iterations; i++) {
    const critiquePrompt = `Grade the following summary for clarity, coherence, persuasiveness, and completeness like an AP English teacher. Then suggest concrete improvements and produce a refined summary.\n\nSummary:\n${output}`;
    const refineResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a rigorous writing teacher and editor.' },
          { role: 'user', content: critiquePrompt }
        ],
        max_tokens: 700,
        temperature: 0.5
      })
    });
    if (refineResp.ok) {
      const refineJson = await refineResp.json();
      output = refineJson.choices[0].message.content;
    } else {
      break;
    }
  }

  return output;
}

// Get user settings
async function getSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'openaiApiKey',
      'summaryLength',
      'outputLanguage',
      'darkMode',
      'autoSummarize'
    ]);
    sendResponse(settings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    sendResponse({ error: error.message });
  }
}

// Update user settings
async function updateSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.sync.set(newSettings);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    sendResponse({ error: error.message });
  }
}

// Handle tab updates to detect when user navigates to video/podcast pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a supported platform
    if (tab.url.includes('youtube.com') || 
        tab.url.includes('spotify.com') || 
        tab.url.includes('apple.com')) {
      
      // Inject content script to detect video/podcast
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          // This will trigger the content script's video detection
          return true;
        }
      });
    }
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTab = activeInfo.tabId;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup when extension icon is clicked
  chrome.action.openPopup();
});

// Helper to set icon badge
function setBadge(text, color) {
  try {
    chrome.action.setBadgeText({ text: text || '' });
    if (color) {
      // Use RGBA array for MV3 reliability
      const colors = {
        red: [220,53,69,255],
        green: [40,167,69,255]
      };
      const mapped = color === '#dc3545' ? colors.red : color === '#28a745' ? colors.green : colors.red;
      chrome.action.setBadgeBackgroundColor({ color: mapped });
      chrome.action.setBadgeTextColor && chrome.action.setBadgeTextColor({ color: [255,255,255,255] });
    }
  } catch (e) {
    console.warn('Failed to set badge:', e);
  }
}
