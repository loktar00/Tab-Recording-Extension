// This offscreen document handles the actual recording
let mediaRecorder;
let recordedChunks = [];

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

        mediaRecorder = new MediaRecorder(stream, {
            videoBitsPerSecond: 25000000
        });

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

        mediaRecorder.start(200);
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
    const blob = new Blob(recordedChunks, {
        type: 'video/mp4;codecs=h264'
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `recording-${timestamp}`;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${filename}.mp4`;

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
    }, 1000);

    console.log('Recording saved:', filename);
}

