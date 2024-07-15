const videoInput = document.getElementById('videoInput');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const roiCanvas = document.getElementById('roiCanvas');
const roiCtx = roiCanvas.getContext('2d');
const aspectRatio = document.getElementById("aspectRatio");
const startCropper = document.getElementById("startCropper");
const stopCropper = document.getElementById("stopCropper");

const playbackRateControl = document.getElementById('playbackRate');
const volumeControl = document.getElementById('volumeControl');
const timelineControl = document.getElementById('timeline');

const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');

const overlay = document.getElementById('overlay');
const generatePreviewButton = document.getElementById('generatePreview');

let aspectRatioValue = 9 / 16;
let isDragging = false;
let startX;
let intervalId;
let data = [];

// Utility function to split string ratio
function splitString(ratio) {
    const parts = ratio.split(":");
    const num1 = parseInt(parts[0], 10);
    const num2 = parseInt(parts[1], 10);
    return [num1, num2];
}

// Handle aspect ratio change
aspectRatio.addEventListener('change', () => {
    const [num1, num2] = splitString(aspectRatio.value);
    aspectRatioValue = num1 / num2;
    if (overlay.style.display === "block") {
        updateOverlaySizeAndPosition();
    }
});

// Handle playback rate change
playbackRateControl.addEventListener('change', () => {
    video.playbackRate = playbackRateControl.value;
});

// Handle volume change
volumeControl.addEventListener('input', () => {
    video.volume = volumeControl.value;
});

// Handle timeline change
timelineControl.addEventListener('input', () => {
    video.currentTime = video.duration * (timelineControl.value / 100);
});

// Update timeline control as video plays
video.addEventListener('timeupdate', () => {
    timelineControl.value = (video.currentTime / video.duration) * 100;
});

// Play video
playButton.addEventListener('click', () => {
    video.play();
});

// Pause video
pauseButton.addEventListener('click', () => {
    video.pause();
});

// Start cropper
startCropper.addEventListener("click", () => {
    roiCanvas.removeAttribute("hidden");
    const overlayHeight = canvas.height;
    const overlayWidth = overlayHeight * aspectRatioValue;

    overlay.style.display = "block";
    overlay.style.height = `${overlayHeight}px`;
    overlay.style.width = `${overlayWidth}px`;
    overlay.style.left = `${(canvas.width - overlayWidth) / 2}px`;
    overlay.style.top = "0px";

    overlay.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    startRecording();
});

// Stop cropper
stopCropper.addEventListener("click", () => {
    overlay.style.display = "none";
    roiCanvas.setAttribute("hidden", "hidden");
    overlay.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    stopRecording();
});

// Start recording data at intervals
function startRecording() {
    intervalId = setInterval(() => {
        const timeStamp = video.currentTime;
        const coordinates = [
            parseFloat(overlay.style.left),
            parseFloat(overlay.style.top),
            parseFloat(overlay.style.width),
            parseFloat(overlay.style.height)
        ];
        const volume = video.volume;
        const playbackRate = video.playbackRate;

        data.push({ timeStamp, coordinates, volume, playbackRate });
    }, 1000); // Record every second
}

// Stop recording data
function stopRecording() {
    clearInterval(intervalId);
}

// Handle mousedown event
function onMouseDown(event) {
    isDragging = true;
    startX = event.clientX - parseFloat(overlay.style.left);
}

// Handle mousemove event
function onMouseMove(event) {
    if (isDragging) {
        const newLeft = event.clientX - startX;
        const overlayWidth = parseFloat(overlay.style.width);

        // Ensure overlay stays within video bounds
        if (newLeft >= 0 && newLeft + overlayWidth <= canvas.width) {
            overlay.style.left = `${newLeft}px`;
        } else if (newLeft < 0) {
            overlay.style.left = "0px";
        } else if (newLeft + overlayWidth > canvas.width) {
            overlay.style.left = `${canvas.width - overlayWidth}px`;
        }
    }
}

// Handle mouseup event
function onMouseUp() {
    isDragging = false;
}

// Handle video input change
videoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.src = url;
        video.play();
    }
});

// Handle video metadata loaded
video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    updateOverlaySizeAndPosition();
});

// Process video frame by frame
video.addEventListener('play', () => {
    const processFrame = () => {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (overlay.style.display === "block") {
                const x = parseFloat(overlay.style.left);
                const y = parseFloat(overlay.style.top);
                const width = parseFloat(overlay.style.width);
                const height = parseFloat(overlay.style.height);

                const roi = ctx.getImageData(x, y, width, height);
                roiCanvas.width = width;
                roiCanvas.height = height;
                roiCtx.putImageData(roi, 0, 0);
            }
            requestAnimationFrame(processFrame);
        }
    };
    processFrame();
});

// Update overlay size and position
function updateOverlaySizeAndPosition() {
    if (overlay.style.display === "block") {
        const overlayHeight = canvas.height;
        const overlayWidth = overlayHeight * aspectRatioValue;
        overlay.style.height = `${overlayHeight}px`;
        overlay.style.width = `${overlayWidth}px`;
        overlay.style.left = `${(canvas.width - overlayWidth) / 2}px`;
        overlay.style.top = "0px";
    }
}


video.addEventListener('ended', () => {
    generatePreviewButton.disabled = false;
});



// Generate JSON file and download it
generatePreviewButton.addEventListener('click', () => {
    if(generatePreviewButton.disabled === true){
        window.alert("Please wait until the video ends");
    }
    else{
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
});
