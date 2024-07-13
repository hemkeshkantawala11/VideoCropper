const videoFileInput = document.getElementById('videoFileInput');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const processedCanvas = document.getElementById('processedCanvas');
const processedContext = processedCanvas.getContext('2d');
let isSelecting = false;
let startX, startY, endX, endY;

// Load selected video file
videoFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;
        video.style.display = 'block';
    }
});

// Function to process each video frame
function processFrame() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // If a region has been selected, draw it on the processed canvas
    if (startX !== undefined && startY !== undefined && endX !== undefined && endY !== undefined) {
        const width = endX - startX;
        const height = endY - startY;
        const roi = context.getImageData(startX, startY, width, height);

        // Create a temporary canvas for resizing the ROI
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempContext = tempCanvas.getContext('2d');
        tempContext.putImageData(roi, 0, 0);

        // Resize the ROI to fit the processed canvas
        processedContext.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        processedContext.drawImage(tempCanvas, 0, 0, processedCanvas.width, processedCanvas.height);
    }

    // Continue processing the next frame if the video is playing
    if (!video.paused && !video.ended) {
        requestAnimationFrame(processFrame);
    }
}

// Handle mouse events to select a region of interest
canvas.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.offsetX;
    startY = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isSelecting) {
        endX = e.offsetX;
        endY = e.offsetY;
        // Draw the selection rectangle
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.strokeRect(startX, startY, endX - startX, endY - startY);
    }
});

canvas.addEventListener('mouseup', () => {
    isSelecting = false;
});

// Start processing frames when the video plays
video.addEventListener('play', () => {
    requestAnimationFrame(processFrame);
});
