document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const promptInput = document.getElementById('prompt');
  const notification = document.getElementById('notification');

  // Load saved settings
  loadSettings();

  form.addEventListener('submit', handleSave);

  async function loadSettings() {
    chrome.storage.sync.get(['apiKey', 'model', 'prompt'], (result) => {
      apiKeyInput.value = result.apiKey || '';
      modelInput.value = result.model || 'google/gemini-2.5-pro';
      promptInput.value = result.prompt || 'turn the image into a csv';
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim() || 'google/gemini-2.5-pro',
      prompt: promptInput.value.trim() || 'turn the image into a csv'
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
