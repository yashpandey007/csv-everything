document.addEventListener('DOMContentLoaded', function() {
  const convertBtn = document.getElementById('convertBtn');
  const loading = document.getElementById('loading');
  const message = document.getElementById('message');
  const messageText = document.getElementById('messageText');
  const closeMessage = document.getElementById('closeMessage');
  const settingsLink = document.getElementById('settingsLink');

  convertBtn.addEventListener('click', handleConvert);
  closeMessage.addEventListener('click', hideMessage);
  settingsLink.addEventListener('click', openSettings);

  async function handleConvert() {
    try {
      showLoading(true);
      hideMessage();

      // Check if API key is configured
      const settings = await getSettings();
      if (!settings.apiKey) {
        showError('API key not found, please add it in settings');
        return;
      }

      // Read image from clipboard
      const imageData = await readClipboardImage();
      if (!imageData) {
        showError('Copy an image of the data first');
        return;
      }

      // Send to background script for conversion
      const result = await sendToBackground(imageData, settings);
      
      if (result.success) {
        showSuccess('CSV file downloaded successfully');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Conversion error:', error);
      if (error.message.includes('API')) {
        showError(error.message);
      } else {
        showError('Could not convert this image to a csv');
      }
    } finally {
      showLoading(false);
    }
  }

  async function readClipboardImage() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            return await blobToBase64(blob);
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Clipboard read error:', error);
      return null;
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function sendToBackground(imageData, settings) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'convertImage',
        imageData: imageData,
        settings: settings
      }, (response) => {
        resolve(response);
      });
    });
  }

  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'model', 'prompt'], (result) => {
        resolve(result);
      });
    });
  }



  function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
    convertBtn.disabled = show;
  }

  function showMessage(text, type) {
    messageText.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
  }

  function showError(text) {
    showMessage(text, 'error');
  }

  function showSuccess(text) {
    showMessage(text, 'success');
  }

  function hideMessage() {
    message.style.display = 'none';
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }
});
