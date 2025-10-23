let isRecording = false;

// Update badge when recording state changes
function updateBadge() {
    if (isRecording) {
        chrome.action.setBadgeText({ text: 'REC' });
        chrome.action.setBadgeBackgroundColor({ color: '#d32f2f' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'startRecording':
            handleStartRecording(sendResponse);
            return true;

        case 'stopRecording':
            handleStopRecording(sendResponse);
            return true;

        case 'getRecordingStatus':
            sendResponse({ isRecording: isRecording });
            break;

        case 'recordingComplete':
            isRecording = false;
            updateBadge();
            break;
    }
});

async function handleStartRecording(sendResponse) {
    try {
        console.log('Starting recording via offscreen document...');

        if (isRecording) {
            sendResponse({ success: false, error: 'Already recording' });
            return;
        }

        // Create offscreen document if it doesn't exist
        await ensureOffscreenDocument();

        // Send message to offscreen document to start capture
        chrome.runtime.sendMessage({
            action: 'startCapture'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error starting capture:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            if (response && response.success) {
                isRecording = true;
                updateBadge();
                console.log('Recording started successfully');
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: response?.error || 'Failed to start recording' });
            }
        });
    } catch (error) {
        console.error('Error in handleStartRecording:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleStopRecording(sendResponse) {
    try {
        if (!isRecording) {
            sendResponse({ success: false, error: 'No active recording' });
            return;
        }

        console.log('Stopping recording...');

        // Send message to offscreen document to stop capture
        chrome.runtime.sendMessage({
            action: 'stopCapture'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error stopping capture:', chrome.runtime.lastError);
            }

            isRecording = false;
            updateBadge();
            sendResponse({ success: true });
        });
    } catch (error) {
        console.error('Error stopping recording:', error);
        isRecording = false;
        updateBadge();
        sendResponse({ success: false, error: error.message });
    }
}

async function ensureOffscreenDocument() {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });

    if (existingContexts.length > 0) {
        console.log('Offscreen document already exists');
        return;
    }

    // Create offscreen document
    console.log('Creating offscreen document...');
    await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('offscreen.html'),
        reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
        justification: 'Recording screen capture for screen recorder extension'
    });

    console.log('Offscreen document created');
}
