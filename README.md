# CSV Everything

A Chrome Extension that converts images of tables or charts into downloadable CSV files using the OpenRouter API.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory
4. The extension icon will appear in your toolbar

## Setup

1. Click the extension icon and select "Settings"
2. Add your OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))
3. Optionally customize the model and prompt

## Usage

1. Copy an image of a table or chart to your clipboard
2. Click the CSV Everything extension icon
3. Click "Convert Image to CSV"
4. Choose where to save the generated CSV file

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Main popup interface
- `popup.js` - Main extension logic
- `options.html` - Settings page
- `options.js` - Settings page logic
- `icons/` - Extension icons (SVG placeholders)

## Features

- Reads images from clipboard
- Configurable OpenRouter models
- Custom prompts for different data types
- Error handling for all edge cases
- Native Chrome download integration
