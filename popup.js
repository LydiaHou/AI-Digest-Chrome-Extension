// Vibe Summarizer Popup JavaScript
// Handles user interface interactions and communication with background script

class VibeSummarizerPopup {
  constructor() {
    this.currentVideo = null;
    this.isProcessing = false;
    this.settings = {};
    
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.checkCurrentTab();
  }

  // Initialize DOM elements
  initializeElements() {
    // Main sections
    this.statusSection = document.getElementById('statusSection');
    this.videoInfo = document.getElementById('videoInfo');
    this.summarySection = document.getElementById('summarySection');
    this.loadingSection = document.getElementById('loadingSection');
    this.errorSection = document.getElementById('errorSection');
    this.noContent = document.getElementById('noContent');
    
    // Status elements
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    
    // Video info elements
    this.platformBadge = document.getElementById('platformBadge');
    this.videoTitle = document.getElementById('videoTitle');
    this.videoDuration = document.getElementById('videoDuration');
    this.startBtn = document.getElementById('startBtn');
    this.stopBtn = document.getElementById('stopBtn');
    
    // Summary elements
    this.summaryContent = document.getElementById('summaryContent');
    this.copyBtn = document.getElementById('copyBtn');
    this.saveBtn = document.getElementById('saveBtn');
    
    // Loading elements
    this.progressFill = document.getElementById('progressFill');
    
    // Error elements
    this.errorMessage = document.getElementById('errorMessage');
    this.retryBtn = document.getElementById('retryBtn');
    
    // Settings modal elements
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Settings form elements
    this.apiKeyInput = document.getElementById('apiKey');
    this.summaryLengthSelect = document.getElementById('summaryLength');
    this.outputLanguageSelect = document.getElementById('outputLanguage');
    this.darkModeCheckbox = document.getElementById('darkMode');
    this.autoSummarizeCheckbox = document.getElementById('autoSummarize');
  }

  // Bind event listeners
  bindEvents() {
    // Button events
    this.startBtn.addEventListener('click', () => this.startSummarization());
    this.stopBtn.addEventListener('click', () => this.stopSummarization());
    this.copyBtn.addEventListener('click', () => this.copySummary());
    this.saveBtn.addEventListener('click', () => this.saveSummary());
    this.retryBtn.addEventListener('click', () => this.retrySummarization());
    
    // Settings events
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    // Dark mode toggle
    this.darkModeCheckbox.addEventListener('change', () => this.toggleDarkMode());
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleBackgroundMessage(request);
    });
  }

  // Load user settings
  async loadSettings() {
    try {
      const response = await this.sendMessageToBackground('getSettings');
      if (response && !response.error) {
        this.settings = response;
        this.applySettings();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  // Apply loaded settings to UI
  applySettings() {
    if (this.settings.openaiApiKey) {
      this.apiKeyInput.value = this.settings.openaiApiKey;
    }
    
    if (this.settings.summaryLength) {
      this.summaryLengthSelect.value = this.settings.summaryLength;
    }
    
    if (this.settings.outputLanguage) {
      this.outputLanguageSelect.value = this.settings.outputLanguage;
    }
    
    if (this.settings.darkMode !== undefined) {
      this.darkModeCheckbox.checked = this.settings.darkMode;
      this.toggleDarkMode();
    }
    
    if (this.settings.autoSummarize !== undefined) {
      this.autoSummarizeCheckbox.checked = this.settings.autoSummarize;
    }
  }

  // Check current tab for video/podcast content
  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && this.isSupportedPlatform(tab.url)) {
        // Wait a bit for content script to detect content
        setTimeout(() => {
          this.updateStatus('Checking for content...', 'processing');
        }, 500);
      } else {
        this.showNoContent();
      }
    } catch (error) {
      console.error('Failed to check current tab:', error);
      this.showNoContent();
    }
  }

  // Check if URL is from a supported platform
  isSupportedPlatform(url) {
    return url && (
      url.includes('youtube.com') ||
      url.includes('spotify.com') ||
      url.includes('apple.com')
    );
  }

  // Handle messages from background script
  handleBackgroundMessage(request) {
    switch (request.action) {
      case 'videoDetected':
        this.handleVideoDetected(request.data);
        break;
      case 'summaryComplete':
        this.handleSummaryComplete(request.data);
        break;
      case 'summaryError':
        this.handleSummaryError(request.error);
        break;
    }
  }

  // Handle video detection
  handleVideoDetected(videoData) {
    this.currentVideo = videoData;
    this.showVideoInfo(videoData);
    this.updateStatus('Video detected', 'ready');
    
    // Auto-start if enabled
    if (this.settings.autoSummarize) {
      setTimeout(() => {
        this.startSummarization();
      }, 1000);
    }
  }

  // Show video information
  showVideoInfo(videoData) {
    // Hide other sections
    this.hideAllSections();
    
    // Set platform badge
    this.platformBadge.textContent = this.getPlatformName(videoData.platform);
    this.platformBadge.className = `platform-badge ${videoData.platform}`;
    
    // Set video details
    this.videoTitle.textContent = videoData.title;
    this.videoDuration.textContent = videoData.duration || 'Duration unknown';
    
    // Show video info section
    this.videoInfo.style.display = 'block';
    this.videoInfo.classList.add('fade-in');
  }

  // Get platform display name
  getPlatformName(platform) {
    const names = {
      'youtube': 'YouTube',
      'spotify': 'Spotify',
      'apple': 'Apple Podcasts'
    };
    return names[platform] || platform;
  }

  // Start summarization process
  async startSummarization() {
    if (!this.currentVideo || this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.updateStatus('Starting audio capture...', 'processing');
      this.showLoading();
      
      // Send message to background script to start audio capture
      await this.sendMessageToBackground('startAudioCapture');
      
      // Update UI
      this.startBtn.style.display = 'none';
      this.stopBtn.style.display = 'inline-block';
      
    } catch (error) {
      console.error('Failed to start summarization:', error);
      this.handleSummaryError('Failed to start audio capture');
    }
  }

  // Stop summarization process
  async stopSummarization() {
    try {
      this.isProcessing = false;
      this.updateStatus('Stopping...', 'processing');
      
      // Send message to background script to stop audio capture
      await this.sendMessageToBackground('stopAudioCapture');
      
      // Reset UI
      this.startBtn.style.display = 'inline-block';
      this.stopBtn.style.display = 'none';
      this.hideLoading();
      this.updateStatus('Ready', 'ready');
      
    } catch (error) {
      console.error('Failed to stop summarization:', error);
    }
  }

  // Handle summary completion
  handleSummaryComplete(summaryData) {
    this.isProcessing = false;
    this.hideLoading();
    this.showSummary(summaryData);
    this.updateStatus('Summary complete', 'ready');
    
    // Reset video actions
    this.startBtn.style.display = 'inline-block';
    this.stopBtn.style.display = 'none';
  }

  // Handle summary error
  handleSummaryError(error) {
    this.isProcessing = false;
    this.hideLoading();
    this.showError(error);
    this.updateStatus('Error occurred', 'error');
    
    // Reset video actions
    this.startBtn.style.display = 'inline-block';
    this.stopBtn.style.display = 'none';
  }

  // Show summary
  showSummary(summaryData) {
    this.hideAllSections();
    
    // Format and display summary
    const formattedSummary = this.formatSummary(summaryData.summary);
    this.summaryContent.innerHTML = formattedSummary;
    
    // Show summary section
    this.summarySection.style.display = 'block';
    this.summarySection.classList.add('fade-in');
  }

  // Format summary text with proper line breaks and structure
  formatSummary(summary) {
    return summary
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  // Show loading state
  showLoading() {
    this.hideAllSections();
    this.loadingSection.style.display = 'block';
    this.loadingSection.classList.add('fade-in');
  }

  // Hide loading state
  hideLoading() {
    this.loadingSection.style.display = 'none';
  }

  // Show error state
  showError(message) {
    this.hideAllSections();
    this.errorMessage.textContent = message;
    this.errorSection.style.display = 'block';
    this.errorSection.classList.add('fade-in');
  }

  // Show no content state
  showNoContent() {
    this.hideAllSections();
    this.noContent.style.display = 'block';
    this.noContent.classList.add('fade-in');
  }

  // Hide all sections
  hideAllSections() {
    const sections = [
      this.videoInfo,
      this.summarySection,
      this.loadingSection,
      this.errorSection,
      this.noContent
    ];
    
    sections.forEach(section => {
      if (section) {
        section.style.display = 'none';
        section.classList.remove('fade-in');
      }
    });
  }

  // Update status display
  updateStatus(text, type = 'ready') {
    this.statusText.textContent = text;
    
    // Update status dot
    this.statusDot.className = 'status-dot';
    if (type === 'processing') {
      this.statusDot.classList.add('processing');
    } else if (type === 'error') {
      this.statusDot.classList.add('error');
    }
  }

  // Copy summary to clipboard
  async copySummary() {
    try {
      const summaryText = this.summaryContent.textContent;
      await navigator.clipboard.writeText(summaryText);
      
      // Show success feedback
      const originalText = this.copyBtn.textContent;
      this.copyBtn.textContent = 'Copied!';
      this.copyBtn.style.background = 'var(--success-color)';
      
      setTimeout(() => {
        this.copyBtn.textContent = originalText;
        this.copyBtn.style.background = '';
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy summary:', error);
      this.showError('Failed to copy summary to clipboard');
    }
  }

  // Save summary to local storage
  async saveSummary() {
    try {
      if (!this.currentVideo) return;
      
      // Get current summary data
      const summaryData = {
        id: Date.now(),
        url: this.currentVideo.url,
        title: this.currentVideo.title,
        summary: this.summaryContent.textContent,
        timestamp: new Date().toISOString(),
        platform: this.currentVideo.platform
      };
      
      // Save to local storage
      await chrome.storage.local.set({
        [`saved_summary_${summaryData.id}`]: summaryData
      });
      
      // Show success feedback
      const originalText = this.saveBtn.textContent;
      this.saveBtn.textContent = 'Saved!';
      this.saveBtn.style.background = 'var(--success-color)';
      
      setTimeout(() => {
        this.saveBtn.textContent = originalText;
        this.saveBtn.style.background = '';
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save summary:', error);
      this.showError('Failed to save summary');
    }
  }

  // Retry summarization
  retrySummarization() {
    this.hideError();
    this.startSummarization();
  }

  // Hide error section
  hideError() {
    this.errorSection.style.display = 'none';
  }

  // Open settings modal
  openSettings() {
    this.settingsModal.style.display = 'flex';
    this.settingsModal.classList.add('fade-in');
  }

  // Close settings modal
  closeSettings() {
    this.settingsModal.classList.add('fade-out');
    setTimeout(() => {
      this.settingsModal.style.display = 'none';
      this.settingsModal.classList.remove('fade-out');
    }, 300);
  }

  // Save settings
  async saveSettings() {
    try {
      const newSettings = {
        openaiApiKey: this.apiKeyInput.value,
        summaryLength: this.summaryLengthSelect.value,
        outputLanguage: this.outputLanguageSelect.value,
        darkMode: this.darkModeCheckbox.checked,
        autoSummarize: this.autoSummarizeCheckbox.checked
      };
      
      // Validate API key
      if (!newSettings.openaiApiKey.trim()) {
        this.showSettingsError('OpenAI API key is required');
        return;
      }
      
      // Close immediately for better UX; we'll reopen on failure
      this.closeSettings();
      
      // Save settings
      const response = await this.sendMessageToBackground('updateSettings', newSettings);
      
      if (response && response.success) {
        this.settings = newSettings;
        this.applySettings();
        
        // Show success message
        this.showSettingsSuccess('Settings saved successfully');
      } else {
        // Reopen modal on failure
        this.openSettings();
        this.showSettingsError('Failed to save settings');
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Reopen modal on failure
      this.openSettings();
      this.showSettingsError('Failed to save settings');
    }
  }

  // Show settings error
  showSettingsError(message) {
    // You could implement a toast notification here
    console.error('Settings error:', message);
  }

  // Show settings success
  showSettingsSuccess(message) {
    // You could implement a toast notification here
    console.log('Settings success:', message);
  }

  // Toggle dark mode
  toggleDarkMode() {
    const isDark = this.darkModeCheckbox.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  // Send message to background script
  sendMessageToBackground(action, data = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VibeSummarizerPopup();
});

// Handle popup window focus to refresh content
window.addEventListener('focus', () => {
  // Refresh content when popup gains focus
  location.reload();
});
