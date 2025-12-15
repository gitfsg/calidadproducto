/**
 * Main Application Controller
 * Handles navigation, initialization, and coordination between modules
 */

class HealthScanApp {
    constructor() {
        this.currentTab = 'scanner';
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing HealthScan App...');
        
        try {
            // Setup navigation
            this.setupNavigation();
            
            // Setup modal event listeners
            this.setupModals();
            
            // Initialize database manager
            if (window.databaseManager) {
                await window.databaseManager.initialize();
            }
            
            // Setup PWA features
            this.setupPWA();
            
            // Check device capabilities
            this.checkDeviceCapabilities();
            
            // Set initial active tab
            this.switchTab('scanner');
            
            this.isInitialized = true;
            console.log('HealthScan App initialized successfully');
            
            // Show welcome message for first-time users
            this.showWelcomeIfNeeded();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al inicializar la aplicación: ' + error.message);
        }
    }
    
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        console.log('Navigation setup completed');
    }
    
    switchTab(tabId) {
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tab and button
        const targetTab = document.getElementById(`${tabId}-tab`);
        const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetButton) {
            targetTab.classList.add('active');
            targetButton.classList.add('active');
            this.currentTab = tabId;
            
            // Trigger tab-specific initialization
            this.onTabSwitch(tabId);
            
            console.log(`Switched to tab: ${tabId}`);
        }
    }
    
    onTabSwitch(tabId) {
        switch (tabId) {
            case 'database':
                // Refresh database when switching to database tab
                if (window.databaseManager) {
                    window.databaseManager.renderIngredients();
                }
                break;
                
            case 'history':
                // Refresh history when switching to history tab
                if (window.databaseManager) {
                    window.databaseManager.renderHistory();
                }
                break;
                
            case 'scanner':
                // Stop camera if running when leaving scanner tab
                if (window.cameraManager && this.currentTab !== 'scanner') {
                    window.cameraManager.stopCamera();
                }
                break;
        }
    }
    
    setupModals() {
        // Close result modal
        const closeResultModal = document.getElementById('close-result-modal');
        if (closeResultModal) {
            closeResultModal.addEventListener('click', () => {
                document.getElementById('result-modal').classList.remove('active');
            });
        }
        
        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }
    
    setupPWA() {
        // Register service worker if available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
        
        // Handle install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallPrompt(deferredPrompt);
        });
        
        // Handle app installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    }
    
    showInstallPrompt(deferredPrompt) {
        // Create install button if it doesn't exist
        if (!document.getElementById('install-button')) {
            const installButton = document.createElement('button');
            installButton.id = 'install-button';
            installButton.className = 'btn btn-outline';
            installButton.innerHTML = '<i class="fas fa-download"></i> Instalar App';
            installButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
            
            installButton.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to install prompt: ${outcome}`);
                    deferredPrompt = null;
                    this.hideInstallPrompt();
                }
            });
            
            document.body.appendChild(installButton);
        }
    }
    
    hideInstallPrompt() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.remove();
        }
    }
    
    checkDeviceCapabilities() {
        const capabilities = {
            camera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            localStorage: typeof Storage !== 'undefined',
            touchScreen: 'ontouchstart' in window,
            mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
        
        console.log('Device capabilities:', capabilities);
        
        // Show appropriate UI elements based on capabilities
        if (!capabilities.camera) {
            const cameraControls = document.querySelector('.camera-controls');
            if (cameraControls) {
                cameraControls.style.display = 'none';
            }
            console.warn('Camera not available on this device');
        }
        
        // Optimize for mobile
        if (capabilities.mobile) {
            document.body.classList.add('mobile-device');
            
            // Prevent zoom on input focus
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('focus', this.preventZoom);
                input.addEventListener('blur', this.restoreZoom);
            });
        }
        
        return capabilities;
    }
    
    preventZoom() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
    
    restoreZoom() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        }
    }
    
    showWelcomeIfNeeded() {
        const hasVisited = localStorage.getItem('healthscan_has_visited');
        
        if (!hasVisited) {
            setTimeout(() => {
                this.showWelcomeMessage();
                localStorage.setItem('healthscan_has_visited', 'true');
            }, 1000);
        }
    }
    
    showWelcomeMessage() {
        const resultContent = document.getElementById('result-content');
        if (!resultContent) return;
        
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-leaf" style="font-size: 48px; color: #4CAF50; margin-bottom: 20px;"></i>
                <h2>¡Bienvenido a HealthScan!</h2>
                <p style="margin: 20px 0; color: #666;">
                    Tu asistente personal para analizar ingredientes de productos y determinar su impacto en la salud.
                </p>
                <div style="text-align: left; margin: 20px 0;">
                    <h4><i class="fas fa-camera"></i> Escanear Productos</h4>
                    <p style="font-size: 14px; color: #666;">Toma fotos de etiquetas para analizar ingredientes automáticamente</p>
                    
                    <h4><i class="fas fa-shield-alt"></i> Análisis de Seguridad</h4>
                    <p style="font-size: 14px; color: #666;">Evaluamos el riesgo para la salud humana y animal</p>
                    
                    <h4><i class="fas fa-database"></i> Base de Datos</h4>
                    <p style="font-size: 14px; color: #666;">Consulta información detallada sobre ingredientes</p>
                    
                    <h4><i class="fas fa-history"></i> Historial</h4>
                    <p style="font-size: 14px; color: #666;">Revisa tus análisis anteriores</p>
                </div>
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="width: 100%; margin-top: 20px;">
                    <i class="fas fa-rocket"></i> ¡Comenzar!
                </button>
            </div>
        `;
        
        document.getElementById('result-modal').classList.add('active');
    }
    
    showError(message) {
        const resultContent = document.getElementById('result-content');
        if (!resultContent) {
            alert(message);
            return;
        }
        
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f44336; margin-bottom: 20px;"></i>
                <h3>Error</h3>
                <p style="margin: 20px 0; color: #666;">${message}</p>
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="width: 100%;">
                    <i class="fas fa-check"></i> Cerrar
                </button>
            </div>
        `;
        
        document.getElementById('result-modal').classList.add('active');
    }
    
    showSuccess(message) {
        const resultContent = document.getElementById('result-content');
        if (!resultContent) {
            alert(message);
            return;
        }
        
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50; margin-bottom: 20px;"></i>
                <h3>Éxito</h3>
                <p style="margin: 20px 0; color: #666;">${message}</p>
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="width: 100%;">
                    <i class="fas fa-check"></i> Cerrar
                </button>
            </div>
        `;
        
        document.getElementById('result-modal').classList.add('active');
    }
    
    // Utility method to refresh all data
    async refreshData() {
        if (window.databaseManager) {
            await window.databaseManager.refresh();
        }
    }
    
    // Method to handle offline functionality
    handleOffline() {
        window.addEventListener('online', () => {
            console.log('App is online');
            this.refreshData();
        });
        
        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.showError('Sin conexión a internet. Algunas funciones pueden no estar disponibles.');
        });
    }
}

// Global app instance
window.healthScanApp = new HealthScanApp();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.healthScanApp.initialize();
        
        // Handle offline functionality
        window.healthScanApp.handleOffline();
        
    } catch (error) {
        console.error('Error starting HealthScan app:', error);
    }
});

// Add some utility CSS classes for the app
const style = document.createElement('style');
style.textContent = `
    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.3s;
    }
    
    .btn-icon:hover {
        background: #f0f0f0;
        color: #333;
    }
    
    .btn-icon.active {
        color: #f44336;
    }
    
    .no-results {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .no-results i {
        font-size: 48px;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .detail-section {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }
    
    .detail-section:last-child {
        border-bottom: none;
    }
    
    .detail-section h4 {
        margin-bottom: 10px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .mobile-device .btn {
        min-height: 44px; /* Better touch targets on mobile */
    }
    
    @media (max-width: 480px) {
        .detail-section {
            margin-bottom: 15px;
        }
    }
`;
document.head.appendChild(style);