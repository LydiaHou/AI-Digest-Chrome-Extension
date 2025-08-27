# Vibe Video & Podcast Summarizer

A powerful Chrome extension that automatically summarizes YouTube videos and podcast episodes using AI. The extension captures audio, converts it to text, and generates concise summaries with key insights and timestamps.

## ✨ Features

- **Automatic Content Detection**: Automatically detects YouTube videos, Spotify podcasts, and Apple Podcasts
- **Audio Capture**: Captures audio from video/audio streams for processing
- **Speech-to-Text**: Converts audio to text using OpenAI Whisper API or Web Speech API fallback
- **AI-Powered Summaries**: Generates intelligent summaries using ChatGPT API
- **Multi-Platform Support**: Works with YouTube, Spotify, and Apple Podcasts
- **Smart Timestamps**: Identifies key moments and provides timestamp references
- **Customizable Settings**: Adjust summary length, output language, and processing preferences
- **Dark Mode**: Beautiful dark/light theme support
- **Local Storage**: Save summaries for offline access
- **Performance Optimized**: Uses Web Workers for background processing

## 🚀 Installation

### Prerequisites

- Google Chrome browser (version 88 or higher)
- OpenAI API key for ChatGPT and Whisper services
- Active internet connection

### Step-by-Step Installation

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd vibe-video-summarizer
   ```

2. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Navigate to API Keys section
   - Create a new API key
   - Copy and save the key securely

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`

4. **Configure API Key**
   - Click the Vibe Summarizer extension icon in your toolbar
   - Click the settings gear icon
   - Enter your OpenAI API key
   - Save settings

## 🎯 Usage

### Basic Usage

1. **Navigate to Supported Content**
   - Go to any YouTube video
   - Visit a Spotify podcast episode
   - Browse Apple Podcasts

2. **Automatic Detection**
   - The extension automatically detects video/podcast content
   - A notification appears showing detected content details

3. **Start Summarization**
   - Click "Start Summarizing" in the popup
   - The extension begins capturing audio
   - Processing typically takes 2-5 minutes depending on content length

4. **View Results**
   - Generated summary appears with key insights
   - Copy or save summaries for later reference
   - Access saved summaries from the extension popup

### Advanced Features

- **Custom Summary Length**: Choose between short, medium, or long summaries
- **Multi-Language Support**: Generate summaries in different languages
- **Auto-Summarize**: Enable automatic summarization for detected content
- **Audio Quality**: Adjust audio capture settings for better results

## ⚙️ Configuration

### Settings Options

| Setting | Description | Default |
|---------|-------------|---------|
| **OpenAI API Key** | Required for AI-powered summaries | - |
| **Summary Length** | Short, Medium, or Long summaries | Medium |
| **Output Language** | Language for generated summaries | English |
| **Dark Mode** | Toggle between light and dark themes | Off |
| **Auto-Summarize** | Automatically start summarization | On |

### API Configuration

The extension uses two OpenAI APIs:

1. **Whisper API**: Converts audio to text
   - Model: `whisper-1`
   - Cost: $0.006 per minute of audio

2. **ChatGPT API**: Generates summaries
   - Model: `gpt-3.5-turbo`
   - Cost: ~$0.002 per 1K tokens

## 🔧 Technical Architecture

### File Structure

```
vibe-video-summarizer/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── content.js            # Content script for web pages
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── worker.js             # Web Worker for audio processing
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Core Components

1. **Background Script (`background.js`)**
   - Manages extension lifecycle
   - Handles API communication
   - Coordinates between components
   - Manages audio processing

2. **Content Script (`content.js`)**
   - Detects video/podcast content
   - Extracts metadata (title, duration, etc.)
   - Initiates audio capture
   - Communicates with background script

3. **Popup Interface (`popup.html/js/css`)**
   - User interface for extension
   - Displays content information
   - Shows generated summaries
   - Manages user settings

4. **Web Worker (`worker.js`)**
   - Background audio processing
   - Noise reduction and normalization
   - Audio format conversion
   - Prevents UI blocking

### Data Flow

```
User visits video/podcast page
         ↓
Content script detects content
         ↓
Background script receives notification
         ↓
Audio capture begins
         ↓
Audio sent to OpenAI Whisper API
         ↓
Transcript generated
         ↓
Transcript sent to ChatGPT API
         ↓
Summary generated and displayed
         ↓
User can copy/save summary
```

## 🔒 Privacy & Security

### Data Handling

- **Audio Processing**: Audio is processed locally when possible
- **API Communication**: Only necessary data is sent to OpenAI APIs
- **Local Storage**: Summaries are stored locally in your browser
- **No Tracking**: Extension doesn't collect personal data

### Permissions

The extension requests these permissions:

- `activeTab`: Access to current tab for content detection
- `storage`: Save user settings and summaries
- `tabs`: Monitor tab changes for content detection
- `scripting`: Execute content scripts
- `webRequest`: Monitor web requests for API calls

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Go to extension settings
   - Enter your valid OpenAI API key
   - Save settings

2. **"Failed to start audio capture"**
   - Ensure microphone permissions are granted
   - Check if content is playing
   - Refresh the page and try again

3. **"Summary generation failed"**
   - Verify API key is valid and has credits
   - Check internet connection
   - Try with shorter content first

4. **Extension not detecting content**
   - Ensure you're on a supported platform
   - Wait for page to fully load
   - Refresh the page

### Performance Tips

- Use headphones for better audio capture
- Close unnecessary browser tabs
- Ensure stable internet connection
- Process shorter content first to test

## 🚧 Limitations

### Current Limitations

- **Audio Quality**: Depends on system audio capture capabilities
- **Processing Time**: Longer content requires more processing time
- **API Costs**: OpenAI API usage incurs costs
- **Browser Support**: Chrome-only (Manifest V3 requirement)
- **Content Types**: Limited to supported platforms

### Future Enhancements

- Support for more platforms (Netflix, Hulu, etc.)
- Offline processing capabilities
- Batch processing for multiple videos
- Export summaries to various formats
- Integration with note-taking apps

## 🤝 Contributing

### Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd vibe-video-summarizer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Load in Chrome**
   - Follow installation steps above
   - Make changes to source files
   - Reload extension in Chrome

### Code Style

- Use ES6+ JavaScript features
- Follow Chrome extension best practices
- Add comments for complex logic
- Maintain consistent formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing powerful AI APIs
- Chrome Extensions team for documentation
- Open source community for inspiration

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section above
- Review Chrome extension documentation

---

**Note**: This extension requires an active OpenAI API key and internet connection to function. Audio processing and API calls may incur costs depending on your OpenAI plan.
