// Content script for additional functionality
// This script runs on all pages and can be used for:
// - Visual indicators during recording
// - Custom tab-specific recording features
// - Communication with the page for recording events

let isRecording = false;
let recordingIndicator = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'recordingStateChanged') {
        isRecording = request.isRecording;
        updateRecordingIndicator(request.isRecording);
    }
});

function updateRecordingIndicator(recording) {
    if (recording && !recordingIndicator) {
        // Create a recording indicator
        recordingIndicator = document.createElement('div');
        recordingIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #d32f2f;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 5px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        recordingIndicator.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
            REC
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(recordingIndicator);
    } else if (!recording && recordingIndicator) {
        // Remove the recording indicator
        if (recordingIndicator.parentNode) {
            recordingIndicator.parentNode.removeChild(recordingIndicator);
        }
        recordingIndicator = null;
    }
}

// Function to notify background script about page readiness
function notifyPageReady() {
    chrome.runtime.sendMessage({
        action: 'pageReady',
        url: window.location.href,
        title: document.title
    });
}

// Notify when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyPageReady);
} else {
    notifyPageReady();
}