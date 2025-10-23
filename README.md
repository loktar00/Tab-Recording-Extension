# Tab Recorder Extension

A Chrome extension that allows you to record your current tab, screen, or specific window.

## Features

- 📱 Tab recording
- 🖥️ Screen recording
- 🪟 Window recording
- 💾 Automatic MP4 downloads

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder
5. Grant permissions when prompted

## Usage

1. Click the extension icon
2. Choose what to record
3. Click "Stop Recording" when done
4. Recording downloads automatically

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI and logic
- `background.js` - Service worker
- `content.js` - Content script
- `offscreen.html/js` - Offscreen document for recording
- `icons/` - Extension icons

## License

MIT License