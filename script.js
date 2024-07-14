const videoInput = document.getElementById('videoInput');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const roiCanvas = document.getElementById('roiCanvas');
const roiCtx = roiCanvas.getContext('2d');
const aspectRatio = document.getElementById("aspectRatio");
const startCropper = document.getElementById("startCropper");
const stopCropper = document.getElementById("stopCropper");
const generatePreview = document.getElementById("generatePreview");

const playbackRateControl = document.getElementById('playbackRate');
const volumeControl = document.getElementById('volumeControl');
const timelineControl = document.getElementById('timeline');

const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');

const overlay = document.getElementsByClassName('overlay');

let isSelecting = false;
let startX, startY, endX, endY;
let selected = false;
let isDragging = false;

let aspectRatioValue = 9 / 16;

function splitString(ratio) {
    const parts = ratio.split(":");
    const num1 = parseInt(parts[0], 10);
    const num2 = parseInt(parts[1], 10);
    return [num1, num2];
}

aspectRatio.addEventListener('change', () => {
    const [num1, num2] = splitString(aspectRatio.value);
    aspectRatioValue = num1 / num2;
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

    canvas.addEventListener('mousedown', (event) => {
        startX = event.offsetX;
        startY = event.offsetY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (selected) {
            endX = event.offsetX;
            endY = event.offsetY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        selected = true;
    });
    roiCanvas.style.display = "block";
    
    overlay[0].style.display = "block";


});

stopCropper.addEventListener("click", () => {
    canvas.removeEventListener('mousedown', () => {});
    canvas.removeEventListener('mousemove', () => {});
    canvas.removeEventListener('mouseup', () => {});
    roiCanvas.style.display = "none";
    overlay[0].style.display = "none";
});


videoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.src = url;
        video.play();
    }
});

video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        console.log("Mouse up");
        isDragging = false;
        overlay.style.pointerEvents = "auto"; // Re-enable pointer events after dragging
    }
});

video.addEventListener('play', () => {
    const processFrame = () => {
        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (selected) {
                let x = startX;
                const y = 0;
                const videoHeight = video.videoHeight;
                const videoWidth = videoHeight * aspectRatioValue;

                if (x > Math.abs(canvas.width - videoWidth)) {
                    x = Math.abs(canvas.width - videoWidth);
                }

                const roi = ctx.getImageData(x, y, videoWidth, videoHeight);

                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = videoWidth;
                tempCanvas.height = videoHeight;
                tempCtx.putImageData(roi, 0, 0);

                roiCanvas.width = videoWidth;
                roiCanvas.height = videoHeight;
                roiCtx.clearRect(0, 0, roiCanvas.width, roiCanvas.height);
                roiCtx.drawImage(tempCanvas, 0, 0, videoWidth, videoHeight, 0, 0, roiCanvas.width, roiCanvas.height);
            }

            requestAnimationFrame(processFrame);
        }
    };

    processFrame();
});
