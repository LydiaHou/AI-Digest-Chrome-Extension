// options.js — Options page logic for Vibe

document.addEventListener('DOMContentLoaded', () => {
  const els = getEls();

  // Load saved settings
  chrome.storage.sync.get([
    'provider', 'openaiApiKey', 'anthropicApiKey', 'geminiApiKey',
    'summaryMode', 'summaryLength', 'iterations'
  ], (settings) => {
    els.provider.value = settings.provider || 'openai';
    els.openaiKey.value = settings.openaiApiKey || '';
    els.anthropicKey.value = settings.anthropicApiKey || '';
    els.geminiKey.value = settings.geminiApiKey || '';
    els.summaryMode.value = settings.summaryMode || 'executive';
    els.summaryLength.value = settings.summaryLength || 'medium';
    els.iterations.value = settings.iterations != null ? settings.iterations : 1;
  });

  // Save button
  els.saveBtn.addEventListener('click', () => {
    const payload = {
      provider: els.provider.value,
      openaiApiKey: els.openaiKey.value.trim(),
      anthropicApiKey: els.anthropicKey.value.trim(),
      geminiApiKey: els.geminiKey.value.trim(),
      summaryMode: els.summaryMode.value,
      summaryLength: els.summaryLength.value,
      iterations: Math.max(0, Math.min(3, parseInt(els.iterations.value, 10) || 1))
    };

    // Send to background safely
    chrome.runtime.sendMessage(
      { action: 'updateSettings', settings: payload },
      (resp) => {
        if (resp?.ok) {
          els.status.textContent = 'Saved';
          setTimeout(() => (els.status.textContent = ''), 1500);
        } else {
          console.error('Failed to save settings:', resp?.error);
          els.status.textContent = 'Error saving';
          setTimeout(() => (els.status.textContent = ''), 1500);
        }
      }
    );
  });
});

function getEls() {
  return {
    provider: document.getElementById('provider'),
    openaiKey: document.getElementById('openaiKey'),
    anthropicKey: document.getElementById('anthropicKey'),
    geminiKey: document.getElementById('geminiKey'),
    summaryMode: document.getElementById('summaryMode'),
    summaryLength: document.getElementById('summaryLength'),
    iterations: document.getElementById('iterations'),
    saveBtn: document.getElementById('saveBtn'),
    status: document.getElementById('status')
  };
}
