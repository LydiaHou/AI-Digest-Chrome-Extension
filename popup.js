const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const summaryContent = document.getElementById("summaryContent");

const apiKeyInput = document.getElementById("apiKey");
const summaryLengthInput = document.getElementById("summaryLength");
const outputLanguageInput = document.getElementById("outputLanguage");

// 點擊「開始摘要」
startBtn.addEventListener("click", () => {
    statusText.textContent = "Processing...";
    summaryContent.textContent = "";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "CHECK_VIDEO" }, (response) => {
            if (chrome.runtime.lastError) {
                statusText.textContent = "Content script not ready.";
                return;
            }
            if (!response || !response.found) {
                statusText.textContent = "No video detected.";
                return;
            }

            const { title, description } = response;
            const contentToSummarize = `標題: ${title}\n描述: ${description}`;

            // 呼叫 background 生成摘要
            chrome.runtime.sendMessage({
                type: "GENERATE_SUMMARY",
                apiKey: apiKeyInput.value,
                content: contentToSummarize,
                length: summaryLengthInput.value,
                language: outputLanguageInput.value
            }, (res) => {
                if (res.error) {
                    statusText.textContent = "Error: " + res.error;
                } else {
                    summaryContent.textContent = res.summary;
                    statusText.textContent = "Ready";
                }
            });
        });
    });
});
