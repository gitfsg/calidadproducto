/**
 * Camera functionality for mobile devices
 * Handles camera access, photo capture, and image processing
 */

class CameraManager {
    constructor() {
        this.stream = null;
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.startButton = document.getElementById('start-camera');
        this.captureButton = document.getElementById('capture-photo');
        this.stopButton = document.getElementById('stop-camera');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCamera());
        this.captureButton.addEventListener('click', () => this.capturePhoto());
        this.stopButton.addEventListener('click', () => this.stopCamera());
        
        // File input handling
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop handling
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.processImageFile(files[0]);
            }
        });
    }
    
    async startCamera() {
        try {
            // Request camera access with rear camera preference
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' }, // Prefer rear camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Update UI
            this.video.style.display = 'block';
            document.querySelector('.camera-overlay').style.display = 'block';
            this.startButton.style.display = 'none';
            this.captureButton.style.display = 'inline-flex';
            this.stopButton.style.display = 'inline-flex';
            
            console.log('Camera started successfully');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara a la aplicación.');
        }
    }
    
    capturePhoto() {
        if (!this.stream) {
            this.showError('La cámara no está activa');
            return;
        }
        
        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw video frame to canvas
        this.ctx.drawImage(this.video, 0, 0);
        
        // Get image data
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        // Process the captured image
        this.processImage(imageData);
        
        console.log('Photo captured');
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Update UI
        this.video.style.display = 'none';
        document.querySelector('.camera-overlay').style.display = 'none';
        this.startButton.style.display = 'inline-flex';
        this.captureButton.style.display = 'none';
        this.stopButton.style.display = 'none';
        
        console.log('Camera stopped');
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        }
    }
    
    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    async processImage(imageData) {
        try {
            console.log('Processing image...');
            
            // Show loading modal
            document.getElementById('loading-modal').classList.add('active');
            document.getElementById('loading-text').textContent = 'Procesando imagen...';
            
            // Stop camera if running
            this.stopCamera();
            
            // Process with OCR
            if (window.ocrManager) {
                await window.ocrManager.processImage(imageData);
            } else {
                throw new Error('OCR Manager not available');
            }
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.showError('Error al procesar la imagen: ' + error.message);
            document.getElementById('loading-modal').classList.remove('active');
        }
    }
    
    showError(message) {
        alert(message); // Replace with better error handling in production
    }
    
    // Check if camera is supported
    static isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
    
    // Check if we're on mobile
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}

// Initialize camera manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (CameraManager.isCameraSupported()) {
        window.cameraManager = new CameraManager();
        console.log('Camera manager initialized');
    } else {
        console.warn('Camera not supported on this device');
        // Hide camera controls and show only file upload
        document.querySelector('.camera-controls').style.display = 'none';
    }
});