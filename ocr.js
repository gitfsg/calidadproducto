/**
 * OCR (Optical Character Recognition) functionality
 * Uses Tesseract.js to extract text from images
 */

class OCRManager {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.supportedLanguages = ['spa', 'eng']; // Spanish and English
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('Initializing OCR worker...');
            
            // Update loading text
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.textContent = 'Inicializando OCR...';
            
            // Create and initialize worker
            this.worker = await Tesseract.createWorker({
                logger: (m) => {
                    console.log('OCR:', m);
                    if (loadingText && m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        loadingText.textContent = `Analizando texto... ${progress}%`;
                    }
                }
            });
            
            // Load languages
            await this.worker.loadLanguage('spa+eng');
            await this.worker.initialize('spa+eng');
            
            // Configure parameters for better ingredient recognition
            await this.worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúñÁÉÍÓÚÑ0123456789()[]{}.,;:%-+/ ',
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            });
            
            this.isInitialized = true;
            console.log('OCR worker initialized successfully');
            
        } catch (error) {
            console.error('Error initializing OCR:', error);
            throw new Error('No se pudo inicializar el reconocimiento de texto');
        }
    }
    
    async processImage(imageData) {
        try {
            await this.initialize();
            
            console.log('Starting OCR recognition...');
            
            // Update loading text
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.textContent = 'Leyendo ingredientes...';
            
            // Recognize text
            const { data: { text } } = await this.worker.recognize(imageData);
            
            console.log('OCR completed, extracted text:', text);
            
            // Process the extracted text
            const processedText = this.preprocessText(text);
            const ingredients = this.extractIngredients(processedText);
            
            console.log('Extracted ingredients:', ingredients);
            
            // Hide loading modal
            document.getElementById('loading-modal').classList.remove('active');
            
            // Analyze ingredients
            if (window.analysisManager) {
                await window.analysisManager.analyzeIngredients(ingredients, processedText, imageData);
            } else {
                throw new Error('Analysis Manager not available');
            }
            
        } catch (error) {
            console.error('Error in OCR processing:', error);
            document.getElementById('loading-modal').classList.remove('active');
            throw error;
        }
    }
    
    preprocessText(text) {
        if (!text) return '';
        
        // Clean up the text
        let processed = text
            .trim()
            .replace(/\\n/g, ' ') // Replace newlines
            .replace(/\\s+/g, ' ') // Replace multiple spaces
            .replace(/[""]/g, '') // Remove quotes
            .replace(/\\([^)]*\\)/g, '') // Remove content in parentheses (often allergen info)
            .replace(/E\\d{3,4}[a-z]?/gi, (match) => match.toUpperCase()) // Standardize E-numbers
            .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') // Remove accents for better matching
            ;
        
        console.log('Preprocessed text:', processed);
        return processed;
    }
    
    extractIngredients(text) {
        if (!text) return [];
        
        // Common patterns for ingredient lists
        const patterns = [
            /ingredientes?[:.]?\\s*([^.]+)/i,
            /ingredients?[:.]?\\s*([^.]+)/i,
            /composici[oó]n[:.]?\\s*([^.]+)/i,
            /contiene[:.]?\\s*([^.]+)/i
        ];
        
        let ingredientText = '';
        
        // Try to find ingredient section
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                ingredientText = match[1];
                break;
            }
        }
        
        // If no pattern matched, use the entire text
        if (!ingredientText) {
            ingredientText = text;
        }
        
        // Split ingredients by common separators
        const separators = /[,;]/g;
        let ingredients = ingredientText
            .split(separators)
            .map(ingredient => ingredient.trim())
            .filter(ingredient => ingredient.length > 2) // Filter out very short strings
            .map(ingredient => this.cleanIngredientName(ingredient))
            .filter(ingredient => ingredient && ingredient.length > 2);
        
        // Remove duplicates
        ingredients = [...new Set(ingredients.map(i => i.toLowerCase()))];
        
        console.log('Extracted ingredients:', ingredients);
        return ingredients;
    }
    
    cleanIngredientName(ingredient) {
        if (!ingredient) return '';
        
        return ingredient
            .trim()
            .replace(/^[^a-zA-ZáéíóúñÁÉÍÓÚÑ]+/, '') // Remove leading non-letter characters
            .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\\s()-]+$/, '') // Remove trailing special characters
            .replace(/\\b(y|and|e|,|;)\\b.*/, '') // Remove "and" and everything after
            .replace(/\\([^)]*\\)/, '') // Remove parentheses content
            .trim();
    }
    
    // Method to test OCR with sample text
    async testOCR() {
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        try {
            await this.processImage(testImage);
            console.log('OCR test completed');
        } catch (error) {
            console.error('OCR test failed:', error);
        }
    }
    
    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
            console.log('OCR worker terminated');
        }
    }
}

// Initialize OCR manager
document.addEventListener('DOMContentLoaded', () => {
    window.ocrManager = new OCRManager();
    console.log('OCR manager created');
});