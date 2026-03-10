// This offscreen document handles the actual recording
let mediaRecorder;
let recordedChunks = [];
let recordingMimeType = '';

function getPreferredMimeType() {
    // Prefer MP4 with H.264+AAC for maximum compatibility (Twitter, Handbrake, etc.)
    const types = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log('Using mimeType:', type);
            return type;
        }
    }

    console.warn('No preferred mimeType supported, using browser default');
    return '';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Offscreen received message:', request.action);

    switch (request.action) {
        case 'startCapture':
            startRecording().then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                console.error('Error starting capture:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Will respond asynchronously

        case 'stopCapture':
            stopRecording();
            sendResponse({ success: true });
            break;
    }

    return true;
});

async function startRecording() {
    try {
        console.log('Requesting display media in offscreen document...');

        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: {
                mediaSource: "screen",
                frameRate: { ideal: 60, max: 60 }
            }
        });

        console.log('Got stream, setting up recorder...');

        recordedChunks = [];

        recordingMimeType = getPreferredMimeType();
        const recorderOptions = {
            videoBitsPerSecond: 25000000,
        };
        if (recordingMimeType) {
            recorderOptions.mimeType = recordingMimeType;
        }

        mediaRecorder = new MediaRecorder(stream, recorderOptions);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            console.log('Recording stopped, saving file...');
            saveFile(recordedChunks);
            recordedChunks = [];

            // Notify background that recording is complete
            chrome.runtime.sendMessage({ action: 'recordingComplete' });
        };

        // MP4 doesn't support chunked concatenation properly — record as a
        // single segment so the container/moov atom are written correctly.
        // WebM handles timeslice fine, so we can still chunk there to limit
        // memory pressure on very long recordings.
        if (recordingMimeType.includes('mp4')) {
            mediaRecorder.start();
        } else {
            mediaRecorder.start(200);
        }
        console.log('Recording started successfully');

    } catch (error) {
        console.error('Error in startRecording:', error);
        throw error;
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('Stopping media recorder...');
        mediaRecorder.stop();

        // Stop all tracks
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
}

function saveFile(recordedChunks) {
    const mimeType = recordingMimeType || mediaRecorder?.mimeType || 'video/webm';
    const blob = new Blob(recordedChunks, { type: mimeType });

    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `recording-${timestamp}`;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.${extension}`;

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
    }, 1000);

    console.log('Recording saved:', filename);
}

