document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const promptInput = document.getElementById('prompt');
  const debugModeInput = document.getElementById('debugMode');
  const notification = document.getElementById('notification');

  // Load saved settings
  loadSettings();

  form.addEventListener('submit', handleSave);

  async function loadSettings() {
    chrome.storage.sync.get(['apiKey', 'model', 'prompt', 'debugMode'], (result) => {
      apiKeyInput.value = result.apiKey || '';
      modelInput.value = result.model || 'google/gemini-2.5-flash';
      promptInput.value = result.prompt || 'turn the image into a csv. only return a csv.';
      debugModeInput.checked = result.debugMode || false;
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim() || 'google/gemini-2.5-flash',
      prompt: promptInput.value.trim() || 'turn the image into a csv. only return a csv.',
      debugMode: debugModeInput.checked
    };

    if (!settings.apiKey) {
      alert('API Key is required');
      return;
    }

    chrome.storage.sync.set(settings, () => {
      showNotification();
    });
  }

  function showNotification() {
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
});
