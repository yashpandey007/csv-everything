chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertImage') {
    // Show loading badge (down arrow)
    chrome.action.setBadgeText({ text: '↓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    handleConversion(request.imageData, request.settings)
      .then(result => {
        // Clear badge on success
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        // Clear badge on error
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

async function handleConversion(imageData, settings) {
  try {
    if (settings.debugMode) {
      console.log('CSV Everything Debug - Request settings:', {
        model: settings.model,
        prompt: settings.prompt,
        hasApiKey: !!settings.apiKey
      });
    }

    // Send to OpenRouter API
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

    // Always log response in debug mode, even for errors
    if (settings.debugMode) {
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log('CSV Everything Debug - Full API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
    }

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

    // Create download using data URL (works in service worker)
    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: 'data.csv',
      saveAs: true
    });
    
    return csvContent;
    
  } catch (error) {
    console.error('Background conversion error:', error);
    throw error;
  }
}
