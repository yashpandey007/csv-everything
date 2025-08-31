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

      // Send to OpenRouter API
      const csvData = await convertImageToCSV(imageData, settings);
      
      // Trigger download
      downloadCSV(csvData);
      showSuccess('CSV file downloaded successfully');
      
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

  async function convertImageToCSV(imageData, settings) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': chrome.runtime.getURL(''),
        'X-Title': 'CSV Everything Chrome Extension'
      },
      body: JSON.stringify({
        model: settings.model || 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: settings.prompt || 'turn the image into a csv'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let csvContent = data.choices?.[0]?.message?.content;
    
    if (!csvContent) {
      throw new Error('Could not convert this image to a csv');
    }

    // Strip markdown formatting
    csvContent = csvContent.replace(/```csv\n?/g, '');
    csvContent = csvContent.replace(/```\n?/g, '');
    csvContent = csvContent.trim();

    return csvContent;
  }

  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey', 'model', 'prompt'], (result) => {
        resolve(result);
      });
    });
  }

  function downloadCSV(csvData) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: 'data.csv',
      saveAs: true
    }, () => {
      URL.revokeObjectURL(url);
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
