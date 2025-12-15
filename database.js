/**
 * Database Manager
 * Handles interaction with ingredient database and user history
 */

class DatabaseManager {
    constructor() {
        this.ingredients = [];
        this.history = [];
        this.currentFilters = {
            search: '',
            riskLevel: '',
            category: ''
        };
    }
    
    async initialize() {
        await this.loadIngredients();
        await this.loadHistory();
        this.setupEventListeners();
        this.renderIngredients();
        this.renderHistory();
        console.log('Database manager initialized');
    }
    
    setupEventListeners() {
        // Ingredient search and filters
        const ingredientSearch = document.getElementById('ingredient-search');
        const riskFilter = document.getElementById('risk-filter');
        const categoryFilter = document.getElementById('category-filter');
        
        if (ingredientSearch) {
            ingredientSearch.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.renderIngredients();
            });
        }
        
        if (riskFilter) {
            riskFilter.addEventListener('change', (e) => {
                this.currentFilters.riskLevel = e.target.value;
                this.renderIngredients();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.renderIngredients();
            });
        }
        
        // History search
        const historySearch = document.getElementById('history-search');
        if (historySearch) {
            historySearch.addEventListener('input', (e) => {
                this.filterHistory(e.target.value.toLowerCase());
            });
        }
    }
    
    async loadIngredients() {
        try {
            const response = await fetch('tables/ingredients?limit=100');
            const data = await response.json();
            this.ingredients = data.data || [];
            console.log(`Loaded ${this.ingredients.length} ingredients`);
        } catch (error) {
            console.error('Error loading ingredients:', error);
            this.ingredients = [];
        }
    }
    
    async loadHistory() {
        try {
            const sessionId = this.getSessionId();
            const response = await fetch(`tables/user_history?limit=50&sort=-date`);
            const data = await response.json();
            this.history = data.data || [];
            console.log(`Loaded ${this.history.length} history items`);
        } catch (error) {
            console.error('Error loading history:', error);
            this.history = [];
        }
    }
    
    filterIngredients() {
        return this.ingredients.filter(ingredient => {
            const matchesSearch = !this.currentFilters.search || 
                ingredient.name.toLowerCase().includes(this.currentFilters.search) ||
                (ingredient.alternative_names && ingredient.alternative_names.some(alt => 
                    alt.toLowerCase().includes(this.currentFilters.search)
                ));
            
            const matchesRisk = !this.currentFilters.riskLevel || 
                ingredient.risk_level === this.currentFilters.riskLevel;
            
            const matchesCategory = !this.currentFilters.category || 
                ingredient.category === this.currentFilters.category;
            
            return matchesSearch && matchesRisk && matchesCategory;
        });
    }
    
    renderIngredients() {
        const container = document.getElementById('ingredients-list');
        if (!container) return;
        
        const filteredIngredients = this.filterIngredients();
        
        if (filteredIngredients.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron ingredientes con los filtros aplicados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredIngredients.map(ingredient => 
            this.generateIngredientCard(ingredient)
        ).join('');
    }
    
    generateIngredientCard(ingredient) {
        const riskIcons = {
            'muy_seguro': 'fa-shield-alt',
            'seguro': 'fa-check-circle',
            'moderado': 'fa-exclamation-triangle',
            'alto_riesgo': 'fa-exclamation-circle',
            'peligroso': 'fa-skull-crossbones'
        };
        
        const alternativeNames = ingredient.alternative_names ? 
            ingredient.alternative_names.join(', ') : '';
        
        return `
            <div class="ingredient-item" onclick="window.databaseManager.showIngredientDetails('${ingredient.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${ingredient.name}</div>
                        <div class="item-meta">
                            ${ingredient.category} 
                            ${ingredient.e_number ? `• ${ingredient.e_number}` : ''}
                        </div>
                        ${alternativeNames ? `<div class="item-meta" style="font-size: 12px; color: #999;">También conocido como: ${alternativeNames}</div>` : ''}
                    </div>
                    <span class="risk-badge risk-${ingredient.risk_level}">
                        <i class="fas ${riskIcons[ingredient.risk_level] || 'fa-question'}"></i>
                        ${ingredient.risk_level.replace('_', ' ')}
                    </span>
                </div>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    ${ingredient.description || 'Sin descripción disponible'}
                </p>
            </div>
        `;
    }
    
    showIngredientDetails(ingredientId) {
        const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
        if (!ingredient) return;
        
        const resultContent = document.getElementById('result-content');
        if (!resultContent) return;
        
        resultContent.innerHTML = this.generateIngredientDetailsHTML(ingredient);
        document.getElementById('result-modal').classList.add('active');
    }
    
    generateIngredientDetailsHTML(ingredient) {
        const riskColors = {
            'muy_seguro': '#4CAF50',
            'seguro': '#2196F3',
            'moderado': '#FF9800',
            'alto_riesgo': '#FF5722',
            'peligroso': '#f44336'
        };
        
        return `
            <div class="ingredient-details">
                <h2>${ingredient.name}</h2>
                <div class="detail-section">
                    <div class="risk-indicator" style="background: ${riskColors[ingredient.risk_level]}; color: white; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                        <strong>Nivel de Riesgo: ${ingredient.risk_level.replace('_', ' ').toUpperCase()}</strong>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Información General</h4>
                    <p><strong>Categoría:</strong> ${ingredient.category}</p>
                    ${ingredient.e_number ? `<p><strong>Número E:</strong> ${ingredient.e_number}</p>` : ''}
                    ${ingredient.cas_number ? `<p><strong>Número CAS:</strong> ${ingredient.cas_number}</p>` : ''}
                    ${ingredient.alternative_names?.length ? `<p><strong>Nombres alternativos:</strong> ${ingredient.alternative_names.join(', ')}</p>` : ''}
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> Impacto en Salud Humana</h4>
                    <p>${ingredient.health_impact_human || 'No hay información disponible'}</p>
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-paw"></i> Impacto en Salud Animal</h4>
                    <p>${ingredient.health_impact_animal || 'No hay información disponible'}</p>
                </div>
                
                ${ingredient.max_daily_intake ? `
                <div class="detail-section">
                    <h4><i class="fas fa-balance-scale"></i> Ingesta Diaria Máxima</h4>
                    <p>${ingredient.max_daily_intake}</p>
                </div>
                ` : ''}
                
                ${ingredient.banned_countries?.length ? `
                <div class="detail-section">
                    <h4><i class="fas fa-ban"></i> Restricciones</h4>
                    <p><strong>Países con restricciones:</strong> ${ingredient.banned_countries.join(', ')}</p>
                </div>
                ` : ''}
                
                <div class="detail-section">
                    <h4><i class="fas fa-file-alt"></i> Descripción</h4>
                    <p>${ingredient.description || 'No hay descripción disponible'}</p>
                </div>
                
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="margin-top: 20px; width: 100%;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;
    }
    
    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-history"></i>
                    <p>No hay análisis anteriores</p>
                    <p style="font-size: 14px; color: #666;">Escanea tu primer producto para comenzar</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.history.map(item => 
            this.generateHistoryCard(item)
        ).join('');
    }
    
    generateHistoryCard(historyItem) {
        const date = new Date(historyItem.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const getRiskColor = (score) => {
            if (score >= 70) return '#f44336';
            if (score >= 40) return '#FF9800';
            return '#4CAF50';
        };
        
        return `
            <div class="history-item" onclick="window.databaseManager.showAnalysisDetails('${historyItem.analysis_id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${historyItem.product_name || 'Producto Escaneado'}</div>
                        <div class="item-meta">${date}</div>
                    </div>
                    <span class="risk-badge" style="background-color: ${getRiskColor(historyItem.risk_score)}; color: white;">
                        Riesgo: ${historyItem.risk_score || 0}
                    </span>
                </div>
                ${historyItem.notes ? `<p style="margin-top: 10px; font-size: 14px; color: #666;">${historyItem.notes}</p>` : ''}
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="btn-icon ${historyItem.favorites ? 'active' : ''}" onclick="event.stopPropagation(); window.databaseManager.toggleFavorite('${historyItem.id}')" title="Favorito">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); window.databaseManager.deleteHistoryItem('${historyItem.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    filterHistory(searchTerm) {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        const filteredHistory = this.history.filter(item => 
            (item.product_name || '').toLowerCase().includes(searchTerm) ||
            (item.notes || '').toLowerCase().includes(searchTerm)
        );
        
        if (filteredHistory.length === 0 && searchTerm) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron resultados para "${searchTerm}"</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredHistory.map(item => 
            this.generateHistoryCard(item)
        ).join('');
    }
    
    async showAnalysisDetails(analysisId) {
        try {
            const response = await fetch(`tables/product_analysis/${analysisId}`);
            const analysis = await response.json();
            
            if (!analysis) {
                console.error('Analysis not found');
                return;
            }
            
            const resultContent = document.getElementById('result-content');
            if (!resultContent) return;
            
            resultContent.innerHTML = this.generateAnalysisDetailsHTML(analysis);
            document.getElementById('result-modal').classList.add('active');
            
        } catch (error) {
            console.error('Error loading analysis details:', error);
            alert('Error al cargar los detalles del análisis');
        }
    }
    
    generateAnalysisDetailsHTML(analysis) {
        const date = new Date(analysis.analysis_date).toLocaleDateString('es-ES');
        const recommendations = analysis.recommendations ? 
            JSON.parse(analysis.recommendations) : [];
        
        return `
            <div class="analysis-details">
                <h2>${analysis.product_name}</h2>
                <p style="color: #666; margin-bottom: 20px;">Análisis del ${date}</p>
                
                <div class="score-container" style="margin-bottom: 20px;">
                    <div class="score-item">
                        <div class="score-value" style="color: ${analysis.health_score_human >= 70 ? '#4CAF50' : analysis.health_score_human >= 40 ? '#FF9800' : '#f44336'}">
                            ${analysis.health_score_human}
                        </div>
                        <div class="score-label">Salud Humana</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value" style="color: ${analysis.health_score_animal >= 70 ? '#4CAF50' : analysis.health_score_animal >= 40 ? '#FF9800' : '#f44336'}">
                            ${analysis.health_score_animal}
                        </div>
                        <div class="score-label">Salud Animal</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value" style="color: ${analysis.risk_score <= 30 ? '#4CAF50' : analysis.risk_score <= 60 ? '#FF9800' : '#f44336'}">
                            ${analysis.risk_score}
                        </div>
                        <div class="score-label">Riesgo</div>
                    </div>
                </div>
                
                ${recommendations.map(rec => `
                    <div class="recommendation" style="margin: 15px 0; padding: 15px; border-radius: 8px; background: ${rec.type === 'danger' ? '#ffebee' : rec.type === 'warning' ? '#fff3e0' : rec.type === 'success' ? '#e8f5e8' : '#e3f2fd'};">
                        <h4>${rec.title}</h4>
                        <p>${rec.message}</p>
                    </div>
                `).join('')}
                
                <div style="margin-top: 20px;">
                    <h4>Ingredientes Detectados</h4>
                    <div class="ingredient-tags">
                        ${(analysis.ingredients_detected || []).map(ing => 
                            `<span class="ingredient-tag tag-neutral">${ing}</span>`
                        ).join('')}
                    </div>
                </div>
                
                ${analysis.harmful_ingredients?.length ? `
                <div style="margin-top: 15px;">
                    <h4 style="color: #f44336;">Ingredientes Perjudiciales</h4>
                    <div class="ingredient-tags">
                        ${analysis.harmful_ingredients.map(ing => 
                            `<span class="ingredient-tag tag-harmful">${ing}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${analysis.beneficial_ingredients?.length ? `
                <div style="margin-top: 15px;">
                    <h4 style="color: #4CAF50;">Ingredientes Beneficiosos</h4>
                    <div class="ingredient-tags">
                        ${analysis.beneficial_ingredients.map(ing => 
                            `<span class="ingredient-tag tag-beneficial">${ing}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                
                <button class="btn btn-primary" onclick="document.getElementById('result-modal').classList.remove('active')" style="margin-top: 20px; width: 100%;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;
    }
    
    async toggleFavorite(historyId) {
        try {
            const historyItem = this.history.find(item => item.id === historyId);
            if (!historyItem) return;
            
            const newFavoriteStatus = !historyItem.favorites;
            
            await fetch(`tables/user_history/${historyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favorites: newFavoriteStatus })
            });
            
            // Update local data
            historyItem.favorites = newFavoriteStatus;
            this.renderHistory();
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }
    
    async deleteHistoryItem(historyId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este análisis?')) return;
        
        try {
            await fetch(`tables/user_history/${historyId}`, {
                method: 'DELETE'
            });
            
            // Remove from local data
            this.history = this.history.filter(item => item.id !== historyId);
            this.renderHistory();
            
        } catch (error) {
            console.error('Error deleting history item:', error);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('healthscan_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
            localStorage.setItem('healthscan_session_id', sessionId);
        }
        return sessionId;
    }
    
    async refresh() {
        await this.loadIngredients();
        await this.loadHistory();
        this.renderIngredients();
        this.renderHistory();
    }
}

// Initialize database manager
document.addEventListener('DOMContentLoaded', () => {
    window.databaseManager = new DatabaseManager();
});