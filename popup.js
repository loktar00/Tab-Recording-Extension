document.addEventListener('DOMContentLoaded', async function() {
    const recordTabBtn = document.getElementById('recordTab');
    const stopBtn = document.getElementById('stopRecording');
    const status = document.getElementById('status');

    // Check if already recording when popup opens
    await updateUIFromRecordingState();

    recordTabBtn.addEventListener('click', async function() {
        try {
            console.log('Starting tab recording...');

            // Show status
            recordTabBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            status.style.display = 'block';
            status.textContent = 'Requesting permission...';
            status.className = 'status ready';

            // Send message to background script to start recording via offscreen document
            chrome.runtime.sendMessage({
                action: 'startRecording',
                type: 'tab'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                    status.textContent = 'Error: ' + chrome.runtime.lastError.message;
                    status.className = 'status ready';
                    recordTabBtn.style.display = 'block';
                    stopBtn.style.display = 'none';
                    return;
                }

                if (response && response.success) {
                    status.textContent = 'Recording in progress... You can close this popup!';
                    status.className = 'status recording';
                    console.log('Recording started successfully');
                } else {
                    const errorMsg = response?.error || 'Unknown error';
                    status.textContent = 'Error: ' + errorMsg;
                    status.className = 'status ready';
                    recordTabBtn.style.display = 'block';
                    stopBtn.style.display = 'none';
                }
            });

        } catch (error) {
            console.error('Error starting recording:', error);

            // User cancelled or error occurred
            if (error.name === 'NotAllowedError') {
                status.textContent = 'Permission denied or cancelled';
            } else {
                status.textContent = 'Error: ' + error.message;
            }

            status.className = 'status ready';
            recordTabBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        }
    });

    stopBtn.addEventListener('click', function() {
        console.log('Stopping recording...');

        status.textContent = 'Stopping recording...';
        status.className = 'status ready';

        chrome.runtime.sendMessage({
            action: 'stopRecording'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
                status.textContent = 'Error stopping: ' + chrome.runtime.lastError.message;
                return;
            }

            if (response && response.success) {
                recordTabBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                status.textContent = 'Recording stopped! Download will start...';
                status.className = 'status ready';

                setTimeout(() => {
                    status.style.display = 'none';
                }, 3000);
            } else {
                status.textContent = 'Error: ' + (response?.error || 'Failed to stop');
            }
        });
    });

    // Function to update UI based on current recording state
    async function updateUIFromRecordingState() {
        chrome.runtime.sendMessage({
            action: 'getRecordingStatus'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting status:', chrome.runtime.lastError);
                return;
            }

            if (response && response.isRecording) {
                // Currently recording, show stop button
                recordTabBtn.style.display = 'none';
                stopBtn.style.display = 'block';
                status.style.display = 'block';
                status.textContent = 'Recording in progress... You can close this popup!';
                status.className = 'status recording';
            } else {
                // Not recording, show record button
                recordTabBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                status.style.display = 'none';
            }
        });
    }
});