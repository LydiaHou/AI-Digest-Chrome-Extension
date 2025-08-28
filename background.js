chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GENERATE_SUMMARY") {
      fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${msg.apiKey}`
          },
          body: JSON.stringify({
              model: "gpt-5-mini",
              messages: [
                  {
                      role: "user",
                      content: `請將以下內容摘要成 ${msg.length}，語言為 ${msg.language}：\n${msg.content}`
                  }
              ]
          })
      })
      .then(res => res.json())
      .then(data => {
          const summary = data.choices?.[0]?.message?.content || "無法生成摘要";
          sendResponse({ summary });
      })
      .catch(err => sendResponse({ error: err.message }));

      return true; // 保證異步回應
  }
});
