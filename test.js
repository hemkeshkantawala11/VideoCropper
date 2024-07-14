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

let aspectRatioValue = 9 / 16;
let isDragging = false;
let startX;

function splitString(ratio) {
    const parts = ratio.split(":");
    const num1 = parseInt(parts[0], 10);
    const num2 = parseInt(parts[1], 10);
    return [num1, num2];
}

aspectRatio.addEventListener('change', () => {
    const [num1, num2] = splitString(aspectRatio.value);
    aspectRatioValue = num1 / num2;
    if (overlay.style.display === "block") {
        updateOverlaySizeAndPosition();
    }
});

playbackRateControl.addEventListener('change', () => {
    video.playbackRate = playbackRateControl.value;
});

volumeControl.addEventListener('input', () => {
    video.volume = volumeControl.value;
});

timelineControl.addEventListener('input', () => {
    video.currentTime = video.duration * (timelineControl.value / 100);
});

video.addEventListener('timeupdate', () => {
    timelineControl.value = (video.currentTime / video.duration) * 100;
});

playButton.addEventListener('click', () => {
    video.play();
});

pauseButton.addEventListener('click', () => {
    video.pause();
});

startCropper.addEventListener("click", () => {
    const videoRect = video.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const overlayHeight = canvas.height;
    const overlayWidth = overlayHeight * aspectRatioValue;

    overlay.style.display = "block";
    overlay.style.height = `${overlayHeight}px`;
    overlay.style.width = `${overlayWidth}px`;
    overlay.style.left = `${(canvas.width - overlayWidth) / 2}px`;
    overlay.style.top = "0px";

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
});

stopCropper.addEventListener("click", () => {
    overlay.style.display = "none";
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
});

function onMouseDown(event) {
    isDragging = true;
    startX = event.offsetX - parseFloat(overlay.style.left);
}

function onMouseMove(event) {
    if (isDragging) {
        const newLeft = event.offsetX - startX;
        const overlayWidth = parseFloat(overlay.style.width);

        // Ensure overlay stays within video bounds
        if (newLeft >= 0 && newLeft + overlayWidth <= canvas.width) {
            overlay.style.left = `${newLeft}px`;
        } else if (newLeft < 0) {
            overlay.style.left = `0px`;
        } else if (newLeft + overlayWidth > canvas.width) {
            overlay.style.left = `${canvas.width - overlayWidth}px`;
        }
    }
}

function onMouseUp() {
    isDragging = false;
}

videoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.src = url;
        video.play();
        // video.style.display = "block";
    }
});

video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    updateOverlaySizeAndPosition();
});

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
