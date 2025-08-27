# Vibe Video Summarizer (MVP)

A Chrome extension that automatically summarizes YouTube videos using AI. The extension captures video metadata and official subtitles, then generates concise summaries with key insights.

## ✨ Features (MVP)

- **YouTube Video Detection**: Detects YouTube videos and extracts title, description, and official subtitles
- **Official Subtitle Fetching**: Automatically retrieves YouTube captions via transcript API
- **AI-Powered Summaries**: Generates summaries using **ChatGPT API (model: gpt-5-mini)**
- **Customizable Summary Length**: Short, medium, or long
- **Multi-Language Support**: Summaries can be generated in different languages
- **Local Storage**: Save summaries locally for later access
- **Dark/Light Mode**: Toggle for better readability

---

## 🚀 Installation (MVP)

### Prerequisites

- Google Chrome (version 88 or higher)  
- OpenAI API key (for ChatGPT)  
- Active internet connection  

### Steps

1. **Download Extension**
   ```bash
   git clone <repository-url>
   cd vibe-video-summarizer
Load in Chrome

Open chrome://extensions/

Enable "Developer mode"

Click "Load unpacked" → select the folder with manifest.json

Configure API Key

Click the extension icon → settings

Enter your OpenAI API key → save

🎯 Usage (MVP)
Open a YouTube video

Extension automatically fetches title, description, and official subtitles

Click "Start Summarizing" in the popup

Generated summary appears in the popup

Copy or save the summary locally

⚙️ Configuration
Setting	Description	Default
OpenAI API Key	Required for summary generation	-
Summary Length	Short, Medium, Long	Medium
Output Language	Language of the summary	Chinese
Dark Mode	Toggle light/dark theme	Off

API Usage
ChatGPT API

Model: gpt-5-mini

Generates concise summaries from video metadata and subtitles

Cost depends on OpenAI plan (~$0.002 per 1K tokens)

🔧 Technical Architecture
File Structure (MVP)
css
複製程式碼
vibe-video-summarizer/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── icons/
└── README.md
Core Components
Background Script (background.js): Handles API communication and summary generation

Content Script (content.js): Detects YouTube video, fetches title/description/subtitles, sends data to background

Popup (popup.html/js/css): Displays video info, generates summary, manages settings

Data Flow (MVP)
css
複製程式碼
User opens YouTube video
         ↓
Content script extracts title, description, subtitles
         ↓
Background script sends data to ChatGPT (gpt-5-mini)
         ↓
Summary generated and displayed in popup
🔒 Privacy & Security
Local Processing: Only video metadata and captions are processed

API Communication: Only relevant data sent to OpenAI

No Tracking: Extension does not collect personal data

Local Storage: Summaries saved locally

🐛 Troubleshooting (MVP)
API key not configured: Enter valid key in settings

Failed to fetch subtitles: Ensure video has official captions enabled

Summary generation failed: Check internet connection and API key

🚧 Limitations (MVP)
Platform: YouTube only

Video Language: Captions must exist in requested language

Processing Time: Longer videos take more time

Browser Support: Chrome only (Manifest V3)

🤝 Contributing
Clone repository → modify source → reload extension in Chrome

Follow ES6+ JavaScript best practices

Comment complex logic for clarity

📄 License
MIT License - see LICENSE
