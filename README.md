Of course, here is the English Markdown version, formatted for easy copying.

-----

# Vibe Video Summarizer (MVP)

A Chrome extension that automatically summarizes YouTube videos using AI. The extension captures video metadata and official subtitles, then generates concise summaries with key insights.

## ✨ Features (MVP)

  - **YouTube Video Detection**: Detects YouTube videos and extracts the title, description, and official subtitles.
  - **Official Subtitle Fetching**: Automatically retrieves YouTube captions via the transcript API.
  - **AI-Powered Summaries**: Generates summaries using the **ChatGPT API (model: `gpt-5-mini`)**.
  - **Customizable Summary Length**: Choose between short, medium, or long summaries.
  - **Multi-Language Support**: Summaries can be generated in different languages.
  - **Local Storage**: Save summaries locally for later access.
  - **Dark/Light Mode**: Toggle for better readability.

-----

## 🚀 Installation (MVP)

### Prerequisites

  - Google Chrome (version 88 or higher)
  - OpenAI API key (for ChatGPT)
  - Active internet connection

### Steps

1.  **Download the Extension**
    ```bash
    git clone <repository-url>
    cd vibe-video-summarizer
    ```
2.  **Load in Chrome**
      - Open `chrome://extensions/`
      - Enable "**Developer mode**"
      - Click "**Load unpacked**" → select the folder containing `manifest.json`
3.  **Configure API Key**
      - Click the extension icon → settings
      - Enter your OpenAI API key → save

-----

## 🎯 Usage (MVP)

1.  Open a YouTube video.
2.  The extension automatically fetches the title, description, and official subtitles.
3.  Click "**Start Summarizing**" in the popup.
4.  The generated summary appears in the popup.
5.  Copy or save the summary locally.

-----

## ⚙️ Configuration

| Setting        | Description                        | Default |
| :------------- | :--------------------------------- | :------ |
| OpenAI API Key | Required for summary generation    | -       |
| Summary Length | Short, Medium, Long                | Medium  |
| Output Language| Language of the summary            | English |
| Dark Mode      | Toggle light/dark theme            | Off     |

-----

## API Usage

### ChatGPT API

  - **Model**: `gpt-5-mini`
  - **Purpose**: Generates concise summaries from video metadata and subtitles.
  - **Cost**: Depends on your OpenAI plan (approx. $0.002 per 1K tokens).

-----

## 🔧 Technical Architecture

### File Structure (MVP)

```
vibe-video-summarizer/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── icons/
└── README.md
```

### Core Components

  - **Background Script (`background.js`)**: Handles API communication and summary generation.
  - **Content Script (`content.js`)**: Detects the YouTube video, fetches title/description/subtitles, and sends data to the background script.
  - **Popup (`popup.html/js/css`)**: Displays video info, triggers summary generation, and manages settings.

### Data Flow (MVP)

```
User opens a YouTube video
          ↓
Content script extracts title, description, subtitles
          ↓
Background script sends data to ChatGPT (gpt-5-mini)
          ↓
Summary is generated and displayed in the popup
```

-----

## 🔒 Privacy & Security

  - **Local Processing**: Only video metadata and captions are processed.
  - **API Communication**: Only relevant data is sent to OpenAI for summarization.
  - **No Tracking**: The extension does not collect personal data.
  - **Local Storage**: Summaries are saved on your local machine.

-----

## 🐛 Troubleshooting (MVP)

  - **API key not configured**: Enter a valid key in the settings.
  - **Failed to fetch subtitles**: Ensure the video has official captions enabled.
  - **Summary generation failed**: Check your internet connection and API key validity.

-----

## 🚧 Limitations (MVP)

  - **Platform**: YouTube only.
  - **Video Language**: Official captions must exist for the video.
  - **Processing Time**: Longer videos may take more time to summarize.
  - **Browser Support**: Chrome only (Manifest V3).

-----

## 🤝 Contributing

  - Clone the repository → modify the source code → reload the extension in Chrome.
  - Follow ES6+ JavaScript best practices.
  - Comment complex logic for clarity.

-----

## 📄 License

MIT License - see the `LICENSE` file for details.
