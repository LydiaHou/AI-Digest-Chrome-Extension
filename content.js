// content.js

// 抓取影片標題
function getTitle() {
  const titleEl = document.querySelector("h1.title, h1.title.style-scope.ytd-video-primary-info-renderer");
  return titleEl?.innerText || "";
}

// 抓取影片描述
function getDescription() {
  const descEl = document.querySelector("#description, #description yt-formatted-string");
  return descEl?.innerText || "";
}

// 嘗試抓字幕文字 (YouTube Transcript 面板內文字)
function getCaptions() {
  // 先找官方字幕的 cue 元素
  const cues = document.querySelectorAll(".cue"); // 某些擴充面板可能是其他 class
  if (cues.length > 0) {
      return [...cues].map(el => el.innerText).join("\n");
  }
  // fallback: 沒抓到字幕就回空
  return "";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_VIDEO") {
      const title = getTitle();
      const description = getDescription();
      const captions = getCaptions();

      if (title || description || captions) {
          sendResponse({
              found: true,
              title,
              description,
              captions
          });
      } else {
          sendResponse({ found: false });
      }

      return true; // 保證異步回應
  }
});
